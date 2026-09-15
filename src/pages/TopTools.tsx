import { useMemo, useState } from 'react';
import Seo from '../components/Seo';
import PageHeader from '../components/PageHeader';
import ToolCard from '../components/ToolCard';
import FilterBar, { type FilterValue } from '../components/FilterBar';
import Pagination from '../components/Pagination';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { useTools } from '../hooks/useTools';
import { useCategories } from '../hooks/useCategories';
import { useDebounce } from '../hooks/useDebounce';

export default function TopTools() {
  const [filter, setFilter] = useState<FilterValue>({
    search: '',
    category: '',
    pricing: '',
    sort: 'popular',
  });
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(filter.search, 250);
  const { data: categories } = useCategories(false);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      category: filter.category || undefined,
      pricing: filter.pricing || undefined,
      sort: 'popular',
      page,
      per_page: 12,
    }),
    [debouncedSearch, filter.category, filter.pricing, page]
  );

  const { data, total, totalPages, loading, error, refetch } = useTools(filters);

  const onFilterChange = (next: FilterValue) => {
    setFilter(next);
    setPage(1);
  };

  return (
    <>
      <Seo
        title="Top AI tools"
        description="The most-clicked AI tools in the Aivora directory."
        canonical="/top-tools"
      />
      <PageHeader
        eyebrow="Top of the directory"
        title="Top tools"
        description="The most-used AI tools in our community, ranked by real click activity."
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FilterBar
          value={filter}
          onChange={onFilterChange}
          categories={categories.map((c) => ({ id: c.id, slug: c.slug, name: c.name }))}
        />
      </div>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {loading && <Loader label="Loading top tools…" />}
        {!loading && error && <ErrorState message={error} onRetry={refetch} />}
        {!loading && !error && data.length === 0 && (
          <EmptyState
            title="Not enough data yet"
            description="As people explore the directory, the most popular tools will surface here."
          />
        )}
        {!loading && !error && data.length > 0 && (
          <>
            <p className="mb-4 text-sm text-slate-400">{total} tools ranked by clicks</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((tool, idx) => (
                <div key={tool.id} className="relative">
                  <span className="absolute -top-2 -left-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white shadow-lg shadow-indigo-500/30">
                    {(page - 1) * 12 + idx + 1}
                  </span>
                  <ToolCard tool={tool} />
                </div>
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
