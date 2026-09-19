// /api/submissions/[...segments] — same pattern as /api/tools; see that
// router's comment for why this exists (mandatory catch-all + a
// vercel.json rewrite sending bare "/api/submissions" to ".../__root__").
//   ['__root__']  -> GET list / POST create   (api/submissions/index.js)
//   [id]           -> GET/PUT/DELETE by id     (api/submissions/[id].js)

import listCreate from '../_lib/handlers/submissions-list-create.js';
import byId from '../_lib/handlers/submissions-by-id.js';

export default async function handler(req, res) {
  const segments = Array.isArray(req.query.segments) ? req.query.segments : [];

  if (segments.length === 0 || (segments.length === 1 && segments[0] === '__root__')) {
    return listCreate(req, res);
  }

  if (segments.length === 1) {
    req.query.id = segments[0];
    return byId(req, res);
  }

  return res.status(404).json({ error: 'Not found' });
}
