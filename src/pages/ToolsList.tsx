import { useMemo, useState } from 'react';
import Seo from '../components/Seo';
import AdSlot from '../components/AdSlot';
import FilterBar, { type FilterValue } from '../components/FilterBar';
import ToolCard from '../components/ToolCard';
import Pagination from '../components/Pagination';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { useTools } from '../hooks/useTools';
import { useCategories } from '../hooks/useCategories';
import { useDebounce } from '../hooks/useDebounce';
import { Link } from 'react-router-dom';

export default function ToolsList() {
  const [filter, setFilter] = useState<FilterValue>({
    search: '',
    category: '',
    pricing: '',
    sort: 'newest',
  });
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(filter.search, 250);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      category: filter.category || undefined,
      pricing: filter.pricing || undefined,
      sort: filter.sort,
      page,
      per_page: 12,
    }),
    [debouncedSearch, filter.category, filter.pricing, filter.sort, page]
  );

  const { data, total, totalPages, loading, error, refetch } = useTools(filters);
  const { data: categories } = useCategories(true);

  const categoryOptions = categories.map((c) => ({ id: c.id, slug: c.slug, name: c.name }));

  const onFilterChange = (next: FilterValue) => {
    setFilter(next);
    setPage(1);
  };

  return (
    <>
      <Seo
        title="AI tools directory"
        description="Browse and search the Aivora directory of AI tools. Filter by category, pricing, and popularity."
        canonical="/tools"
      />
      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-300">
              Directory
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              All AI tools
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Search and filter {total > 0 ? `${total} ` : ''}tools to find the
              right fit for your work.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <FilterBar value={filter} onChange={onFilterChange} categories={categoryOptions} />
        </div>
      </div>

      <AdSlot position="tools_list_top" className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8" />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {loading && <Loader label="Loading tools…" />}
        {!loading && error && <ErrorState message={error} onRetry={refetch} />}
        {!loading && !error && data.length === 0 && (
          <EmptyState
            title="No tools match your filters"
            description="Try clearing filters or adjusting your search term."
            action={
              <button
                type="button"
                onClick={() => onFilterChange({ search: '', category: '', pricing: '', sort: 'newest' })}
                className="rounded-lg border border-white/10 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 hover:border-white/20 hover:text-white"
              >
                Clear filters
              </button>
            }
          />
        )}
        {!loading && !error && data.length > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
            <div className="mt-10">
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
            <p className="mt-4 text-center text-xs text-slate-500">
              Page {page} of {totalPages} ·{' '}
              <Link to="/submit" className="text-indigo-300 hover:text-indigo-200">
                Submit a tool
              </Link>
            </p>
          </>
        )}
      </div>

      <AdSlot position="tools_list_bottom" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8" />
    </>
  );
}
