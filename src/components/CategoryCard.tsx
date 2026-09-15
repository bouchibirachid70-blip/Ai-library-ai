import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Category } from '../types';

interface Props {
  category: Pick<Category, 'id' | 'name' | 'slug' | 'icon' | 'description'> & {
    tools_count?: number;
  };
}

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  Object.entries(Icons).filter(([, v]) => typeof v === 'object')
) as Record<string, LucideIcon>;

function resolveIcon(name?: string | null): LucideIcon {
  if (!name) return Icons.Sparkles;
  const pascal = name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((p) => p[0]!.toUpperCase() + p.slice(1))
    .join('');
  return ICON_MAP[pascal] || ICON_MAP[name] || Icons.Sparkles;
}

export default function CategoryCard({ category }: Props) {
  const Icon = useMemo(() => resolveIcon(category.icon), [category.icon]);
  return (
    <Link
      to={`/category/${category.slug}`}
      className="group relative flex h-full flex-col rounded-2xl border border-white/5 bg-slate-900/60 p-5 transition hover:border-white/10 hover:bg-slate-900/80"
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/15 via-violet-500/15 to-fuchsia-500/15 ring-1 ring-white/10">
          <Icon className="h-5 w-5 text-indigo-300" />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-white">
            {category.name}
          </h3>
          {typeof category.tools_count === 'number' && (
            <p className="text-xs text-slate-400">
              {category.tools_count} {category.tools_count === 1 ? 'tool' : 'tools'}
            </p>
          )}
        </div>
      </div>
      {category.description && (
        <p className="mt-3 line-clamp-2 text-sm leading-5 text-slate-400">
          {category.description}
        </p>
      )}
    </Link>
  );
}
