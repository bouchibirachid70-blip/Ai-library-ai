// /api/ad-slots/[id]
//   PATCH/PUT — admin: update position, code, or is_active.
//   DELETE     — admin: remove the ad slot.
// (No public GET here — the public list lives at GET /api/ad-slots.)

import { handleOptions } from '../cors.js';
import {
  asString,
  asBool,
  badRequest,
  notFound,
  serverError,
  requireUuid,
  pick,
  allowedAdSlotFields,
} from '../validation.js';
import { requireAdmin } from '../auth.js';
import supabase from '../db-client.js';
import { TEXT_LIMITS } from '../constants.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  try {
    const id = req.query.id;
    if (!requireUuid(id, res, 'id')) return;

    if (req.method === 'PUT' || req.method === 'PATCH') return updateAdSlot(req, res, id);
    if (req.method === 'DELETE') return deleteAdSlot(req, res, id);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return serverError(res, err);
  }
}

async function updateAdSlot(req, res, id) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const fields = pick(req.body || {}, allowedAdSlotFields());
  const update = {};
  if ('position' in fields) {
    const v = asString(fields.position, TEXT_LIMITS.ad_slot_position);
    if (!v) return badRequest(res, 'position cannot be empty');
    update.position = v;
  }
  if ('code' in fields) {
    const v = asString(fields.code, TEXT_LIMITS.ad_slot_code);
    if (!v) return badRequest(res, 'code cannot be empty');
    update.code = v;
  }
  if ('is_active' in fields) update.is_active = asBool(fields.is_active, true);

  if (Object.keys(update).length === 0) return badRequest(res, 'No updatable fields provided');

  const { data, error } = await supabase
    .from('ad_slots')
    .update(update)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    if (error.code === 'PGRST116') return notFound(res);
    throw error;
  }
  return res.status(200).json(data);
}

async function deleteAdSlot(req, res, id) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { error } = await supabase.from('ad_slots').delete().eq('id', id);
  if (error) throw error;
  return res.status(200).json({ ok: true });
}
