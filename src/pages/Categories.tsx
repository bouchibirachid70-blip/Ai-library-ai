import Seo from '../components/Seo';
import PageHeader from '../components/PageHeader';
import CategoryCard from '../components/CategoryCard';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { useCategories } from '../hooks/useCategories';

export default function Categories() {
  const { data, loading, error, refetch } = useCategories(true);

  return (
    <>
      <Seo
        title="Categories"
        description="Browse AI tools by category: writing, design, code, productivity, research, and more."
        canonical="/categories"
      />
      <PageHeader
        eyebrow="Browse"
        title="Categories"
        description="Tools grouped by what they help you do. Pick a category to see the full list."
      />
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        {loading && <Loader label="Loading categories…" />}
        {!loading && error && <ErrorState message={error} onRetry={refetch} />}
        {!loading && !error && data.length === 0 && (
          <EmptyState
            title="No categories yet"
            description="Categories will appear here as they are added."
          />
        )}
        {!loading && !error && data.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.map((c) => (
              <CategoryCard key={c.id} category={c} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
