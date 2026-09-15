import { Link } from 'react-router-dom';
import { ArrowUpRight, Star } from 'lucide-react';
import type { Tool } from '../types';
import { formatNumber, safeHostname } from '../lib/format';

interface Props {
  tool: Tool;
  onClick?: () => void;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

const pricingStyles: Record<string, string> = {
  Free: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  Freemium: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
  Paid: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  Contact: 'bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-500/30',
};

export default function ToolCard({ tool, onClick }: Props) {
  const host = safeHostname(tool.website_url);
  return (
    <Link
      to={`/tools/${tool.slug}`}
      onClick={onClick}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60 p-5 transition hover:border-white/10 hover:bg-slate-900/80"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-indigo-500/0 via-violet-500/0 to-fuchsia-500/0 opacity-0 transition-opacity group-hover:from-indigo-500/10 group-hover:via-violet-500/10 group-hover:to-fuchsia-500/10 group-hover:opacity-100"
      />
      <div className="flex items-start gap-4">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 ring-1 ring-white/10">
          {tool.logo_url ? (
            <img
              src={tool.logo_url}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-300">
              {initials(tool.name)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-base font-semibold text-white">{tool.name}</h3>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:text-white" />
          </div>
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-400">
            {tool.description}
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-xs">
        <div className="flex min-w-0 items-center gap-2">
          {tool.category && (
            <span className="rounded-md bg-white/5 px-2 py-1 text-[11px] font-medium text-slate-300 ring-1 ring-white/10">
              {tool.category.name}
            </span>
          )}
          <span
            className={`rounded-md px-2 py-1 text-[11px] font-semibold ring-1 ${
              pricingStyles[tool.pricing] ?? 'bg-white/5 text-slate-300 ring-white/10'
            }`}
          >
            {tool.pricing}
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          {tool.rating > 0 && (
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {tool.rating.toFixed(1)}
            </span>
          )}
          <span title={host}>{formatNumber(tool.clicks_count || 0)}</span>
        </div>
      </div>
    </Link>
  );
}
