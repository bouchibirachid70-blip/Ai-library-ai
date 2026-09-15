import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Pencil, Plus, Trash2, Star, EyeOff, Eye } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import type { Tool } from '../../types';
import Seo from '../../components/Seo';
import Loader from '../../components/Loader';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import { useToast } from '../../components/Toast';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { formatDate, formatNumber } from '../../lib/format';

export default function AdminTools() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') || '1');
  const statusFilter = searchParams.get('status') || 'all';
  const [data, setData] = useState<Tool[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const { isAdmin } = useAdminAuth();

  const load = async (nextPage = page) => {
    setLoading(true);
    setError(null);
    try {
      // Admin can request unapproved tools with status filter.
      const params = new URLSearchParams();
      params.set('page', String(nextPage));
      params.set('per_page', '20');
      if (statusFilter !== 'all') params.set('status', statusFilter);
      // We need an admin endpoint to fetch non-approved tools; expose a
      // generic admin-listing by using a different param: include_status.
      params.set('include_status', 'true');
      const res = await api.get<{ data: Tool[]; total: number; total_pages: number; page: number; per_page: number }>(
        `/admin/tools?${params.toString()}`
      );
      setData(res.data);
      setTotal(res.total);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tools');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, isAdmin]);

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(searchParams);
    if (v && v !== 'all') next.set(k, v);
    else next.delete(k);
    if (k !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const onDelete = async (t: Tool) => {
    if (!confirm(`Delete "${t.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/tools/${t.id}`);
      toast.push('Tool deleted', 'success');
      load();
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : 'Delete failed', 'error');
    }
  };

  const onToggleFeatured = async (t: Tool) => {
    try {
      await api.patch(`/tools/${t.id}`, { featured: !t.featured });
      toast.push(t.featured ? 'Unfeatured' : 'Marked as featured', 'success');
      load();
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : 'Update failed', 'error');
    }
  };

  const onSetStatus = async (t: Tool, status: 'approved' | 'pending' | 'rejected') => {
    try {
      await api.patch(`/tools/${t.id}`, { status });
      toast.push(`Status set to ${status}`, 'success');
      load();
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : 'Update failed', 'error');
    }
  };

  return (
    <>
      <Seo title="Admin · Tools" noIndex />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Tools</h1>
          <p className="mt-1 text-sm text-slate-400">{total} tools in directory</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setParam('status', e.target.value)}
            className="h-10 rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white focus:border-indigo-400 focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <Link
            to="/admin/tools/new"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-400 hover:to-violet-400"
          >
            <Plus className="h-4 w-4" /> New tool
          </Link>
        </div>
      </div>
      {loading && <Loader label="Loading tools…" />}
      {!loading && error && <ErrorState message={error} onRetry={() => load()} />}
      {!loading && !error && data.length === 0 && (
        <EmptyState
          title="No tools"
          description="Add a tool to get started."
          action={
            <Link
              to="/admin/tools/new"
              className="rounded-lg border border-white/10 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 hover:border-white/20 hover:text-white"
            >
              Add the first tool
            </Link>
          }
        />
      )}
      {!loading && !error && data.length > 0 && (
        <>
          <div className="overflow-hidden rounded-2xl border border-white/5">
            <table className="min-w-full divide-y divide-white/5 text-sm">
              <thead className="bg-slate-900/60 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Tool</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Pricing</th>
                  <th className="px-4 py-3">Clicks</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.map((t) => (
                  <tr key={t.id} className="bg-slate-950/40">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{t.name}</div>
                      <div className="text-xs text-slate-500">
                        {t.category?.name || '—'} · {t.slug}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={t.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-300">{t.pricing}</td>
                    <td className="px-4 py-3 text-slate-300">{formatNumber(t.clicks_count)}</td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(t.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onToggleFeatured(t)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/20 hover:text-white"
                          title={t.featured ? 'Unfeature' : 'Feature'}
                        >
                          <Star className={`h-4 w-4 ${t.featured ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                        {t.status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => onSetStatus(t, 'approved')}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/10 bg-slate-900/60 px-2 text-xs text-emerald-300 hover:border-white/20"
                          >
                            <Eye className="h-3.5 w-3.5" /> Approve
                          </button>
                        )}
                        {t.status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => onSetStatus(t, 'rejected')}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/10 bg-slate-900/60 px-2 text-xs text-red-300 hover:border-white/20"
                          >
                            <EyeOff className="h-3.5 w-3.5" /> Reject
                          </button>
                        )}
                        <Link
                          to={`/admin/tools/${t.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/20 hover:text-white"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => onDelete(t)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-slate-900/60 text-red-300 hover:border-red-500/40 hover:text-red-200"
                          title="Delete"
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
          <div className="mt-6">
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={(n) => setParam('page', String(n))}
            />
          </div>
        </>
      )}
    </>
  );
}

function StatusPill({ status }: { status: Tool['status'] }) {
  const map: Record<Tool['status'], string> = {
    approved: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
    pending: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
    rejected: 'bg-red-500/15 text-red-300 ring-red-500/30',
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ${map[status]}`}>
      {status}
    </span>
  );
}
