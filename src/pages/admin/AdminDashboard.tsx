import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MousePointerClick, Wrench, Inbox, Tags, Newspaper, FileText, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { api } from '../../lib/api';
import type { Metrics } from '../../types';
import Seo from '../../components/Seo';
import Loader from '../../components/Loader';
import ErrorState from '../../components/ErrorState';

export default function AdminDashboard() {
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get<Metrics>('/metrics')
      .then((d) => active && setData(d))
      .catch((err) => active && setError(err instanceof Error ? err.message : 'Failed to load metrics'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <Loader label="Loading metrics…" />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!data) return null;

  const cards: Array<{ label: string; value: number; icon: React.ReactNode; to?: string; hint?: string }> = [
    { label: 'Total tools', value: data.total_tools, icon: <Wrench className="h-4 w-4" />, to: '/admin/tools' },
    { label: 'Approved', value: data.approved_tools, icon: <CheckCircle2 className="h-4 w-4" />, to: '/admin/tools' },
    { label: 'Pending tools', value: data.pending_tools, icon: <Clock className="h-4 w-4" />, to: '/admin/tools' },
    { label: 'Categories', value: data.total_categories, icon: <Tags className="h-4 w-4" />, to: '/admin/categories' },
    { label: 'Articles', value: data.total_articles, icon: <Newspaper className="h-4 w-4" />, to: '/admin/articles' },
    { label: 'Published', value: data.published_articles, icon: <FileText className="h-4 w-4" />, to: '/admin/articles' },
    { label: 'Submissions', value: data.total_submissions, icon: <Inbox className="h-4 w-4" />, to: '/admin/submissions' },
    { label: 'Pending submissions', value: data.pending_submissions, icon: <Inbox className="h-4 w-4" />, to: '/admin/submissions' },
    { label: 'Clicks (7d)', value: data.recent_clicks, icon: <TrendingUp className="h-4 w-4" />, hint: `${data.total_clicks} total` },
  ];

  return (
    <>
      <Seo title="Admin dashboard" noIndex />
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">Overview of the directory.</p>
        </div>
        <span className="hidden text-xs text-slate-500 sm:inline">Last 7 days</span>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((c) => {
          const inner = (
            <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium uppercase tracking-wider">{c.label}</span>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-indigo-300 ring-1 ring-white/10">
                  {c.icon}
                </span>
              </div>
              <div className="mt-3 text-2xl font-bold text-white">{c.value}</div>
              {c.hint && <div className="mt-1 text-xs text-slate-500">{c.hint}</div>}
            </div>
          );
          return c.to ? (
            <Link key={c.label} to={c.to} className="block transition hover:bg-white/5 rounded-2xl">
              {inner}
            </Link>
          ) : (
            <div key={c.label}>{inner}</div>
          );
        })}
      </div>

      {data.top_tools.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-white">Top tools by clicks</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/5">
            <table className="min-w-full divide-y divide-white/5 text-sm">
              <thead className="bg-slate-900/60 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Tool</th>
                  <th className="px-4 py-3 text-right">Clicks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.top_tools.map((t, i) => (
                  <tr key={t.id} className="bg-slate-950/40">
                    <td className="px-4 py-3 text-white">
                      <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-md bg-white/5 text-[10px] text-slate-400">
                        {i + 1}
                      </span>
                      <Link to={`/admin/tools`} className="hover:underline">
                        {t.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">
                      <span className="inline-flex items-center gap-1">
                        <MousePointerClick className="h-3.5 w-3.5 text-slate-500" />
                        {t.clicks_count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
