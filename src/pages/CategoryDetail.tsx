import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import Seo from '../components/Seo';
import ToolCard from '../components/ToolCard';
import FilterBar, { type FilterValue } from '../components/FilterBar';
import Pagination from '../components/Pagination';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { useCategoryBySlug, useCategories } from '../hooks/useCategories';
import { useTools } from '../hooks/useTools';
import { useDebounce } from '../hooks/useDebounce';

export default function CategoryDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: category, loading: catLoading, error: catError } = useCategoryBySlug(slug);
  const { data: categories } = useCategories(false);

  const [filter, setFilter] = useState<FilterValue>({
    search: '',
    category: '',
    pricing: '',
    sort: 'newest',
  });
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(filter.search, 250);

  // When the URL slug changes, make sure internal state matches.
  useEffect(() => {
    setFilter((f) => ({ ...f, category: slug || '' }));
    setPage(1);
  }, [slug]);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      category: filter.category || slug || undefined,
      pricing: filter.pricing || undefined,
      sort: filter.sort,
      page,
      per_page: 12,
    }),
    [debouncedSearch, filter.category, filter.pricing, filter.sort, page, slug]
  );

  const { data, total, totalPages, loading, error, refetch } = useTools(filters);

  const onFilterChange = (next: FilterValue) => {
    setFilter(next);
    setPage(1);
  };

  return (
    <>
      <Seo
        title={category ? `${category.name} AI tools` : 'Category'}
        description={
          category?.description ||
          `Browse AI tools in the ${category?.name || ''} category.`
        }
        canonical={`/category/${slug}`}
      />
      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <Link
          to="/categories"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" /> All categories
        </Link>
        {catLoading ? (
          <div className="mt-6"><Loader label="Loading category…" /></div>
        ) : catError ? (
          <div className="mt-6"><ErrorState message={catError} /></div>
        ) : !category ? (
          <div className="mt-6">
            <EmptyState
              title="Category not found"
              description="That category doesn't exist or has been removed."
              action={
                <Link
                  to="/categories"
                  className="rounded-lg border border-white/10 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 hover:border-white/20 hover:text-white"
                >
                  Browse categories
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-6">
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-300">
                Category
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {category.name}
              </h1>
              {category.description && (
                <p className="mt-2 max-w-2xl text-sm text-slate-400">{category.description}</p>
              )}
            </div>
            <div className="mt-6">
              <FilterBar
                value={filter}
                onChange={onFilterChange}
                categories={categories.map((c) => ({ id: c.id, slug: c.slug, name: c.name }))}
              />
            </div>
          </>
        )}
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {loading && <Loader label="Loading tools…" />}
        {!loading && error && <ErrorState message={error} onRetry={refetch} />}
        {!loading && !error && data.length === 0 && (
          <EmptyState
            title="No tools yet in this category"
            description="Check back soon, or submit a tool to fill this gap."
            action={
              <Link
                to="/submit"
                className="rounded-lg border border-white/10 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 hover:border-white/20 hover:text-white"
              >
                Submit a tool
              </Link>
            }
          />
        )}
        {!loading && !error && data.length > 0 && (
          <>
            <p className="mb-4 text-sm text-slate-400">
              Showing {data.length} of {total} tools
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
            <div className="mt-10">
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          </>
        )}
      </div>
    </>
  );
}
