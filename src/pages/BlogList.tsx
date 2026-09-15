import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Article, PaginatedResponse } from '../types';
import Seo from '../components/Seo';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../lib/format';
import { plainTextSummary } from '../lib/sanitize';

export default function BlogList() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .get<PaginatedResponse<Article>>(`/articles?page=${page}&per_page=9`)
      .then((res) => {
        if (!active) return;
        setData(res.data);
        setTotal(res.total);
        setTotalPages(res.total_pages || 1);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load articles');
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page]);

  return (
    <>
      <Seo
        title="Blog"
        description="Articles, comparisons, and field notes from the Aivora editorial team."
        canonical="/blog"
      />
      <PageHeader
        eyebrow="Stories"
        title="Aivora blog"
        description="Comparisons, workflow deep-dives, and notes from people building with AI."
      />
      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        {loading && <Loader label="Loading articles…" />}
        {!loading && error && <ErrorState message={error} onRetry={() => setPage(1)} />}
        {!loading && !error && data.length === 0 && (
          <EmptyState
            title="No articles yet"
            description="Editorial content will appear here once it's published."
          />
        )}
        {!loading && !error && data.length > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((a) => (
                <Link
                  key={a.id}
                  to={`/blog/${a.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60 transition hover:border-white/10 hover:bg-slate-900/80"
                >
                  {a.cover_image && (
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-800">
                      <img
                        src={a.cover_image}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="text-xs text-slate-400">
                      {formatDate(a.created_at)} · {a.author}
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-base font-semibold text-white">
                      {a.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm text-slate-400">
                      {a.excerpt || plainTextSummary(a.content, 200)}
                    </p>
                    <span className="mt-auto pt-4 text-sm font-medium text-indigo-300 group-hover:text-indigo-200">
                      Read article →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-10">
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
            <p className="mt-3 text-center text-xs text-slate-500">
              Showing {data.length} of {total}
            </p>
          </>
        )}
      </div>
    </>
  );
}
