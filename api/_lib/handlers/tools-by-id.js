// /api/tools/[id]
//   GET    — public: tool by id (only approved)
//   PUT    — admin: update
//   DELETE — admin: delete

import { handleOptions } from '../cors.js';
import {
  asString,
  asOptionalString,
  asEnum,
  asBool,
  asNumber,
  asStringArray,
  badRequest,
  notFound,
  serverError,
  requireUuid,
  pick,
  requireHttpUrl,
  allowedToolFields,
  toolPricing,
} from '../validation.js';
import { requireAdmin } from '../auth.js';
import supabase from '../db-client.js';
import { PRICING_OPTIONS, TEXT_LIMITS } from '../constants.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  try {
    const id = req.query.id;
    if (!requireUuid(id, res, 'id')) return;

    if (req.method === 'GET') return getTool(req, res, id);
    if (req.method === 'PUT' || req.method === 'PATCH') return updateTool(req, res, id);
    if (req.method === 'DELETE') return deleteTool(req, res, id);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return serverError(res, err);
  }
}

async function getTool(req, res, id) {
  const { data, error } = await supabase
    .from('tools')
    .select('*, category:categories(id, name, slug, icon)')
    .eq('id', id)
    .eq('status', 'approved')
    .maybeSingle();
  if (error) throw error;
  if (!data) return notFound(res);
  return res.status(200).json(data);
}

async function updateTool(req, res, id) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const body = req.body || {};
  const fields = pick(body, allowedToolFields());
  const update = { updated_at: new Date().toISOString() };

  if ('name' in fields) {
    const v = asString(fields.name, TEXT_LIMITS.tool_name);
    if (!v) return badRequest(res, 'name cannot be empty');
    update.name = v;
  }
  if ('slug' in fields) {
    const v = asString(fields.slug, TEXT_LIMITS.tool_name);
    if (!v) return badRequest(res, 'slug cannot be empty');
    update.slug = v;
  }
  if ('description' in fields) {
    const v = asString(fields.description, TEXT_LIMITS.tool_description);
    if (!v) return badRequest(res, 'description cannot be empty');
    update.description = v;
  }
  if ('website_url' in fields) {
    const v = asString(fields.website_url, TEXT_LIMITS.tool_website);
    if (!v || !requireHttpUrl(v, res, 'website_url')) return;
    update.website_url = v;
  }
  if ('category_id' in fields) {
    if (fields.category_id === null || fields.category_id === '') {
      update.category_id = null;
    } else {
      if (!requireUuid(fields.category_id, res, 'category_id')) return;
      update.category_id = fields.category_id;
    }
  }
  if ('pricing' in fields) {
    const v = toolPricing(fields.pricing);
    if (!v) return badRequest(res, 'invalid pricing');
    update.pricing = v;
  }
  if ('logo_url' in fields) {
    const v = asOptionalString(fields.logo_url, TEXT_LIMITS.tool_logo);
    if (v && !requireHttpUrl(v, res, 'logo_url')) return;
    update.logo_url = v;
  }
  if ('rating' in fields) {
    const v = Math.max(0, Math.min(5, asNumber(fields.rating, 0)));
    update.rating = v;
  }
  if ('status' in fields) {
    const v = asEnum(fields.status, ['pending', 'approved', 'rejected']);
    if (!v) return badRequest(res, 'invalid status');
    update.status = v;
  }
  if ('featured' in fields) update.featured = asBool(fields.featured, false);
  if ('tags' in fields) update.tags = asStringArray(fields.tags, 30);

  if (Object.keys(update).length === 1) {
    return badRequest(res, 'No updatable fields provided');
  }

  const { data, error } = await supabase
    .from('tools')
    .update(update)
    .eq('id', id)
    .select('*, category:categories(id, name, slug, icon)')
    .single();
  if (error) {
    if (error.code === '23505') return badRequest(res, 'Slug already in use');
    if (error.code === 'PGRST116') return notFound(res);
    throw error;
  }
  return res.status(200).json(data);
}

async function deleteTool(req, res, id) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { error } = await supabase.from('tools').delete().eq('id', id);
  if (error) throw error;
  return res.status(200).json({ ok: true });
}
