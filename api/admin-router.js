// Single deterministic entry point for admin routes.
// Keeping these routes in one function preserves the Vercel Hobby limit while
// avoiding reliance on a one-segment catch-all that Vercel does not match
// reliably in the plain Serverless Functions runtime.
import auth from './_lib/handlers/admin-auth.js';
import check from './_lib/handlers/admin-check.js';
import tools from './_lib/handlers/admin-tools.js';
import adSlots from './_lib/handlers/admin-ad-slots.js';

const HANDLERS = { auth, check, tools, 'ad-slots': adSlots };

export default async function handler(req, res) {
  const route = typeof req.query.route === 'string' ? req.query.route : '';
  const selected = HANDLERS[route];
  if (!selected) return res.status(404).json({ error: 'Not found' });
  return selected(req, res);
}
