// /api/articles
//   GET  — public: published articles. Admins may request ?include_drafts=true.
//   POST — admin: create.

import { handleOptions } from '../cors.js';
import {
  asString,
  asOptionalString,
  asBool,
  asStringArray,
  asEnum,
  badRequest,
  serverError,
  paginationParams,
  pick,
  requireHttpUrl,
  allowedArticleFields,
  sanitizeSearch,
} from '../validation.js';
import { requireAdmin } from '../auth.js';
import supabase from '../db-client.js';
import { TEXT_LIMITS } from '../constants.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  try {
    if (req.method === 'GET') return listArticles(req, res);
    if (req.method === 'POST') return createArticle(req, res);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return serverError(res, err);
  }
}

async function listArticles(req, res) {
  const { page, perPage, from, to } = paginationParams(req.query);
  const search = sanitizeSearch(req.query.search);
  const includeDrafts = req.query.include_drafts === 'true';

  const admin = includeDrafts ? await requireAdmin(req, res) : null;
  if (includeDrafts && !admin) return; // requireAdmin already responded

  let query = supabase
    .from('articles')
    .select(
      'id, title, slug, excerpt, content, cover_image, author, published, tags, created_at, updated_at',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false });

  if (!admin) query = query.eq('published', true);
  if (search) {
    query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);
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

async function createArticle(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const fields = pick(req.body || {}, allowedArticleFields());

  const title = asString(fields.title, TEXT_LIMITS.article_title);
  const slug = asString(fields.slug, TEXT_LIMITS.article_title);
  const content = asString(fields.content, TEXT_LIMITS.article_content);
  if (!title) return badRequest(res, 'title is required');
  if (!slug) return badRequest(res, 'slug is required');
  if (!content) return badRequest(res, 'content is required');

  const excerpt = asOptionalString(fields.excerpt, TEXT_LIMITS.article_excerpt);
  const cover_image = asOptionalString(fields.cover_image, TEXT_LIMITS.article_cover);
  if (cover_image && !requireHttpUrl(cover_image, res, 'cover_image')) return;
  const author = asString(fields.author, TEXT_LIMITS.article_author) || 'Aivora Team';
  const published = asBool(fields.published, false);
  const tags = asStringArray(fields.tags, 30);

  const { data, error } = await supabase
    .from('articles')
    .insert({
      title,
      slug,
      excerpt,
      content,
      cover_image,
      author,
      published,
      tags,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') return badRequest(res, 'Slug already in use');
    throw error;
  }
  return res.status(201).json(data);
}
