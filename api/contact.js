// /api/contact — public, rate-limited contact form.
// Messages are stored in a dedicated table; admins can read them later via
// Supabase or via a follow-up admin route.

import { handleOptions } from './_lib/cors.js';
import { asString, asOptionalString, badRequest, serverError, requireEmail } from './_lib/validation.js';
import { rateLimit } from './_lib/ratelimit.js';
import supabase from './_lib/db-client.js';
import { RATE_LIMITS, TEXT_LIMITS } from './_lib/constants.js';

const MAX_NAME = 100;
const MAX_MESSAGE = 4000;

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const limit = rateLimit(req, RATE_LIMITS.contact);
    if (!limit.allowed) {
      res.setHeader('Retry-After', String(Math.ceil((limit.reset - Date.now()) / 1000)));
      return res.status(429).json({ error: 'Too many requests' });
    }

    const body = req.body || {};
    const name = asString(body.name, MAX_NAME);
    const email = asString(body.email, TEXT_LIMITS.submission_email);
    const subject = asOptionalString(body.subject, 200);
    const message = asString(body.message, MAX_MESSAGE);

    if (!name) return badRequest(res, 'name is required');
    if (!email || !requireEmail(email, res)) return;
    if (!message) return badRequest(res, 'message is required');

    const payload = {
      name,
      email,
      subject: subject || null,
      message,
      created_at: new Date().toISOString(),
    };

    // Persist the message. If the insert fails, the user MUST NOT receive a
    // success response — that would silently swallow their message. We return
    // a generic 500 (detailed error stays in server logs only).
    const { error } = await supabase.from('contact_messages').insert(payload);
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[contact] insert failed:', error.message);
      return res.status(500).json({ error: 'Could not send your message. Please try again later.' });
    }

    return res.status(201).json({ ok: true });
  } catch (err) {
    return serverError(res, err);
  }
}
