// /api/admin/[[...segments]] — same pattern as /api/tools; see that
// router's comment for why this exists.
//   ['auth']      -> POST login                    (api/admin/auth.js)
//   ['check']     -> GET session check              (api/admin/check.js)
//   ['tools']     -> GET all tools, any status       (api/admin/tools.js)
//   ['ad-slots']  -> GET all ad slots, incl inactive (api/admin/ad-slots.js)

import auth from '../_lib/handlers/admin-auth.js';
import check from '../_lib/handlers/admin-check.js';
import tools from '../_lib/handlers/admin-tools.js';
import adSlots from '../_lib/handlers/admin-ad-slots.js';

export default async function handler(req, res) {
  const segments = Array.isArray(req.query.segments) ? req.query.segments : [];

  if (segments.length === 1) {
    switch (segments[0]) {
      case 'auth':
        return auth(req, res);
      case 'check':
        return check(req, res);
      case 'tools':
        return tools(req, res);
      case 'ad-slots':
        return adSlots(req, res);
      default:
        return res.status(404).json({ error: 'Not found' });
    }
  }

  return res.status(404).json({ error: 'Not found' });
}
