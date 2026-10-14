import Link from "next/link";
import { ArrowRight, Search, Sparkles, TrendingUp } from "lucide-react";
import { db } from "@/lib/db";
import { AdSlot } from "@/components/ad-slot";
import { ToolCard } from "@/components/tool-card";
import { JsonLd } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCategoriesWithCounts } from "@/lib/constants";

export const metadata = {
  title: "Aivora — Discover the Best AI Tools",
  description:
    "A curated directory of the best AI tools, organized by category. Discover, compare, and build faster with AI.",
};

export const revalidate = 60;
// External-DB (Supabase) renders are request-time only; never prerendered at build.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featuredTools, categories, latestArticles, totalTools] = await Promise.all([
    db.tool.findMany({
      where: { status: "approved" },
      orderBy: { clicksCount: "desc" },
      take: 8,
      include: { category: true },
    }),
    getCategoriesWithCounts(),
    db.article.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    db.tool.count({ where: { status: "approved" } }),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Aivora",
    url: "https://aivora.dev",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://aivora.dev/tools?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="bg-grid">
      <JsonLd data={jsonLd} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {totalTools.toLocaleString()}+ curated AI tools, updated weekly
            </div>
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-6xl">
              Discover the{" "}
              <span className="bg-gradient-to-r from-primary to-emerald-300 bg-clip-text text-transparent">
                best AI tools
              </span>{" "}
              for your workflow
            </h1>
            <p className="mt-5 text-pretty text-lg text-muted-foreground">
              A curated directory of AI tools, organized by category. Search,
              compare, and find exactly what you need — no clutter.
            </p>
            <form
              action="/tools"
              className="mx-auto mt-8 flex max-w-xl flex-col gap-2 sm:flex-row sm:items-center"
            >
              <div className="relative w-full sm:flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="q"
                  placeholder="Search AI tools, e.g. 'video editor'..."
                  className="h-12 pl-10 text-base"
                  aria-label="Search AI tools"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 w-full sm:w-auto">
                Search
              </Button>
            </form>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>Popular:</span>
              {["writing", "image", "code", "video"].map((t) => (
                <Link
                  key={t}
                  href={`/tools?q=${t}`}
                  className="rounded-full border border-border/60 bg-card/50 px-3 py-1 text-xs hover:border-primary/40 hover:text-primary transition-colors"
                >
                  {t}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4">
        <AdSlot position="home_top" />
      </div>

      {/* Featured tools */}
      <section className="container mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <TrendingUp className="h-4 w-4" />
              <span>Featured</span>
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              Most popular AI tools
            </h2>
          </div>
          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link href="/top-tools">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        {featuredTools.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredTools.map((t) => (
              <ToolCard key={t.id} tool={t} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No tools yet.</p>
        )}
      </section>

      <div className="container mx-auto max-w-6xl px-4">
        <AdSlot position="home_middle" />
      </div>

      {/* Browse by category */}
      <section className="container mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Browse by category</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Find the right tool for the job.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="group flex flex-col rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-primary/40 hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-muted/60 text-xl">
                  {c.icon}
                </span>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{c.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {c.toolCount} {c.toolCount === 1 ? "tool" : "tools"}
                  </p>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
                {c.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest blog posts */}
      {latestArticles.length > 0 && (
        <section className="container mx-auto max-w-6xl px-4 py-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">From the blog</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Guides, comparisons, and AI tool reviews.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="shrink-0">
              <Link href="/blog">
                All posts <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {latestArticles.map((a) => (
              <Link
                key={a.id}
                href={`/blog/${a.slug}`}
                className="group flex flex-col rounded-xl border border-border/60 bg-card p-5 transition-all hover:border-primary/40 hover:-translate-y-0.5"
              >
                <time className="text-xs text-muted-foreground">
                  {new Date(a.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
                <h3 className="mt-2 font-semibold leading-snug group-hover:text-primary transition-colors">
                  {a.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                  {a.excerpt}
                </p>
                <span className="mt-3 inline-flex items-center text-sm text-primary">
                  Read more <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="container mx-auto max-w-6xl px-4 pb-4">
        <AdSlot position="home_bottom" />
      </div>

      {/* CTA */}
      <section className="container mx-auto max-w-6xl px-4 py-12">
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-8 md:p-12">
          <div className="relative max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Built an AI tool? Get it listed.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Submit your tool to Aivora and reach builders searching for the
              right AI solution. Free to submit — we review every submission.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/submit">
                  Submit a tool <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/tools">Browse tools</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
