// /api/ad-slots/[[...segments]] — same pattern as /api/tools; see that
// router's comment for why this exists.
//   []    -> GET active list / POST create   (api/ad-slots/index.js)
//   [id]   -> PATCH/DELETE by id              (api/ad-slots/[id].js)

import listCreate from '../_lib/handlers/ad-slots-list-create.js';
import byId from '../_lib/handlers/ad-slots-by-id.js';

export default async function handler(req, res) {
  const segments = Array.isArray(req.query.segments) ? req.query.segments : [];

  if (segments.length === 0) return listCreate(req, res);

  if (segments.length === 1) {
    req.query.id = segments[0];
    return byId(req, res);
  }

  return res.status(404).json({ error: 'Not found' });
}
