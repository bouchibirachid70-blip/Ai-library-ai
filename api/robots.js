// /api/robots — dynamic robots.txt with an ABSOLUTE sitemap URL.
//
// Allows all crawlers, blocks the admin area, and points to the sitemap
// using the resolved production domain (no invented/fake domain).

import { siteUrl, xmlEscape } from './_lib/url.js';

export default async function handler(req, res) {
  try {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const base = siteUrl(req);
    const lines = [
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin',
      'Disallow: /api/',
      '',
    ];
    if (base) {
      lines.push(`Sitemap: ${xmlEscape(`${base}/sitemap.xml`)}`);
      lines.push('');
    }

    return res.status(200).send(lines.join('\n'));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[robots] failed:', err);
    return res.status(200).send('User-agent: *\nAllow: /\nDisallow: /admin\n');
  }
}
