// /api/admin/tools
// Admin-only listing of tools across all statuses, with pagination and search.
// Uses the service-role client to bypass the public RLS filter on tools.

import { handleOptions } from '../_lib/cors.js';
import {
  asEnum,
  paginationParams,
  sanitizeSearch,
  serverError,
} from '../_lib/validation.js';
import { requireAdmin } from '../_lib/auth.js';
import supabase from '../_lib/db-client.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const { page, perPage, from, to } = paginationParams(req.query);
    const search = sanitizeSearch(req.query.search);
    const status = asEnum(req.query.status, ['pending', 'approved', 'rejected']);

    let query = supabase
      .from('tools')
      .select(
        'id, name, slug, description, website_url, category_id, pricing, logo_url, rating, clicks_count, status, featured, tags, created_at, updated_at, category:categories(id, name, slug, icon)',
        { count: 'exact' }
      )
      .order('updated_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,description.ilike.%${search}%`);
    }
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;
    const total = count || 0;
    return res.status(200).json({
      data: data || [],
      total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage) || 1,
    });
  } catch (err) {
    return serverError(res, err);
  }
}
