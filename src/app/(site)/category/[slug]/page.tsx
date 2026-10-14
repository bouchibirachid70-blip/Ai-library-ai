import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getCategoriesWithCounts } from "@/lib/constants";
import { AdSlot } from "@/components/ad-slot";
import { buildMetadata } from "@/components/seo";
import { ToolsListView, type CategoryOption, type ToolsListResult } from "@/components/tools-list-view";

export const revalidate = 60;
// External-DB (Supabase) renders are request-time only; never prerendered at build.
export const dynamic = "force-dynamic";

const LIMIT = 12;

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function getCategory(slug: string) {
  return db.category.findUnique({ where: { slug } });
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) {
    return buildMetadata({
      title: "Category not found",
      description: "This category could not be found.",
      path: `/category/${slug}`,
    });
  }
  return buildMetadata({
    title: `${category.name} AI Tools`,
    description:
      category.description ||
      `Browse the best ${category.name} AI tools on Aivora.`,
    path: `/category/${category.slug}`,
  });
}

async function fetchInitialData(categoryId: string, sp: {
  q?: string;
  pricing?: string;
  sort?: string;
  page?: string;
}): Promise<ToolsListResult> {
  const q = (sp.q || "").trim();
  const pricing = sp.pricing || "";
  const sort = sp.sort || "popular";
  const page = Math.max(1, Number(sp.page || "1"));

  const where: Record<string, unknown> = {
    status: "approved",
    categoryId,
  };
  if (q) {
    // Preserve SQLite's case-insensitive `contains` on PostgreSQL.
    const ins = { contains: q, mode: "insensitive" as const };
    where.OR = [
      { name: ins },
      { description: ins },
      { tags: ins },
    ];
  }
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

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  const raw = await searchParams;
  const sp = {
    q: typeof raw.q === "string" ? raw.q : undefined,
    pricing: typeof raw.pricing === "string" ? raw.pricing : undefined,
    sort: typeof raw.sort === "string" ? raw.sort : undefined,
    page: typeof raw.page === "string" ? raw.page : undefined,
  };

  const [allCategories, initialData] = await Promise.all([
    getCategoriesWithCounts().then((cs) =>
      cs.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
      })) as CategoryOption[],
    ),
    fetchInitialData(category.id, sp),
  ]);

  return (
    <div className="bg-grid pb-12">
      {/* Category header */}
      <section className="border-b border-border/40">
        <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div className="flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-muted/60 text-3xl">
              {category.icon}
            </span>
            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {category.name}
              </h1>
              {category.description && (
                <p className="mt-2 max-w-2xl text-muted-foreground">
                  {category.description}
                </p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                {initialData.total.toLocaleString()}{" "}
                {initialData.total === 1 ? "tool" : "tools"} in this category
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 pt-6">
        <AdSlot position="category_top" />
      </div>

      <ToolsListView
        fixedCategorySlug={category.slug}
        categories={allCategories}
        initialData={initialData}
      />
    </div>
  );
}
