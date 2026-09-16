// /api/admin/ad-slots
// Admin-only listing of ALL ad slots, active and inactive, for the
// management table in the admin dashboard. Mirrors /api/admin/tools.js.

import { handleOptions } from '../_lib/cors.js';
import { serverError } from '../_lib/validation.js';
import { requireAdmin } from '../_lib/auth.js';
import supabase from '../_lib/db-client.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const { data, error } = await supabase
      .from('ad_slots')
      .select('id, position, code, is_active, created_at, updated_at')
      .order('created_at', { ascending: false });
    if (error) throw error;

    return res.status(200).json({ data: data || [] });
  } catch (err) {
    return serverError(res, err);
  }
}
