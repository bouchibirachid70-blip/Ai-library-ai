// /api/tools/[...segments] — single Vercel function fronting all tools
// routes, to stay under the Hobby plan's 12-function limit. The actual
// logic is unchanged; each branch just delegates to the handler that used
// to live at this exact path (moved to api/_lib/handlers/ verbatim):
//   ['__root__']        -> GET list / POST create   (api/tools/index.js)
//   [id]                 -> GET/PUT/DELETE by id     (api/tools/[id].js)
//   ['slug', slug]        -> GET by slug              (api/tools/slug/[slug].js)
//
// [...segments] (Vercel's *mandatory* catch-all) never matches the bare
// /api/tools path by itself — only /api/tools/<something>. So a rewrite in
// vercel.json sends plain "/api/tools" to "/api/tools/__root__" first,
// which lands here as segments = ['__root__']; we treat that exactly like
// the empty-segments case. (Vercel does not support the optional
// [[...segments]] catch-all outside of Next.js, which is why this sentinel
// trick is needed instead.)

import listCreate from '../_lib/handlers/tools-list-create.js';
import byId from '../_lib/handlers/tools-by-id.js';
import bySlug from '../_lib/handlers/tools-by-slug.js';

export default async function handler(req, res) {
  const segments = Array.isArray(req.query.segments) ? req.query.segments : [];

  if (segments.length === 0 || (segments.length === 1 && segments[0] === '__root__')) {
    return listCreate(req, res);
  }

  if (segments.length === 2 && segments[0] === 'slug') {
    req.query.slug = segments[1];
    return bySlug(req, res);
  }

  if (segments.length === 1) {
    req.query.id = segments[0];
    return byId(req, res);
  }

  return res.status(404).json({ error: 'Not found' });
}
