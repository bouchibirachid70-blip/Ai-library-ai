import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowUpRight,
  Calendar,
  ChevronLeft,
  Globe,
  MousePointerClick,
  Star,
  Tag as TagIcon,
} from 'lucide-react';
import Seo from '../components/Seo';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';
import ToolCard from '../components/ToolCard';
import { useTool } from '../hooks/useTools';
import { recordToolClick } from '../hooks/useTools';
import { api } from '../lib/api';
import type { Tool } from '../types';
import { formatDate, safeHostname } from '../lib/format';

export default function ToolDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: tool, loading, error } = useTool(slug);
  const [related, setRelated] = useState<Tool[]>([]);

  useEffect(() => {
    if (!tool) return;
    api
      .get<{ data: Tool[] }>(
        `/tools?per_page=4&sort=popular${tool.category_id ? `&category=${tool.category_id}` : ''}`
      )
      .then((res) => {
        setRelated((res.data || []).filter((t) => t.id !== tool.id).slice(0, 3));
      })
      .catch(() => setRelated([]));
  }, [tool]);

  const hostname = useMemo(() => (tool ? safeHostname(tool.website_url) : ''), [tool]);

  const onVisit = () => {
    if (!tool) return;
    recordToolClick(tool.id, window.location.href);
    window.open(tool.website_url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <Loader label="Loading tool…" />
      </div>
    );
  }
  if (error || !tool) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <ErrorState
          title="Tool not found"
          message={error || "We couldn't find that tool."}
          onRetry={() => navigate('/tools')}
        />
        <div className="mt-6 text-center">
          <Link to="/tools" className="text-sm text-indigo-300 hover:text-indigo-200">
            ← Back to all tools
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Seo
        title={tool.name}
        description={tool.description}
        canonical={`/tools/${tool.slug}`}
        type="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: tool.name,
          description: tool.description,
          applicationCategory: 'AI Tool',
          url: tool.website_url,
          ...(tool.logo_url ? { image: tool.logo_url } : {}),
          ...(tool.category ? { applicationSubCategory: tool.category.name } : {}),
          ...(tool.tags && tool.tags.length ? { keywords: tool.tags.join(', ') } : {}),
          ...(tool.rating
            ? {
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: tool.rating,
                  bestRating: 5,
                  ratingCount: tool.clicks_count || 1,
                },
              }
            : {}),
          offers: { '@type': 'Offer', description: tool.pricing },
        }}
      />
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          to="/tools"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" /> All tools
        </Link>

        <div className="mt-6 flex flex-col gap-6 rounded-3xl border border-white/5 bg-slate-900/60 p-6 sm:flex-row sm:items-start sm:p-8">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 ring-1 ring-white/10">
            {tool.logo_url ? (
              <img
                src={tool.logo_url}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xl font-semibold text-slate-300">
                {tool.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {tool.category && (
                <Link
                  to={`/category/${tool.category.slug}`}
                  className="rounded-md bg-white/5 px-2 py-1 text-[11px] font-medium text-slate-300 ring-1 ring-white/10 hover:bg-white/10"
                >
                  {tool.category.name}
                </Link>
              )}
              <span className="rounded-md bg-indigo-500/15 px-2 py-1 text-[11px] font-semibold text-indigo-200 ring-1 ring-indigo-500/30">
                {tool.pricing}
              </span>
              {tool.featured && (
                <span className="rounded-md bg-amber-500/15 px-2 py-1 text-[11px] font-semibold text-amber-200 ring-1 ring-amber-500/30">
                  Featured
                </span>
              )}
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {tool.name}
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-300">{tool.description}</p>

            <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl bg-white/5 p-3">
                <dt className="flex items-center gap-1 text-xs text-slate-400">
                  <MousePointerClick className="h-3.5 w-3.5" /> Clicks
                </dt>
                <dd className="mt-1 text-lg font-semibold text-white">
                  {tool.clicks_count || 0}
                </dd>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <dt className="flex items-center gap-1 text-xs text-slate-400">
                  <Star className="h-3.5 w-3.5" /> Rating
                </dt>
                <dd className="mt-1 text-lg font-semibold text-white">
                  {tool.rating ? tool.rating.toFixed(1) : '—'}
                </dd>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <dt className="flex items-center gap-1 text-xs text-slate-400">
                  <Calendar className="h-3.5 w-3.5" /> Added
                </dt>
                <dd className="mt-1 text-sm font-medium text-white">
                  {formatDate(tool.created_at)}
                </dd>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <dt className="flex items-center gap-1 text-xs text-slate-400">
                  <Globe className="h-3.5 w-3.5" /> Domain
                </dt>
                <dd className="mt-1 truncate text-sm font-medium text-white">{hostname}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onVisit}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-400 hover:to-violet-400"
              >
                Visit website <ArrowUpRight className="h-4 w-4" />
              </button>
              <Link
                to="/tools"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-5 py-3 text-sm font-semibold text-slate-200 hover:border-white/20 hover:text-white"
              >
                More tools
              </Link>
            </div>
          </div>
        </div>

        {tool.tags && tool.tags.length > 0 && (
          <div className="mt-8 rounded-2xl border border-white/5 bg-slate-900/40 p-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-slate-300">
              <TagIcon className="h-4 w-4 text-indigo-300" /> Tags
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {tool.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-white/5 px-2.5 py-1 text-xs text-slate-300 ring-1 ring-white/10"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold tracking-tight text-white">Related tools</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((t) => (
                <ToolCard key={t.id} tool={t} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
