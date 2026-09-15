// Server-side input validation. Every API route uses these helpers before
// touching the database. Centralized so rules can be tightened in one place.

import { PRICING_OPTIONS, TOOL_STATUSES, SUBMISSION_STATUSES, PAGINATION, TEXT_LIMITS } from './constants.js';

export function badRequest(res, message, details) {
  return res.status(400).json({ error: message, ...(details ? { details } : {}) });
}

export function unauthorized(res, message = 'Unauthorized') {
  return res.status(401).json({ error: message });
}

export function forbidden(res, message = 'Forbidden') {
  return res.status(403).json({ error: message });
}

export function notFound(res, message = 'Not found') {
  return res.status(404).json({ error: message });
}

export function tooManyRequests(res, message = 'Too many requests') {
  return res.status(429).json({ error: message });
}

export function serverError(res, err) {
  // NEVER leak stack traces, SQL messages, Supabase errors, env vars, or any
  // internal detail to the client. Log the full error server-side only, and
  // return a deliberately generic message.
  // eslint-disable-next-line no-console
  console.error('[api] internal error:', err);
  return res.status(500).json({ error: 'Internal server error' });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value);
}

export function requireUuid(value, res, fieldName = 'id') {
  if (!isUuid(value)) {
    badRequest(res, `Invalid ${fieldName}`);
    return false;
  }
  return true;
}

// Reject hosts that point at the server itself or an internal network target.
// This protects against stored-URL SSRF (e.g. a submitted tool_url that an admin
// later clicks, or any future server-side fetch) and keeps obviously unsafe
// links out of the directory. We intentionally allow public http(s) URLs only.
function isPrivateOrLocalHost(hostname) {
  if (typeof hostname !== 'string' || hostname === '') return true;
  const h = hostname.toLowerCase().replace(/\[|\]/g, '');
  if (h === 'localhost' || h.endsWith('.localhost')) return true;
  if (h === '0' || h === '0.0.0.0' || h === '255.255.255.255') return true;
  // IPv4 literal
  const v4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [parseInt(v4[1], 10), parseInt(v4[2], 10)];
    if (a === 10) return true;
    if (a === 127) return true; // loopback
    if (a === 0) return true;
    if (a === 169 && b === 254) return true; // link-local
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast / reserved
    return false;
  }
  // IPv6 literal
  if (h.includes(':')) {
    const v = h.replace(/^\[|\]$/g, '');
    if (v === '::' || v === '::1') return true; // unspecified / loopback
    if (v.startsWith('fc') || v.startsWith('fd')) return true; // unique-local
    if (v.startsWith('fe80')) return true; // link-local
    if (v.startsWith('::ffff:')) {
      // IPv4-mapped IPv6 — re-check the embedded IPv4.
      const mapped = v.slice('::ffff:'.length);
      return isPrivateOrLocalHost(mapped);
    }
    return false;
  }
  return false;
}

export function isHttpUrl(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) return false;
  let u;
  try {
    u = new URL(value);
  } catch {
    return false;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  // Block userinfo tricks (http://evil@127.0.0.1) and credentials in URLs.
  if (u.username || u.password) return false;
  if (isPrivateOrLocalHost(u.hostname)) return false;
  return true;
}

export function requireUrl(value, res, fieldName = 'url') {
  if (!isHttpUrl(value)) {
    badRequest(res, `Invalid ${fieldName}`);
    return false;
  }
  return true;
}

// Alias used by routes that store a website/logo URL.
export function requireHttpUrl(value, res, fieldName = 'url') {
  return requireUrl(value, res, fieldName);
}

// Email pattern is intentionally lenient; stricter rules belong to mail delivery.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmail(value) {
  return typeof value === 'string' && value.length <= TEXT_LIMITS.submission_email && EMAIL_RE.test(value);
}

export function requireEmail(value, res) {
  if (!isEmail(value)) {
    badRequest(res, 'Invalid email');
    return false;
  }
  return true;
}

export function asString(value, max) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (max && trimmed.length > max) return trimmed.slice(0, max);
  return trimmed;
}

export function asOptionalString(value, max) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  if (max && trimmed.length > max) return trimmed.slice(0, max);
  return trimmed;
}

export function asEnum(value, allowed) {
  if (typeof value !== 'string') return null;
  return allowed.includes(value) ? value : null;
}

export function asBool(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return fallback;
}

export function asInt(value, fallback = 0) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

export function asNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function asStringArray(value, max = 30) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v) => typeof v === 'string')
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
    .slice(0, max);
}

export function paginationParams(query) {
  const page = Math.max(1, asInt(query.page, 1));
  const perPage = Math.min(
    PAGINATION.MAX_PER_PAGE,
    Math.max(PAGINATION.MIN_PER_PAGE, asInt(query.per_page, PAGINATION.DEFAULT_PER_PAGE))
  );
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  return { page, perPage, from, to };
}

// Build a Supabase `.range()` window and report pagination metadata.
export function rangeFor(query) {
  const { page, perPage, from, to } = paginationParams(query);
  return { page, perPage, range: [from, to] };
}

// Sanitize an arbitrary search term so it is safe both as a Postgres ILIKE
// pattern AND as a substring inside a PostgREST `.or()` filter string.
//
// Two distinct injection surfaces exist:
//   1. ILIKE wildcards: `%` and `_` are special and must be backslash-escaped.
//      Existing backslashes must be doubled FIRST (otherwise escaping `%`
//      introduces a new backslash that the next pass mis-handles).
//   2. PostgREST `.or()` parser: the string `col.ilike.%X%,col2.ilike.%X%` is
//      split on commas, and `(` / `)` group conditions. A search term that
//      contains `,` `(` or `)` could inject extra filter conditions. These
//      characters carry no search value, so we strip them.
export function sanitizeSearch(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\\]/g, '\\\\') // 1. double existing backslashes
    .replace(/[%_]/g, (m) => `\\${m}`) // 2. escape ILIKE wildcards
    .replace(/[(),]/g, '') // 3. neutralise .or() parser specials
    .trim()
    .slice(0, 100);
}

export function toolPricing(value) {
  return asEnum(value, PRICING_OPTIONS);
}

export function toolStatus(value) {
  return asEnum(value, TOOL_STATUSES);
}

export function submissionStatus(value) {
  return asEnum(value, SUBMISSION_STATUSES);
}

export function allowedToolFields() {
  return [
    'name',
    'slug',
    'description',
    'website_url',
    'category_id',
    'pricing',
    'logo_url',
    'rating',
    'status',
    'featured',
    'tags',
  ];
}

export function allowedArticleFields() {
  return ['title', 'slug', 'excerpt', 'content', 'cover_image', 'author', 'published', 'tags'];
}

export function allowedCategoryFields() {
  return ['name', 'slug', 'icon', 'description'];
}

export function allowedSubmissionFields() {
  return ['tool_name', 'website_url', 'description', 'submitter_email', 'category_id'];
}

// Defensive whitelist filter: drops any key the caller is not allowed to set.
export function pick(obj, allowed) {
  if (!obj || typeof obj !== 'object') return {};
  const out = {};
  for (const key of allowed) {
    if (key in obj) out[key] = obj[key];
  }
  return out;
}

export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
