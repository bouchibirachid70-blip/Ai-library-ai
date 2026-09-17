// /api/categories
//   GET  — public: list categories (with optional tool counts)
//   POST — admin: create

import { handleOptions } from '../cors.js';
import {
  asString,
  asOptionalString,
  badRequest,
  serverError,
  pick,
  allowedCategoryFields,
} from '../validation.js';
import { requireAdmin } from '../auth.js';
import supabase from '../db-client.js';
import { TEXT_LIMITS } from '../constants.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  try {
    if (req.method === 'GET') return listCategories(req, res);
    if (req.method === 'POST') return createCategory(req, res);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return serverError(res, err);
  }
}

async function listCategories(req, res) {
  const withCounts = req.query.with_counts === 'true';
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, icon, description, created_at')
    .order('name', { ascending: true });
  if (error) throw error;

  let counts = null;
  if (withCounts && data && data.length > 0) {
    const { data: c, error: cerr } = await supabase
      .from('tools')
      .select('category_id')
      .eq('status', 'approved')
      .in('category_id', data.map((d) => d.id));
    if (cerr) throw cerr;
    counts = {};
    (c || []).forEach((row) => {
      if (!row.category_id) return;
      counts[row.category_id] = (counts[row.category_id] || 0) + 1;
    });
  }

  const out = (data || []).map((c) => ({
    ...c,
    tools_count: counts ? counts[c.id] || 0 : undefined,
  }));
  return res.status(200).json({ data: out });
}

async function createCategory(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const body = req.body || {};
  const fields = pick(body, allowedCategoryFields());

  const name = asString(fields.name, TEXT_LIMITS.category_name);
  const slug = asString(fields.slug, TEXT_LIMITS.category_name);
  if (!name) return badRequest(res, 'name is required');
  if (!slug) return badRequest(res, 'slug is required');

  const icon = asOptionalString(fields.icon, 60);
  const description = asOptionalString(fields.description, TEXT_LIMITS.category_description);

  const { data, error } = await supabase
    .from('categories')
    .insert({ name, slug, icon, description })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') return badRequest(res, 'Slug already in use');
    throw error;
  }
  return res.status(201).json(data);
}
