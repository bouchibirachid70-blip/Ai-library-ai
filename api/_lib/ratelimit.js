// In-memory token-bucket rate limiter. Suitable for a single Vercel region —
// per-instance state. Good enough to discourage casual abuse on public
// endpoints; combine with edge protections in production.

const buckets = new Map();

function getClientKey(req) {
  const xff = req.headers?.['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

export function rateLimit(req, { windowMs, max }) {
  const key = getClientKey(req);
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.start >= windowMs) {
    buckets.set(key, { start: now, count: 1 });
    return { allowed: true, remaining: max - 1, reset: now + windowMs };
  }
  if (bucket.count >= max) {
    return { allowed: false, remaining: 0, reset: bucket.start + windowMs };
  }
  bucket.count += 1;
  return {
    allowed: true,
    remaining: max - bucket.count,
    reset: bucket.start + windowMs,
  };
}

// Best-effort IP hash so we don't store raw addresses in clicks.
import crypto from 'node:crypto';

export function hashIp(ip) {
  if (!ip) return null;
  const salt = process.env.IP_HASH_SALT || 'aivora-default-salt';
  return crypto.createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
}
