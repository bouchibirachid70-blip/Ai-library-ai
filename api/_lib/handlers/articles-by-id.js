// /api/articles/[id]
//   GET   — public if published, admin otherwise
//   PATCH — admin
//   DELETE — admin

import { handleOptions } from '../cors.js';
import {
  asString,
  asOptionalString,
  asBool,
  asStringArray,
  badRequest,
  notFound,
  serverError,
  requireUuid,
  pick,
  requireHttpUrl,
  allowedArticleFields,
} from '../validation.js';
import { requireAdmin } from '../auth.js';
import supabase from '../db-client.js';
import { TEXT_LIMITS } from '../constants.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  try {
    const id = req.query.id;
    if (!requireUuid(id, res, 'id')) return;

    if (req.method === 'GET') return getArticle(req, res, id);
    if (req.method === 'PATCH' || req.method === 'PUT') return updateArticle(req, res, id);
    if (req.method === 'DELETE') return deleteArticle(req, res, id);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return serverError(res, err);
  }
}

async function getArticle(req, res, id) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return notFound(res);
  if (!data.published) {
    const admin = await requireAdmin(req, res);
    if (!admin) return notFound(res);
  }
  return res.status(200).json(data);
}

async function updateArticle(req, res, id) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const fields = pick(req.body || {}, allowedArticleFields());
  const update = { updated_at: new Date().toISOString() };

  if ('title' in fields) {
    const v = asString(fields.title, TEXT_LIMITS.article_title);
    if (!v) return badRequest(res, 'title cannot be empty');
    update.title = v;
  }
  if ('slug' in fields) {
    const v = asString(fields.slug, TEXT_LIMITS.article_title);
    if (!v) return badRequest(res, 'slug cannot be empty');
    update.slug = v;
  }
  if ('content' in fields) {
    const v = asString(fields.content, TEXT_LIMITS.article_content);
    if (!v) return badRequest(res, 'content cannot be empty');
    update.content = v;
  }
  if ('excerpt' in fields) update.excerpt = asOptionalString(fields.excerpt, TEXT_LIMITS.article_excerpt);
  if ('cover_image' in fields) {
    const v = asOptionalString(fields.cover_image, TEXT_LIMITS.article_cover);
    if (v && !requireHttpUrl(v, res, 'cover_image')) return;
    update.cover_image = v;
  }
  if ('author' in fields) {
    const v = asString(fields.author, TEXT_LIMITS.article_author);
    if (!v) return badRequest(res, 'author cannot be empty');
    update.author = v;
  }
  if ('published' in fields) update.published = asBool(fields.published, false);
  if ('tags' in fields) update.tags = asStringArray(fields.tags, 30);

  if (Object.keys(update).length === 1) return badRequest(res, 'No updatable fields provided');

  const { data, error } = await supabase
    .from('articles')
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

async function deleteArticle(req, res, id) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { error } = await supabase.from('articles').delete().eq('id', id);
  if (error) throw error;
  return res.status(200).json({ ok: true });
}
