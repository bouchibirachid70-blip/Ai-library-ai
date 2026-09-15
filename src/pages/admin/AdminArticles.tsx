import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Pencil, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import type { Article } from '../../types';
import Seo from '../../components/Seo';
import Loader from '../../components/Loader';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import { useToast } from '../../components/Toast';
import { formatDate } from '../../lib/format';

export default function AdminArticles() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') || '1');
  const [data, setData] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const load = async (nextPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const sp = new URLSearchParams();
      sp.set('page', String(nextPage));
      sp.set('per_page', '20');
      sp.set('include_drafts', 'true');
      const res = await api.get<{
        data: Article[];
        total: number;
        total_pages: number;
        page: number;
        per_page: number;
      }>(`/articles?${sp.toString()}`);
      setData(res.data);
      setTotal(res.total);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== 'page') next.delete('page');
    setParams(next);
  };

  const onDelete = async (a: Article) => {
    if (!confirm(`Delete "${a.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/articles/${a.id}`);
      toast.push('Article deleted', 'success');
      load();
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : 'Delete failed', 'error');
    }
  };

  const onTogglePublished = async (a: Article) => {
    try {
      await api.patch(`/articles/${a.id}`, { published: !a.published });
      toast.push(a.published ? 'Unpublished' : 'Published', 'success');
      load();
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : 'Update failed', 'error');
    }
  };

  return (
    <>
      <Seo title="Admin · Articles" noIndex />
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Articles</h1>
          <p className="mt-1 text-sm text-slate-400">{total} articles</p>
        </div>
        <Link
          to="/admin/articles/new"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-400 hover:to-violet-400"
        >
          <Plus className="h-4 w-4" /> New article
        </Link>
      </div>
      {loading && <Loader label="Loading articles…" />}
      {!loading && error && <ErrorState message={error} onRetry={() => load()} />}
      {!loading && !error && data.length === 0 && (
        <EmptyState
          title="No articles yet"
          description="Publish your first article to get started."
          action={
            <Link
              to="/admin/articles/new"
              className="rounded-lg border border-white/10 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 hover:border-white/20 hover:text-white"
            >
              Create article
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
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.map((a) => (
                  <tr key={a.id} className="bg-slate-950/40">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{a.title}</div>
                      <div className="text-xs text-slate-500">{a.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ${
                          a.published
                            ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 ring-amber-500/30'
                        }`}
                      >
                        {a.published ? 'published' : 'draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{a.author}</td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(a.updated_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onTogglePublished(a)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/20 hover:text-white"
                          title={a.published ? 'Unpublish' : 'Publish'}
                        >
                          {a.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <Link
                          to={`/admin/articles/${a.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/20 hover:text-white"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => onDelete(a)}
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
            <Pagination page={page} totalPages={totalPages} onChange={(n) => setParam('page', String(n))} />
          </div>
        </>
      )}
    </>
  );
}
