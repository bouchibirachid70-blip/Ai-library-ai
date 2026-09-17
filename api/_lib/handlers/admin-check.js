// /api/admin/check — lightweight "am I an admin?" probe. The frontend calls
// this on every page load that touches admin UI to decide whether to show
// the admin chrome. The check is *always* enforced server-side; this is just
// a convenience so the UI can render gracefully.

import { handleOptions } from '../cors.js';
import { serverError } from '../validation.js';
import { getAdminFromRequest } from '../auth.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const admin = await getAdminFromRequest(req, res);
    return res.status(200).json({ is_admin: !!admin, role: admin?.role || null });
  } catch (err) {
    return serverError(res, err);
  }
}
