import { useEffect, useState } from 'react';
import { Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { invalidateAdSlotsCache } from '../../lib/adSlots';
import { KNOWN_AD_POSITIONS, TEXT_LIMITS } from '../../lib/constants';
import type { AdSlot } from '../../types';
import Seo from '../../components/Seo';
import Loader from '../../components/Loader';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../components/Toast';

interface FormState {
  position: string;
  code: string;
  is_active: boolean;
}

const empty: FormState = { position: '', code: '', is_active: true };

export default function AdminAdSlots() {
  const [data, setData] = useState<AdSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const [editing, setEditing] = useState<AdSlot | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    api
      .get<{ data: AdSlot[] }>('/admin/ad-slots')
      .then((res) => setData(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load ad slots'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    if (editing) {
      setForm({ position: editing.position, code: editing.code, is_active: editing.is_active });
      setShowForm(true);
    }
  }, [editing]);

  const onCreate = () => {
    setEditing(null);
    setForm(empty);
    setShowForm(true);
  };

  const refetchAndSync = () => {
    invalidateAdSlotsCache(); // so the public site picks up the change immediately
    load();
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.position.trim() || !form.code.trim()) {
      toast.push('Position and ad code are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        position: form.position.trim(),
        code: form.code.trim(),
        is_active: form.is_active,
      };
      if (editing) {
        await api.patch<AdSlot>(`/ad-slots/${editing.id}`, payload);
        toast.push('Ad slot updated', 'success');
      } else {
        await api.post<AdSlot>('/ad-slots', payload);
        toast.push('Ad slot created', 'success');
      }
      setShowForm(false);
      setEditing(null);
      refetchAndSync();
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const onToggleActive = async (slot: AdSlot) => {
    try {
      await api.patch(`/ad-slots/${slot.id}`, { is_active: !slot.is_active });
      toast.push(slot.is_active ? 'Ad slot disabled' : 'Ad slot enabled', 'success');
      refetchAndSync();
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : 'Update failed', 'error');
    }
  };

  const onDelete = async (slot: AdSlot) => {
    if (!confirm(`Delete the ad slot at "${slot.position}"?`)) return;
    try {
      await api.delete(`/ad-slots/${slot.id}`);
      toast.push('Ad slot deleted', 'success');
      refetchAndSync();
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : 'Delete failed', 'error');
    }
  };

  return (
    <>
      <Seo title="Admin · Ad slots" noIndex />
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Ad slots</h1>
          <p className="mt-1 text-sm text-slate-400">
            Place ad code (AdSense/JS) at any position across the site.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-400 hover:to-violet-400"
        >
          <Plus className="h-4 w-4" /> Add ad slot
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={onSave}
          className="mb-8 grid gap-4 rounded-2xl border border-white/5 bg-slate-900/60 p-5"
        >
          <div>
            <label htmlFor="ad-position" className="block text-sm font-medium text-white">
              Position
            </label>
            <input
              id="ad-position"
              type="text"
              list="known-ad-positions"
              value={form.position}
              onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
              className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              placeholder="e.g. tool_detail_top"
              required
              maxLength={TEXT_LIMITS.ad_slot_position}
            />
            <datalist id="known-ad-positions">
              {KNOWN_AD_POSITIONS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
            <p className="mt-1 text-xs text-slate-500">
              Type any name you like. Suggested positions already wired into the site:{' '}
              {KNOWN_AD_POSITIONS.join(', ')}.
            </p>
          </div>
          <div>
            <label htmlFor="ad-code" className="block text-sm font-medium text-white">
              Ad code
            </label>
            <textarea
              id="ad-code"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              rows={8}
              maxLength={TEXT_LIMITS.ad_slot_code}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 font-mono text-xs text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              placeholder="Paste the AdSense <script>/<ins> snippet here"
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="h-4 w-4 rounded border-white/20 bg-slate-950/60"
            />
            Active (visible on the site)
          </label>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
              }}
              className="h-10 rounded-lg border border-white/10 bg-slate-900/60 px-4 text-sm font-medium text-slate-200 hover:border-white/20 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : editing ? 'Update ad slot' : 'Create ad slot'}
            </button>
          </div>
        </form>
      )}

      {loading && <Loader label="Loading ad slots…" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && data.length === 0 && (
        <EmptyState
          title="No ad slots yet"
          description="Add your first ad slot and pick where it should show up."
          action={
            <button
              type="button"
              onClick={onCreate}
              className="rounded-lg border border-white/10 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 hover:border-white/20 hover:text-white"
            >
              Add ad slot
            </button>
          }
        />
      )}
      {!loading && !error && data.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-white/5">
          <table className="min-w-full divide-y divide-white/5 text-sm">
            <thead className="bg-slate-900/60 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Code preview</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.map((slot) => (
                <tr key={slot.id} className="bg-slate-950/40">
                  <td className="px-4 py-3 font-mono text-xs text-white">{slot.position}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-1 text-[11px] font-semibold ring-1 ${
                        slot.is_active
                          ? 'bg-emerald-500/15 text-emerald-200 ring-emerald-500/30'
                          : 'bg-white/5 text-slate-400 ring-white/10'
                      }`}
                    >
                      {slot.is_active ? 'active' : 'disabled'}
                    </span>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-slate-400">
                    {slot.code}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onToggleActive(slot)}
                        title={slot.is_active ? 'Disable' : 'Enable'}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/20 hover:text-white"
                      >
                        {slot.is_active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(slot)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/20 hover:text-white"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(slot)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-slate-900/60 text-red-300 hover:border-red-500/40 hover:text-red-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
