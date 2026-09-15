// /api/sitemap — dynamic XML sitemap with ABSOLUTE URLs.
//
// Routes:
//   /            (priority 1.0, daily)
//   /tools       (0.9, daily)
//   /top-tools   (0.8, daily)
//   /categories  (0.8, weekly)
//   /blog        (0.7, weekly)
//   /submit      (0.6, monthly)
//   /contact     (0.4, monthly)
//   /privacy     (0.3, yearly)
//   /terms       (0.3, yearly)
//   /tools/:slug      (approved tools only)
//   /category/:slug   (all public categories)
//   /blog/:slug       (published articles only)
//
// Admin/private pages are never listed. Cached for 1 hour.

import supabase from './_lib/db-client.js';
import { siteUrl, xmlEscape } from './_lib/url.js';

const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/tools', changefreq: 'daily', priority: '0.9' },
  { path: '/top-tools', changefreq: 'daily', priority: '0.8' },
  { path: '/categories', changefreq: 'weekly', priority: '0.8' },
  { path: '/blog', changefreq: 'weekly', priority: '0.7' },
  { path: '/submit', changefreq: 'monthly', priority: '0.6' },
  { path: '/contact', changefreq: 'monthly', priority: '0.4' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
];

function urlEntry(loc, lastmod, changefreq, priority) {
  let out = '  <url>\n';
  out += `    <loc>${xmlEscape(loc)}</loc>\n`;
  if (lastmod) out += `    <lastmod>${xmlEscape(lastmod)}</lastmod>\n`;
  if (changefreq) out += `    <changefreq>${changefreq}</changefreq>\n`;
  if (priority) out += `    <priority>${priority}</priority>\n`;
  out += '  </url>\n';
  return out;
}

export default async function handler(req, res) {
  try {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const base = siteUrl(req);
    // Even without a configured domain we still emit a valid (if relative-free)
    // sitemap once a host can be resolved from the request.
    if (!base) {
      return res.status(503).end('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
    }

    // Fetch dynamic entries in parallel. Use only public-safe filters.
    const [tools, categories, articles] = await Promise.all([
      supabase
        .from('tools')
        .select('slug, updated_at')
        .eq('status', 'approved')
        .order('updated_at', { ascending: false })
        .limit(1000),
      supabase.from('categories').select('slug').order('name', { ascending: true }).limit(1000),
      supabase
        .from('articles')
        .select('slug, updated_at')
        .eq('published', true)
        .order('updated_at', { ascending: false })
        .limit(1000),
    ]);

    let body = '<?xml version="1.0" encoding="UTF-8"?>\n';
    body += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const r of STATIC_ROUTES) {
      body += urlEntry(`${base}${r.path}`, null, r.changefreq, r.priority);
    }

    for (const t of tools.data || []) {
      if (!t.slug) continue;
      body += urlEntry(`${base}/tools/${encodeURIComponent(t.slug)}`, t.updated_at, 'weekly', '0.7');
    }

    for (const c of categories.data || []) {
      if (!c.slug) continue;
      body += urlEntry(`${base}/category/${encodeURIComponent(c.slug)}`, null, 'weekly', '0.6');
    }

    for (const a of articles.data || []) {
      if (!a.slug) continue;
      body += urlEntry(`${base}/blog/${encodeURIComponent(a.slug)}`, a.updated_at, 'weekly', '0.6');
    }

    body += '</urlset>\n';

    // Swallow DB errors into the server log only — never expose details.
    const errs = [tools.error, categories.error, articles.error].filter(Boolean);
    if (errs.length) {
      // eslint-disable-next-line no-console
      console.error('[sitemap] db error:', errs[0].message);
    }

    return res.status(200).send(body);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[sitemap] failed:', err);
    return res.status(500).end('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
}
