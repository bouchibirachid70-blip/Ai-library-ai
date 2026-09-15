// Resolve the site's absolute base URL for sitemap/robots/SEO.
//
// Preference order:
//   1. process.env.VITE_SITE_URL / SITE_URL  (explicit production domain)
//   2. The request's forwarded host (so the deployed site works with zero
//      config — the domain is whatever the visitor used)
//
// We never invent a fake domain. If nothing is configured and there is no
// request host, we return an empty string so callers can short-circuit.
export function siteBaseUrl(req) {
  const fromEnv =
    process.env.VITE_SITE_URL || process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return stripTrailingSlash(fromEnv);

  const forwardedHost =
    (req?.headers?.['x-forwarded-host'] && String(req.headers['x-forwarded-host']).split(',')[0].trim()) ||
    (req?.headers?.host && String(req.headers.host).split(',')[0].trim());
  if (forwardedHost) {
    const proto =
      (req?.headers?.['x-forwarded-proto'] && String(req.headers['x-forwarded-proto']).split(',')[0].trim()) ||
      'https';
    return `${proto}://${forwardedHost}`;
  }
  return '';
}

function stripTrailingSlash(value) {
  if (typeof value !== 'string') return '';
  const v = value.trim();
  return v.endsWith('/') ? v.slice(0, -1) : v;
}

// Join a base URL and a path that may start with "/".
export function siteUrl(req, path = '') {
  const base = siteBaseUrl(req);
  if (!base) return '';
  if (!path) return base;
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
}

// Minimal XML escaper for sitemap/structured data.
export function xmlEscape(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
