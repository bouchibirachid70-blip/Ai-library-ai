"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, SearchX, SlidersHorizontal, X } from "lucide-react";
import { ToolCard, type ToolCardData } from "@/components/tool-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";

export type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
};

export type ToolsListResult = {
  items: ToolCardData[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

type Props = {
  /** When set (e.g. on /category/[slug]), filters are scoped to this category
   * and the category Select is hidden. */
  fixedCategorySlug?: string;
  categories: CategoryOption[];
  /** SSR-rendered initial page so search engines see content immediately. */
  initialData: ToolsListResult;
  /** Slot for ads between header and grid (rendered by parent as needed). */
  topSlot?: React.ReactNode;
  bottomSlot?: React.ReactNode;
  /** Limits the pricing options shown in the filter. */
  showSort?: boolean;
};

const PRICING_OPTIONS = [
  { value: "", label: "All pricing" },
  { value: "Free", label: "Free" },
  { value: "Freemium", label: "Freemium" },
  { value: "Paid", label: "Paid" },
  { value: "Contact for pricing", label: "Contact for pricing" },
];

const SORT_OPTIONS = [
  { value: "popular", label: "Popular" },
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name (A–Z)" },
];

const LIMIT = 12;

type ListParams = Record<string, string | number | undefined>;

function buildUrl(params: ListParams, fixedCategory?: string) {
  const sp = new URLSearchParams();
  const q = String(params.q || "").trim();
  if (q) sp.set("q", q);
  if (fixedCategory) {
    sp.set("category", fixedCategory);
  } else if (params.category) {
    sp.set("category", String(params.category));
  }
  if (params.pricing) sp.set("pricing", String(params.pricing));
  if (params.sort) sp.set("sort", String(params.sort));
  const page = Number(params.page || 1);
  if (page > 1) sp.set("page", String(page));
  sp.set("limit", String(LIMIT));
  const qs = sp.toString();
  return qs ? `/tools?${qs}` : "/tools";
}

function buildApiUrl(params: ListParams, fixedCategory?: string) {
  const sp = new URLSearchParams();
  const q = String(params.q || "").trim();
  if (q) sp.set("q", q);
  if (fixedCategory) sp.set("category", fixedCategory);
  else if (params.category) sp.set("category", String(params.category));
  if (params.pricing) sp.set("pricing", String(params.pricing));
  if (params.sort) sp.set("sort", String(params.sort));
  const page = Number(params.page || 1);
  sp.set("page", String(page));
  sp.set("limit", String(LIMIT));
  return `/api/tools?${sp.toString()}`;
}

/** Builds a compact list of page numbers with ellipses for pagination. */
function getPageRange(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "ellipsis")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push("ellipsis");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push("ellipsis");
  out.push(total);
  return out;
}

export function ToolsListView({
  fixedCategorySlug,
  categories,
  initialData,
  topSlot,
  bottomSlot,
  showSort = true,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read current filter state from URL.
  const q = searchParams.get("q") || "";
  const categoryParam = fixedCategorySlug || searchParams.get("category") || "";
  const pricing = searchParams.get("pricing") || "";
  const sort = searchParams.get("sort") || "popular";
  const page = Number(searchParams.get("page") || "1");

  // Local state for the search input (so typing doesn't push URL on every key).
  const [qInput, setQInput] = useState(q);

  useEffect(() => {
    setQInput(q);
  }, [q]);

  // Data state.
  const [data, setData] = useState<ToolsListResult>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track which page was first loaded so we don't refetch the initial page.
  const initialKey = useMemo(() => {
    return JSON.stringify({ q, category: categoryParam, pricing, sort, page });
  }, [q, categoryParam, pricing, sort, page]);

  const [initialKeyStored] = useState(initialKey);

  useEffect(() => {
    // If filter state matches SSR, use initial data without a fetch.
    if (initialKey === initialKeyStored) {
      setData(initialData);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(buildApiUrl({ q, category: categoryParam, pricing, sort, page }, fixedCategorySlug))
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load tools");
        return (await r.json()) as ToolsListResult;
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || "Failed to load tools");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initialKey]);

  // Update URL via router.push.
  const updateParams = useCallback(
    (next: Partial<{ q: string; category: string; pricing: string; sort: string; page: number }>) => {
      const merged = {
        q: next.q ?? q,
        category: next.category ?? categoryParam,
        pricing: next.pricing ?? pricing,
        sort: next.sort ?? sort,
        page: next.page ?? page,
      };
      // Reset to page 1 when any filter changes.
      const pageReset =
        next.q !== undefined || next.category !== undefined || next.pricing !== undefined || next.sort !== undefined
          ? 1
          : merged.page;
      const url = buildUrl(
        { q: merged.q, category: merged.category, pricing: merged.pricing, sort: merged.sort, page: pageReset },
        fixedCategorySlug,
      );
      router.push(url, { scroll: true });
    },
    [q, categoryParam, pricing, sort, page, router, fixedCategorySlug],
  );

  const onSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ q: qInput });
  };

  const hasActiveFilters = Boolean(q || categoryParam || pricing);
  const showingFrom = data.total === 0 ? 0 : (data.page - 1) * data.limit + 1;
  const showingTo = Math.min(data.page * data.limit, data.total);
  const pageRange = getPageRange(data.page, Math.max(1, data.pages));

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="sticky top-16 z-30 border-b border-border/60 bg-background/85 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="container mx-auto max-w-6xl px-4">
          <form onSubmit={onSubmitSearch} className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder="Search tools, tags, descriptions…"
                className="h-10 pl-10"
                aria-label="Search tools"
              />
              {qInput && (
                <button
                  type="button"
                  onClick={() => {
                    setQInput("");
                    if (q) updateParams({ q: "" });
                  }}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!fixedCategorySlug && (
                <Select
                  value={categoryParam || "all"}
                  onValueChange={(v) => updateParams({ category: v === "all" ? "" : v })}
                >
                  <SelectTrigger className="h-10 w-[160px]" aria-label="Filter by category">
                    <SlidersHorizontal className="mr-1 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.slug}>
                        <span className="mr-1">{c.icon}</span>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select
                value={pricing || "all"}
                onValueChange={(v) => updateParams({ pricing: v === "all" ? "" : v })}
              >
                <SelectTrigger className="h-10 w-[150px]" aria-label="Filter by pricing">
                  <SelectValue placeholder="All pricing" />
                </SelectTrigger>
                <SelectContent>
                  {PRICING_OPTIONS.map((p) => (
                    <SelectItem key={p.value || "all"} value={p.value || "all"}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {showSort && (
                <Select value={sort} onValueChange={(v) => updateParams({ sort: v })}>
                  <SelectTrigger className="h-10 w-[140px]" aria-label="Sort tools">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-10"
                  onClick={() => {
                    setQInput("");
                    router.push(fixedCategorySlug ? `/category/${fixedCategorySlug}` : "/tools", {
                      scroll: false,
                    });
                  }}
                >
                  Clear
                  <X className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Ads above grid */}
      {topSlot}

      {/* Result summary */}
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {loading ? "Loading…" : `Showing ${showingFrom.toLocaleString()}–${showingTo.toLocaleString()} of ${data.total.toLocaleString()} tools`}
          </p>
        </div>
      </div>

      {/* Grid + states */}
      <div className="container mx-auto max-w-6xl px-4">
        {error ? (
          <Card className="flex flex-col items-center gap-3 p-10 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={() => router.refresh()}>
              Try again
            </Button>
          </Card>
        ) : loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full rounded-xl" />
            ))}
          </div>
        ) : data.items.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 p-10 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-muted/60 text-muted-foreground">
              <SearchX className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No tools found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search or filters.
              </p>
            </div>
            {hasActiveFilters && (
              <Button asChild variant="outline">
                <Link href={fixedCategorySlug ? `/category/${fixedCategorySlug}` : "/tools"}>
                  Clear filters
                </Link>
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.items.map((t) => (
              <ToolCard key={t.id} tool={t} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && data.pages > 1 && (
          <div className="mt-8 flex flex-col items-center gap-3">
            <Pagination>
              <PaginationContent>
                {data.page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious
                      href={buildUrl(
                        { q, category: categoryParam, pricing, sort, page: data.page - 1 },
                        fixedCategorySlug,
                      )}
                    />
                  </PaginationItem>
                )}
                {pageRange.map((p, idx) =>
                  p === "ellipsis" ? (
                    <PaginationItem key={`e-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href={buildUrl(
                          { q, category: categoryParam, pricing, sort, page: p },
                          fixedCategorySlug,
                        )}
                        isActive={p === data.page}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                {data.page < data.pages && (
                  <PaginationItem>
                    <PaginationNext
                      href={buildUrl(
                        { q, category: categoryParam, pricing, sort, page: data.page + 1 },
                        fixedCategorySlug,
                      )}
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {bottomSlot}
    </div>
  );
}
