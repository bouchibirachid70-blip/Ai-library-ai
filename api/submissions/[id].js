// /api/submissions/[id]
//   GET   — admin: read full submission
//   PATCH — admin: approve / reject / add notes
//   DELETE — admin: discard

import { handleOptions } from '../_lib/cors.js';
import {
  asEnum,
  asOptionalString,
  badRequest,
  notFound,
  serverError,
  requireUuid,
} from '../_lib/validation.js';
import { requireAdmin } from '../_lib/auth.js';
import supabase from '../_lib/db-client.js';
import { TEXT_LIMITS } from '../_lib/constants.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  try {
    const id = req.query.id;
    if (!requireUuid(id, res, 'id')) return;

    if (req.method === 'GET') return getSubmission(req, res, id);
    if (req.method === 'PATCH' || req.method === 'PUT') return updateSubmission(req, res, id);
    if (req.method === 'DELETE') return deleteSubmission(req, res, id);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return serverError(res, err);
  }
}

async function getSubmission(req, res, id) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { data, error } = await supabase
    .from('submissions')
    .select('*, category:categories(id, name, slug, icon)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return notFound(res);
  return res.status(200).json(data);
}

async function updateSubmission(req, res, id) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const body = req.body || {};
  const update = {};
  if ('status' in body) {
    const v = asEnum(body.status, ['pending', 'approved', 'rejected']);
    if (!v) return badRequest(res, 'invalid status');
    update.status = v;
  }
  if ('notes' in body) update.notes = asOptionalString(body.notes, TEXT_LIMITS.notes);
  if (Object.keys(update).length === 0) return badRequest(res, 'No updatable fields provided');

  const { data, error } = await supabase
    .from('submissions')
    .update(update)
    .eq('id', id)
    .select('*, category:categories(id, name, slug, icon)')
    .single();
  if (error) {
    if (error.code === 'PGRST116') return notFound(res);
    throw error;
  }
  return res.status(200).json(data);
}

async function deleteSubmission(req, res, id) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { error } = await supabase.from('submissions').delete().eq('id', id);
  if (error) throw error;
  return res.status(200).json({ ok: true });
}
