import { Search, X } from 'lucide-react';
import { PRICING_OPTIONS } from '../lib/constants';

export interface FilterValue {
  search: string;
  category: string;
  pricing: string;
  sort: string;
}

interface Props {
  value: FilterValue;
  onChange: (next: FilterValue) => void;
  categories: Array<{ id: string; slug: string; name: string }>;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most popular' },
  { value: 'rating', label: 'Top rated' },
  { value: 'name', label: 'Name (A–Z)' },
];

export default function FilterBar({ value, onChange, categories }: Props) {
  const update = (patch: Partial<FilterValue>) => onChange({ ...value, ...patch });

  const clear =
    value.search === '' &&
    value.category === '' &&
    value.pricing === '' &&
    value.sort === 'newest';

  return (
    <div className="grid gap-3 rounded-2xl border border-white/5 bg-slate-900/60 p-3 sm:grid-cols-2 lg:grid-cols-12">
      <div className="relative lg:col-span-5">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          placeholder="Search AI tools…"
          aria-label="Search tools"
          value={value.search}
          onChange={(e) => update({ search: e.target.value })}
          className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
        />
      </div>
      <div className="lg:col-span-3">
        <label className="sr-only" htmlFor="filter-category">Category</label>
        <select
          id="filter-category"
          value={value.category}
          onChange={(e) => update({ category: e.target.value })}
          className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="lg:col-span-2">
        <label className="sr-only" htmlFor="filter-pricing">Pricing</label>
        <select
          id="filter-pricing"
          value={value.pricing}
          onChange={(e) => update({ pricing: e.target.value })}
          className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
        >
          <option value="">All pricing</option>
          {PRICING_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <div className="lg:col-span-2">
        <label className="sr-only" htmlFor="filter-sort">Sort</label>
        <select
          id="filter-sort"
          value={value.sort}
          onChange={(e) => update({ sort: e.target.value })}
          className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {!clear && (
        <div className="sm:col-span-2 lg:col-span-12">
          <button
            type="button"
            onClick={() =>
              onChange({ search: '', category: '', pricing: '', sort: 'newest' })
            }
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-slate-950/60 px-3 text-xs text-slate-300 hover:border-white/20 hover:text-white"
          >
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
