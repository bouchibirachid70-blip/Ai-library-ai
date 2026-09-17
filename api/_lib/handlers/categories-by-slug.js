// /api/categories/slug/[slug] — public lookup by slug.

import { handleOptions } from '../cors.js';
import { badRequest, notFound, serverError } from '../validation.js';
import supabase from '../db-client.js';

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const slug = String(req.query.slug || '').toLowerCase();
    if (!SLUG_RE.test(slug)) return badRequest(res, 'Invalid slug');

    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, icon, description, created_at')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) return notFound(res);
    return res.status(200).json(data);
  } catch (err) {
    return serverError(res, err);
  }
}
