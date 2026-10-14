import { Suspense } from "react";
import { db } from "@/lib/db";
import { getCategoriesWithCounts } from "@/lib/constants";
import { AdSlot } from "@/components/ad-slot";
import { buildMetadata } from "@/components/seo";
import { ToolsListView, type CategoryOption, type ToolsListResult } from "@/components/tools-list-view";

export const metadata = buildMetadata({
  title: "Browse AI Tools",
  description:
    "Search and filter the full Aivora directory of AI tools. Find the right tool by category, pricing, and popularity.",
  path: "/tools",
});

export const revalidate = 60;
// External-DB (Supabase) renders are request-time only; never prerendered at build.
export const dynamic = "force-dynamic";

const LIMIT = 12;

type SearchParams = {
  q?: string;
  category?: string;
  pricing?: string;
  sort?: string;
  page?: string;
};

async function fetchInitialData(sp: SearchParams): Promise<ToolsListResult> {
  const q = (sp.q || "").trim();
  const category = sp.category || "";
  const pricing = sp.pricing || "";
  const sort = sp.sort || "popular";
  const page = Math.max(1, Number(sp.page || "1"));

  const where: Record<string, unknown> = { status: "approved" };
  if (q) {
    // Preserve SQLite's case-insensitive `contains` on PostgreSQL.
    const ins = { contains: q, mode: "insensitive" as const };
    where.OR = [
      { name: ins },
      { description: ins },
      { tags: ins },
    ];
  }
  if (category) where.category = { slug: category };
  if (pricing) where.pricing = pricing;

  const orderBy =
    sort === "newest"
      ? { createdAt: "desc" as const }
      : sort === "name"
        ? { name: "asc" as const }
        : { clicksCount: "desc" as const };

  const [total, tools] = await Promise.all([
    db.tool.count({ where }),
    db.tool.findMany({
      where,
      orderBy,
      skip: (page - 1) * LIMIT,
      take: LIMIT,
      include: { category: true },
    }),
  ]);

  return {
    items: tools,
    total,
    page,
    limit: LIMIT,
    pages: Math.ceil(total / LIMIT),
  };
}

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const sp: SearchParams = {
    q: typeof raw.q === "string" ? raw.q : undefined,
    category: typeof raw.category === "string" ? raw.category : undefined,
    pricing: typeof raw.pricing === "string" ? raw.pricing : undefined,
    sort: typeof raw.sort === "string" ? raw.sort : undefined,
    page: typeof raw.page === "string" ? raw.page : undefined,
  };

  const [categories, initialData] = await Promise.all([
    getCategoriesWithCounts().then((cs) =>
      cs.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
      })) as CategoryOption[],
    ),
    fetchInitialData(sp),
  ]);

  return (
    <div className="bg-grid pb-12">
      {/* Header */}
      <section className="border-b border-border/40">
        <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Browse AI Tools
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Search our curated directory of {initialData.total.toLocaleString()}+ AI tools.
            Filter by category, pricing, and popularity to find exactly what you need.
          </p>
        </div>
      </section>

      <Suspense fallback={null}>
        <ToolsListView
          categories={categories}
          initialData={initialData}
          topSlot={
            <div className="container mx-auto max-w-6xl px-4 pt-6">
              <AdSlot position="tools_list_top" />
            </div>
          }
          bottomSlot={
            <div className="container mx-auto max-w-6xl px-4">
              <AdSlot position="tools_list_bottom" />
            </div>
          }
        />
      </Suspense>
    </div>
  );
}
