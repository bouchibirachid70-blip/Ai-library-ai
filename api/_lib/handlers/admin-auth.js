// /api/admin/auth
//   POST { access_token, refresh_token } — exchange Supabase tokens for an
//     admin session confirmation. Returns { ok: true, user, role } only when
//     the bearer is a real Supabase JWT AND the user is in admin_users.
//
//   GET — read current admin from Authorization header (same logic, GET-only).

import { handleOptions } from '../cors.js';
import { badRequest, serverError, unauthorized, forbidden } from '../validation.js';
import { requireAdmin } from '../auth.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  try {
    if (req.method === 'GET') return getAdmin(req, res);
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Sign-in: caller presents the Supabase access_token (and refresh_token).
    // We verify the token with Supabase and check admin_users. We never look
    // at the request body's email or role — those are not how authorization
    // works here.
    const body = req.body || {};
    const token = typeof body.access_token === 'string' ? body.access_token : null;
    if (!token) return badRequest(res, 'access_token required');

    // Reuse requireAdmin's verification path by reattaching the token as
    // Authorization. requireAdmin will look up admin_users using the service
    // role. We don't return until we know both: token is real AND user is admin.
    req.headers = req.headers || {};
    req.headers.authorization = `Bearer ${token}`;

    const admin = await requireAdmin(req, res);
    if (!admin) return; // requireAdmin already wrote the response.

    return res.status(200).json({
      ok: true,
      user: admin.user,
      role: admin.role,
    });
  } catch (err) {
    return serverError(res, err);
  }
}

async function getAdmin(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  return res.status(200).json({ ok: true, user: admin.user, role: admin.role });
}
