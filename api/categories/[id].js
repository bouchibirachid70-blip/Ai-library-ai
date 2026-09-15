// /api/categories/[id]
//   GET    — public
//   PUT    — admin: update
//   DELETE — admin: delete (tools referencing it will get null category)

import { handleOptions } from '../_lib/cors.js';
import {
  asString,
  asOptionalString,
  badRequest,
  notFound,
  serverError,
  requireUuid,
  pick,
  allowedCategoryFields,
} from '../_lib/validation.js';
import { requireAdmin } from '../_lib/auth.js';
import supabase from '../_lib/db-client.js';
import { TEXT_LIMITS } from '../_lib/constants.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  try {
    const id = req.query.id;
    if (!requireUuid(id, res, 'id')) return;

    if (req.method === 'GET') return getCategory(req, res, id);
    if (req.method === 'PUT' || req.method === 'PATCH') return updateCategory(req, res, id);
    if (req.method === 'DELETE') return deleteCategory(req, res, id);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return serverError(res, err);
  }
}

async function getCategory(req, res, id) {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, icon, description, created_at')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return notFound(res);
  return res.status(200).json(data);
}

async function updateCategory(req, res, id) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const fields = pick(req.body || {}, allowedCategoryFields());
  const update = {};
  if ('name' in fields) {
    const v = asString(fields.name, TEXT_LIMITS.category_name);
    if (!v) return badRequest(res, 'name cannot be empty');
    update.name = v;
  }
  if ('slug' in fields) {
    const v = asString(fields.slug, TEXT_LIMITS.category_name);
    if (!v) return badRequest(res, 'slug cannot be empty');
    update.slug = v;
  }
  if ('icon' in fields) update.icon = asOptionalString(fields.icon, 60);
  if ('description' in fields)
    update.description = asOptionalString(fields.description, TEXT_LIMITS.category_description);

  if (Object.keys(update).length === 0) return badRequest(res, 'No updatable fields provided');

  const { data, error } = await supabase
    .from('categories')
    .update(update)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    if (error.code === 'PGRST116') return notFound(res);
    if (error.code === '23505') return badRequest(res, 'Slug already in use');
    throw error;
  }
  return res.status(200).json(data);
}

async function deleteCategory(req, res, id) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
  return res.status(200).json({ ok: true });
}
