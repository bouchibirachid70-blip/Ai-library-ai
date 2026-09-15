// /api/submissions
//   POST — public: submit a new tool for review. Rate-limited.
//   GET  — admin: list pending/recent submissions with filters & pagination.

import { handleOptions } from '../_lib/cors.js';
import {
  asString,
  asOptionalString,
  asEnum,
  badRequest,
  serverError,
  paginationParams,
  pick,
  allowedSubmissionFields,
  requireUuid,
  requireEmail,
  requireHttpUrl,
  sanitizeSearch,
} from '../_lib/validation.js';
import { rateLimit } from '../_lib/ratelimit.js';
import { requireAdmin } from '../_lib/auth.js';
import supabase from '../_lib/db-client.js';
import { RATE_LIMITS, TEXT_LIMITS } from '../_lib/constants.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  try {
    if (req.method === 'POST') return createSubmission(req, res);
    if (req.method === 'GET') return listSubmissions(req, res);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return serverError(res, err);
  }
}

async function createSubmission(req, res) {
  const limit = rateLimit(req, RATE_LIMITS.submit);
  res.setHeader('X-RateLimit-Remaining', String(limit.remaining));
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(Math.ceil((limit.reset - Date.now()) / 1000)));
    return res.status(429).json({ error: 'Too many submissions. Try again later.' });
  }

  const fields = pick(req.body || {}, allowedSubmissionFields());

  const tool_name = asString(fields.tool_name, TEXT_LIMITS.tool_name);
  const website_url = asString(fields.website_url, TEXT_LIMITS.tool_website);
  const description = asString(fields.description, TEXT_LIMITS.tool_description);
  const submitter_email = asString(fields.submitter_email, TEXT_LIMITS.submission_email);

  if (!tool_name) return badRequest(res, 'tool_name is required');
  if (!website_url) return badRequest(res, 'website_url is required');
  if (!requireHttpUrl(website_url, res, 'website_url')) return;
  if (!description) return badRequest(res, 'description is required');
  if (!submitter_email || !requireEmail(submitter_email, res)) return;

  let category_id = null;
  if (fields.category_id) {
    if (!requireUuid(fields.category_id, res, 'category_id')) return;
    category_id = fields.category_id;
  }

  const insert = {
    tool_name,
    website_url,
    description,
    submitter_email,
    category_id,
    status: 'pending',
  };

  const { data, error } = await supabase
    .from('submissions')
    .insert(insert)
    .select('id, tool_name, status, created_at')
    .single();
  if (error) throw error;
  return res.status(201).json({
    message: 'Submission received. We will review it shortly.',
    id: data.id,
  });
}

async function listSubmissions(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const status = asEnum(req.query.status, ['pending', 'approved', 'rejected']);
  const search = sanitizeSearch(req.query.search);
  const { page, perPage, from, to } = paginationParams(req.query);

  let query = supabase
    .from('submissions')
    .select(
      'id, tool_name, website_url, description, submitter_email, category_id, status, notes, created_at, category:categories(id, name, slug, icon)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (search) {
    query = query.or(`tool_name.ilike.%${search}%,description.ilike.%${search}%`);
  }
  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;
  const total = count || 0;
  return res.status(200).json({
    data: data || [],
    total,
    page,
    per_page: perPage,
    total_pages: Math.ceil(total / perPage) || 1,
  });
}
