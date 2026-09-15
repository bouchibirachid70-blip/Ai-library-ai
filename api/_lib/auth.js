// Server-side admin authorization. We never trust frontend claims about role,
// email, or query string flags. We verify the Supabase JWT, then look up the
// authenticated user in admin_users. Only that user can hit admin endpoints.

import { createClient } from '@supabase/supabase-js';
import supabase from './db-client.js';
import { setCorsAdmin } from './cors.js';
import { forbidden, unauthorized, serverError } from './validation.js';

function getTokenFromHeader(req) {
  const raw = req.headers?.authorization || req.headers?.Authorization;
  if (!raw || typeof raw !== 'string') return null;
  const [scheme, token] = raw.split(' ');
  if (!token) return null;
  if (scheme.toLowerCase() !== 'bearer') return null;
  return token.trim();
}

async function lookupAdminUser(userId) {
  // The service-role client bypasses RLS, so admin_users remains a server-only
  // table from the public's perspective. We only return the role for the user
  // we just authenticated.
  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id, role, created_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

/**
 * Resolve the authenticated admin (if any). Returns null when the request has
 * no token, the token is invalid, or the user is not in admin_users.
 */
export async function getAdminFromRequest(req, res) {
  // Tighten CORS for any response that depends on admin verification, so the
  // permissive `*` set by handleOptions() is never returned for admin data.
  if (res) setCorsAdmin(req, res);

  const token = getTokenFromHeader(req);
  if (!token) return null;

  // Use a temporary anon client with the user's JWT to verify it.
  const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const userClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await userClient.auth.getUser(token);
  if (error || !data?.user) return null;

  const adminRow = await lookupAdminUser(data.user.id);
  if (!adminRow) return null;

  return {
    user: { id: data.user.id, email: data.user.email || null },
    role: adminRow.role,
    created_at: adminRow.created_at,
  };
}

/**
 * Middleware-style helper. Returns an admin object on success or sends a 401/403
 * response and returns null. Always call before any mutation in admin routes.
 */
export async function requireAdmin(req, res) {
  try {
    const admin = await getAdminFromRequest(req, res);
    if (!admin) {
      // Distinguish between "no token" and "token but not admin": both are
      // forbidden from the public's perspective. Use 401 for missing/invalid,
      // 403 when authenticated but not an admin.
      const token = getTokenFromHeader(req);
      if (!token) {
        unauthorized(res, 'Authentication required');
        return null;
      }
      forbidden(res, 'Admin privileges required');
      return null;
    }
    return admin;
  } catch (err) {
    serverError(res, err);
    return null;
  }
}

/**
 * Resolve the authenticated regular user (no admin requirement). Used for
 * endpoints that need to know who is calling without granting admin powers.
 */
export async function getUserFromRequest(req) {
  const token = getTokenFromHeader(req);
  if (!token) return null;

  const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const userClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await userClient.auth.getUser(token);
  if (error || !data?.user) return null;
  return { id: data.user.id, email: data.user.email || null };
}
