// /api/tools
//   GET  — public: approved tools. Supports search, category filter, pricing,
//          featured, sort, pagination. Always filters status='approved'.
//   POST — admin: create a new tool.

import { handleOptions } from '../cors.js';
import {
  asString,
  asOptionalString,
  asInt,
  asEnum,
  asBool,
  asNumber,
  asStringArray,
  badRequest,
  notFound,
  serverError,
  paginationParams,
  pick,
  requireUuid,
  requireHttpUrl,
  sanitizeSearch,
  allowedToolFields,
  toolPricing,
} from '../validation.js';
import { requireAdmin } from '../auth.js';
import supabase from '../db-client.js';
import { PRICING_OPTIONS, TEXT_LIMITS } from '../constants.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  try {
    if (req.method === 'GET') return listTools(req, res);
    if (req.method === 'POST') return createTool(req, res);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return serverError(res, err);
  }
}

async function listTools(req, res) {
  const { page, perPage, from, to } = paginationParams(req.query);
  const search = sanitizeSearch(req.query.search);
  const category = asString(req.query.category);
  const pricing = asEnum(req.query.pricing, PRICING_OPTIONS);
  const featured = req.query.featured === 'true' ? true : undefined;
  const sort = asString(req.query.sort) || 'newest';

  let query = supabase
    .from('tools')
    .select(
      'id, name, slug, description, website_url, category_id, pricing, logo_url, rating, clicks_count, status, featured, tags, created_at, updated_at, category:categories(id, name, slug, icon)',
      { count: 'exact' }
    )
    .eq('status', 'approved');

  if (category) {
    if (category.includes(',')) {
      // Support a comma-separated allow-list of category IDs/slugs.
      const parts = category.split(',').map((p) => p.trim()).filter(Boolean);
      // Accept either UUIDs (fast equality) or slugs (resolved in a second pass).
      const uuids = parts.filter((p) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p)
      );
      if (uuids.length > 0) query = query.in('category_id', uuids);
      // Slug-based filtering is handled below by resolving ids first.
      query._slugFilter = parts.filter((p) => !uuids.includes(p));
    } else if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category)
    ) {
      query = query.eq('category_id', category);
    } else {
      query._slugFilter = [category];
    }
  }

  if (query._slugFilter && query._slugFilter.length) {
    const { data: cats } = await supabase
      .from('categories')
      .select('id, slug')
      .in('slug', query._slugFilter);
    const ids = (cats || []).map((c) => c.id);
    if (ids.length === 0) {
      return res.status(200).json({ data: [], total: 0, page, per_page: perPage, total_pages: 0 });
    }
    query = query.in('category_id', ids);
  }

  if (pricing) query = query.eq('pricing', pricing);
  if (featured) query = query.eq('featured', true);
  if (search) {
    // Postgres full-text fallback: ilike across name + description.
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  switch (sort) {
    case 'oldest':
      query = query.order('created_at', { ascending: true });
      break;
    case 'rating':
      query = query.order('rating', { ascending: false, nullsFirst: false }).order('created_at', {
        ascending: false,
      });
      break;
    case 'popular':
      query = query.order('clicks_count', { ascending: false }).order('created_at', {
        ascending: false,
      });
      break;
    case 'name':
      query = query.order('name', { ascending: true });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
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

async function createTool(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const body = req.body || {};
  const fields = pick(body, allowedToolFields());

  const name = asString(fields.name, TEXT_LIMITS.tool_name);
  const slug = asString(fields.slug, TEXT_LIMITS.tool_name);
  const description = asString(fields.description, TEXT_LIMITS.tool_description);
  const website_url = asString(fields.website_url, TEXT_LIMITS.tool_website);

  if (!name) return badRequest(res, 'name is required');
  if (!slug) return badRequest(res, 'slug is required');
  if (!description) return badRequest(res, 'description is required');
  if (!website_url) return badRequest(res, 'website_url is required');
  if (!requireHttpUrl(website_url, res, 'website_url')) return;

  const pricing = toolPricing(fields.pricing) || 'Free';
  const logo_url = asOptionalString(fields.logo_url, TEXT_LIMITS.tool_logo);
  if (logo_url && !requireHttpUrl(logo_url, res, 'logo_url')) return;

  let category_id = null;
  if (fields.category_id) {
    if (!requireUuid(fields.category_id, res, 'category_id')) return;
    category_id = fields.category_id;
  }

  const rating = Math.max(0, Math.min(5, asNumber(fields.rating, 0)));
  const status = asEnum(fields.status, ['pending', 'approved', 'rejected']) || 'pending';
  const featured = asBool(fields.featured, false);
  const tags = asStringArray(fields.tags, 30);

  const insert = {
    name,
    slug,
    description,
    website_url,
    category_id,
    pricing,
    logo_url,
    rating,
    status,
    featured,
    tags,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('tools')
    .insert(insert)
    .select('*, category:categories(id, name, slug, icon)')
    .single();
  if (error) {
    if (error.code === '23505') return badRequest(res, 'A tool with that slug already exists');
    throw error;
  }
  return res.status(201).json(data);
}
