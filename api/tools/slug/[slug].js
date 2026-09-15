// /api/tools/slug/[slug] — public lookup of an approved tool by slug.
// Also bumps the live click count atomically (see /api/click for the
// click-tracking write path; this endpoint is read-only).

import { handleOptions } from '../../_lib/cors.js';
import { badRequest, notFound, serverError } from '../../_lib/validation.js';
import supabase from '../../_lib/db-client.js';

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const slug = String(req.query.slug || '').toLowerCase();
    if (!SLUG_RE.test(slug)) return badRequest(res, 'Invalid slug');

    const { data, error } = await supabase
      .from('tools')
      .select('*, category:categories(id, name, slug, icon)')
      .eq('slug', slug)
      .eq('status', 'approved')
      .maybeSingle();
    if (error) throw error;
    if (!data) return notFound(res);
    return res.status(200).json(data);
  } catch (err) {
    return serverError(res, err);
  }
}
