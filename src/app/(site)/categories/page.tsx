import Link from "next/link";
import { getCategoriesWithCounts } from "@/lib/constants";
import { buildMetadata } from "@/components/seo";

export const metadata = buildMetadata({
  title: "Browse Categories",
  description:
    "Browse AI tools by category. Find the right tool for writing, coding, image generation, video editing, and more.",
  path: "/categories",
});

export const revalidate = 60;
// External-DB (Supabase) renders are request-time only; never prerendered at build.
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await getCategoriesWithCounts();
  const total = categories.reduce((s, c) => s + c.toolCount, 0);

  return (
    <div className="bg-grid pb-12">
      <section className="border-b border-border/40">
        <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Browse Categories
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Explore {total.toLocaleString()}+ AI tools across{" "}
            {categories.length.toLocaleString()} categories. Find the right tool for
            your workflow, fast.
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-10">
        {categories.length === 0 ? (
          <p className="text-muted-foreground">No categories yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="group flex flex-col rounded-xl border border-border/60 bg-card p-5 transition-all hover:border-primary/40 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-muted/60 text-2xl">
                    {c.icon}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold group-hover:text-primary transition-colors">
                      {c.name}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {c.toolCount.toLocaleString()}{" "}
                      {c.toolCount === 1 ? "tool" : "tools"}
                    </p>
                  </div>
                </div>
                {c.description && (
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                    {c.description}
                  </p>
                )}
                <span className="mt-4 inline-flex items-center text-sm text-primary">
                  Browse tools
                  <span className="ml-1 transition-transform group-hover:translate-x-0.5">→</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
