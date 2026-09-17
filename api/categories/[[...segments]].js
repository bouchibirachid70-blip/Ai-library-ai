// /api/categories/[[...segments]] — same pattern as /api/tools; see that
// router's comment for why this exists.
//   []                -> GET list / POST create   (api/categories/index.js)
//   [id]               -> GET/PUT/DELETE by id     (api/categories/[id].js)
//   ['slug', slug]      -> GET by slug              (api/categories/slug/[slug].js)

import listCreate from '../_lib/handlers/categories-list-create.js';
import byId from '../_lib/handlers/categories-by-id.js';
import bySlug from '../_lib/handlers/categories-by-slug.js';

export default async function handler(req, res) {
  const segments = Array.isArray(req.query.segments) ? req.query.segments : [];

  if (segments.length === 0) return listCreate(req, res);

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
