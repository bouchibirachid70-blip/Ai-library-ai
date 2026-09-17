// /api/articles/slug/[slug] — public if published, admin otherwise.

import { handleOptions } from '../cors.js';
import { badRequest, notFound, serverError } from '../validation.js';
import { requireAdmin } from '../auth.js';
import supabase from '../db-client.js';

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const slug = String(req.query.slug || '').toLowerCase();
    if (!SLUG_RE.test(slug)) return badRequest(res, 'Invalid slug');

    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) return notFound(res);
    if (!data.published) {
      const admin = await requireAdmin(req, res);
      if (!admin) return notFound(res);
    }
    return res.status(200).json(data);
  } catch (err) {
    return serverError(res, err);
  }
}
