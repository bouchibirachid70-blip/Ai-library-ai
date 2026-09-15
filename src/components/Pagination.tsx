import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  totalPages: number;
  onChange: (next: number) => void;
}

export default function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const push = (n: number) => {
    if (n < 1 || n > totalPages) return;
    if (!pages.includes(n)) pages.push(n);
  };
  push(1);
  for (let i = page - 1; i <= page + 1; i++) push(i);
  push(totalPages);

  const list: Array<{ key: string; n: number; current?: boolean }> = [];
  let prev = 0;
  for (const n of pages) {
    if (prev && n - prev > 1) {
      list.push({ key: `gap-${prev}`, n: prev });
    }
    list.push({ key: `p-${n}`, n, current: n === page });
    prev = n;
  }

  return (
    <nav className="flex items-center justify-center gap-1 pt-2" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="inline-flex h-9 items-center gap-1 rounded-lg border border-white/10 bg-slate-900/60 px-3 text-sm text-slate-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" /> Prev
      </button>
      {list.map((p) =>
        p.key.startsWith('gap-') ? (
          <span
            key={p.key}
            className="inline-flex h-9 w-9 items-center justify-center text-sm text-slate-500"
            aria-hidden
          >
            …
          </span>
        ) : (
          <button
            key={p.key}
            type="button"
            onClick={() => onChange(p.n)}
            aria-current={p.current ? 'page' : undefined}
            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm transition ${
              p.current
                ? 'border-transparent bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30'
                : 'border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/20 hover:text-white'
            }`}
          >
            {p.n}
          </button>
        )
      )}
      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="inline-flex h-9 items-center gap-1 rounded-lg border border-white/10 bg-slate-900/60 px-3 text-sm text-slate-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
