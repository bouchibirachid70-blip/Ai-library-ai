// /api/ad-slots
//   GET  — public: active ad slots only (id, position, code). Optionally
//          filter with ?position=xxx. This is what the frontend AdSlot
//          component calls to render ad code in the page.
//   POST — admin: create a new ad slot for any position string.

import { handleOptions } from '../_lib/cors.js';
import {
  asString,
  asOptionalString,
  asBool,
  badRequest,
  serverError,
  pick,
  allowedAdSlotFields,
} from '../_lib/validation.js';
import { requireAdmin } from '../_lib/auth.js';
import supabase from '../_lib/db-client.js';
import { TEXT_LIMITS } from '../_lib/constants.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  try {
    if (req.method === 'GET') return listActiveAdSlots(req, res);
    if (req.method === 'POST') return createAdSlot(req, res);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return serverError(res, err);
  }
}

async function listActiveAdSlots(req, res) {
  const position = asOptionalString(req.query.position, TEXT_LIMITS.ad_slot_position);

  let query = supabase
    .from('ad_slots')
    .select('id, position, code')
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (position) query = query.eq('position', position);

  const { data, error } = await query;
  if (error) throw error;
  return res.status(200).json({ data: data || [] });
}

async function createAdSlot(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const body = req.body || {};
  const fields = pick(body, allowedAdSlotFields());

  const position = asString(fields.position, TEXT_LIMITS.ad_slot_position);
  const code = asString(fields.code, TEXT_LIMITS.ad_slot_code);
  if (!position) return badRequest(res, 'position is required');
  if (!code) return badRequest(res, 'code is required');
  const is_active = asBool(fields.is_active, true);

  const { data, error } = await supabase
    .from('ad_slots')
    .insert({ position, code, is_active })
    .select()
    .single();
  if (error) throw error;
  return res.status(201).json(data);
}
