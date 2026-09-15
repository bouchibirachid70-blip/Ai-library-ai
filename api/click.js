// /api/click — public, rate-limited, atomic click tracking.
//
// We never do read-modify-write on tools.clicks_count. Instead:
//   1. INSERT one row into clicks (the canonical click event log).
//   2. Issue an UPDATE tools SET clicks_count = clicks_count + 1 WHERE id = ?
//      via Supabase's `.rpc()` of an atomic SQL function. The function is
//      defined in supabase/migrations/0002_click_function.sql. If the function
//      is not installed in the target database, the click event is still
//      recorded and the live count can be derived from the clicks table; the
//      call returns ok=true either way.

import { handleOptions } from './_lib/cors.js';
import { notFound, serverError, requireUuid } from './_lib/validation.js';
import { rateLimit, hashIp } from './_lib/ratelimit.js';
import supabase from './_lib/db-client.js';
import { RATE_LIMITS } from './_lib/constants.js';

const REFERRER_MAX = 500;

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const limit = rateLimit(req, RATE_LIMITS.click);
    res.setHeader('X-RateLimit-Remaining', String(limit.remaining));
    if (!limit.allowed) {
      res.setHeader('Retry-After', String(Math.ceil((limit.reset - Date.now()) / 1000)));
      return res.status(429).json({ error: 'Too many requests' });
    }

    const body = req.body || {};
    const toolId = body.tool_id;
    if (!requireUuid(toolId, res, 'tool_id')) return;

    // Only approved tools are publicly clickable. This prevents inflating the
    // counter for pending/rejected/draft tools and avoids a 500 on a dangling
    // FK when the id does not exist. The query uses a head/count request so no
    // row data is fetched.
    const { count, error: existErr } = await supabase
      .from('tools')
      .select('id', { count: 'exact', head: true })
      .eq('id', toolId)
      .eq('status', 'approved');
    if (existErr) throw existErr;
    if (!count || count === 0) return notFound(res, 'Tool not found');

    const referrer =
      typeof body.referrer === 'string' ? body.referrer.slice(0, REFERRER_MAX) : null;
    const xff = req.headers?.['x-forwarded-for'];
    const ip = (typeof xff === 'string' && xff.split(',')[0].trim()) || req.socket?.remoteAddress || null;
    const ipHash = hashIp(ip);

    // 1. Insert event.
    const { data: click, error: insertErr } = await supabase
      .from('clicks')
      .insert({ tool_id: toolId, referrer, ip_hash: ipHash })
      .select('id, tool_id, clicked_at')
      .single();
    if (insertErr) throw insertErr;

    // 2. Atomic increment of the denormalized counter via RPC. If the RPC
    //    function is not installed, .rpc() returns an error we swallow (the
    //    click is still recorded).
    let rpcError = null;
    try {
      const { error } = await supabase.rpc('increment_tool_clicks', { p_tool_id: toolId });
      rpcError = error;
    } catch (err) {
      rpcError = err;
    }

    return res.status(201).json({
      ok: true,
      id: click.id,
      rpc_available: !rpcError,
    });
  } catch (err) {
    return serverError(res, err);
  }
}
