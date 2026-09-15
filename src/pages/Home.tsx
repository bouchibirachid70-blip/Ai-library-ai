import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Compass, ShieldCheck, Zap } from 'lucide-react';
import { api } from '../lib/api';
import type { Article, Category, Tool } from '../types';
import Seo from '../components/Seo';
import ToolCard from '../components/ToolCard';
import CategoryCard from '../components/CategoryCard';
import Loader from '../components/Loader';
import { formatDate } from '../lib/format';

export default function Home() {
  const [featured, setFeatured] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState({ tools: 0, categories: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      api.get<{ data: Tool[]; total: number }>('/tools?featured=true&per_page=6&sort=newest'),
      api.get<{ data: Category[] }>('/categories?with_counts=true'),
      api.get<{ data: Article[] }>('/articles?per_page=3'),
    ])
      .then(([t, c, a]) => {
        if (!active) return;
        setFeatured(t.data);
        setCategories(c.data);
        setArticles(a.data);
        setStats({
          tools: t.total ?? t.data.length,
          categories: c.data.length,
        });
      })
      .catch(() => {
        if (!active) return;
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <Seo
        title="Discover the best AI tools"
        description="Aivora is a curated directory of the best AI tools. Find, search, and filter AI products across writing, design, code, productivity, research, and more."
        canonical="/"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Aivora',
            url: typeof window !== 'undefined' ? window.location.origin : undefined,
            potentialAction: {
              '@type': 'SearchAction',
              target:
                typeof window !== 'undefined'
                  ? `${window.location.origin}/tools?search={search_term_string}`
                  : undefined,
              'query-input': 'required name=search_term_string',
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Aivora',
            url: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
        ]}
      />
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 lg:px-8 lg:pt-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
              <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
              {stats.tools}+ AI tools · {stats.categories} categories
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              The directory for{' '}
              <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                modern AI tools
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">
              Aivora helps you discover, compare, and launch the AI products that
              actually move your work forward. Search across {stats.tools}+ tools
              in one calm, curated catalog.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/tools"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-400 hover:to-violet-400"
              >
                Browse tools
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/submit"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-5 py-3 text-sm font-semibold text-slate-200 hover:border-white/20 hover:text-white"
              >
                Submit a tool
              </Link>
            </div>
            <dl className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { icon: Compass, label: 'Curated catalog', value: 'No link farms' },
                { icon: ShieldCheck, label: 'Verified pricing', value: 'Free · Paid · Freemium' },
                { icon: Zap, label: 'Fast discovery', value: 'Search & filter instantly' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 rounded-2xl border border-white/5 bg-slate-900/40 p-4"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                    <item.icon className="h-4 w-4 text-indigo-300" />
                  </span>
                  <div>
                    <dt className="text-sm font-semibold text-white">{item.label}</dt>
                    <dd className="text-xs text-slate-400">{item.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Featured tools
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Hand-picked by our editors — updated weekly.
            </p>
          </div>
          <Link
            to="/tools"
            className="hidden text-sm font-semibold text-indigo-300 hover:text-indigo-200 sm:inline-flex sm:items-center sm:gap-1"
          >
            See all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {loading ? (
          <Loader label="Loading featured tools…" />
        ) : featured.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/40 p-10 text-center text-slate-400">
            No featured tools yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Browse by category
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              From writing to engineering, find tools by what you do.
            </p>
          </div>
          <Link
            to="/categories"
            className="hidden text-sm font-semibold text-indigo-300 hover:text-indigo-200 sm:inline-flex sm:items-center sm:gap-1"
          >
            All categories <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {categories.length === 0 ? (
          <Loader label="Loading categories…" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.slice(0, 8).map((c) => (
              <CategoryCard key={c.id} category={c} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              From the blog
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Field notes, comparisons, and how-tos.
            </p>
          </div>
          <Link
            to="/blog"
            className="hidden text-sm font-semibold text-indigo-300 hover:text-indigo-200 sm:inline-flex sm:items-center sm:gap-1"
          >
            All articles <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {articles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/40 p-10 text-center text-slate-400">
            No articles yet — check back soon.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
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
                  {a.excerpt && (
                    <p className="mt-2 line-clamp-3 text-sm text-slate-400">
                      {a.excerpt}
                    </p>
                  )}
                  <span className="mt-auto pt-4 text-sm font-medium text-indigo-300 group-hover:text-indigo-200">
                    Read article →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
