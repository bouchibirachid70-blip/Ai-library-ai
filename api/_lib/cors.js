// Standard CORS handling for every API route.
//
// Public read endpoints stay permissive (`Access-Control-Allow-Origin: *`)
// because they are unauthenticated and may legitimately be consumed by third
// parties. Authenticated *admin* endpoints, however, must NOT advertise `*`:
// we strip that header and only echo a request Origin back when it appears in
// the server-configured allowlist (ALLOWED_ORIGINS). Same-origin admin calls
// (the normal case — the SPA is served from the same domain) need no CORS
// header at all, so this never breaks the admin UI.

function allowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS || '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// Permissive CORS for public endpoints.
export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
}

// Strict CORS for admin/authenticated endpoints. Removes the permissive `*`
// set earlier by setCors()/handleOptions() and only allows allowlisted origins.
export function setCorsAdmin(req, res) {
  const origin = req?.headers?.origin;
  const allow = allowedOrigins();
  if (origin && allow.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else {
    // No cross-origin access for admin APIs from untrusted/unknown origins.
    // Same-origin requests (no Origin header) are unaffected by CORS.
    try {
      res.removeHeader('Access-Control-Allow-Origin');
    } catch {
      /* removeHeader may be unavailable on some runtimes; ignore */
    }
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
}

export function handleOptions(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}
