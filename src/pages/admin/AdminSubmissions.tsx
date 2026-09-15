import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, X, ExternalLink } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import type { Submission } from '../../types';
import Seo from '../../components/Seo';
import Loader from '../../components/Loader';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import { useToast } from '../../components/Toast';
import { formatDate, timeAgo } from '../../lib/format';

export default function AdminSubmissions() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') || '1');
  const status = params.get('status') || 'pending';
  const [data, setData] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const load = async (nextPage = page, nextStatus = status) => {
    setLoading(true);
    setError(null);
    try {
      const sp = new URLSearchParams();
      sp.set('page', String(nextPage));
      sp.set('per_page', '20');
      if (nextStatus && nextStatus !== 'all') sp.set('status', nextStatus);
      const res = await api.get<{
        data: Submission[];
        total: number;
        total_pages: number;
        page: number;
        per_page: number;
      }>(`/submissions?${sp.toString()}`);
      setData(res.data);
      setTotal(res.total);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v && v !== 'all') next.set(k, v);
    else next.delete(k);
    if (k !== 'page') next.delete('page');
    setParams(next);
  };

  const setStatus = async (s: Submission, next: 'approved' | 'rejected' | 'pending') => {
    try {
      await api.patch(`/submissions/${s.id}`, { status: next });
      toast.push(`Submission ${next}`, 'success');
      load();
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : 'Update failed', 'error');
    }
  };

  return (
    <>
      <Seo title="Admin · Submissions" noIndex />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Submissions</h1>
          <p className="mt-1 text-sm text-slate-400">{total} submissions</p>
        </div>
        <select
          value={status}
          onChange={(e) => setParam('status', e.target.value)}
          className="h-10 rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white focus:border-indigo-400 focus:outline-none"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      {loading && <Loader label="Loading submissions…" />}
      {!loading && error && <ErrorState message={error} onRetry={() => load()} />}
      {!loading && !error && data.length === 0 && (
        <EmptyState
          title="No submissions"
          description="When users submit tools via the public form, they'll appear here."
        />
      )}
      {!loading && !error && data.length > 0 && (
        <>
          <ul className="space-y-3">
            {data.map((s) => (
              <li key={s.id} className="rounded-2xl border border-white/5 bg-slate-900/60 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-white">{s.tool_name}</h3>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ${
                          s.status === 'pending'
                            ? 'bg-amber-500/15 text-amber-300 ring-amber-500/30'
                            : s.status === 'approved'
                            ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30'
                            : 'bg-red-500/15 text-red-300 ring-red-500/30'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                    <a
                      href={s.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-300 hover:text-indigo-200"
                    >
                      {s.website_url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <p className="mt-2 text-sm text-slate-300">{s.description}</p>
                    <div className="mt-2 text-xs text-slate-500">
                      From {s.submitter_email} · {timeAgo(s.created_at)} ·{' '}
                      <span title={formatDate(s.created_at)}>{formatDate(s.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => setStatus(s, 'approved')}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                    )}
                    {s.status !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => setStatus(s, 'rejected')}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 text-xs font-medium text-red-200 hover:bg-red-500/20"
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
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
