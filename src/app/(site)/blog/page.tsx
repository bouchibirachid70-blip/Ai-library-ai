import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import { db } from "@/lib/db";
import { AdSlot } from "@/components/ad-slot";
import { RemoteImage } from "@/components/remote-image";
import { buildMetadata } from "@/components/seo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = buildMetadata({
  title: "Blog",
  description:
    "Guides, comparisons, and reviews of the best AI tools. Learn how to get the most out of AI.",
  path: "/blog",
});

export const revalidate = 60;
// External-DB (Supabase) renders are request-time only; never prerendered at build.
export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function BlogListPage() {
  const articles = await db.article.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="bg-grid pb-12">
      <section className="border-b border-border/40">
        <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Newspaper className="h-4 w-4" />
            <span>Blog</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Guides, comparisons &amp; AI tool reviews
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Practical write-ups on the AI tools we list — how to pick them, how
            to use them, and how they stack up.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 pt-8">
        <AdSlot position="blog_list_top" />
      </div>

      <section className="container mx-auto max-w-6xl px-4 py-8">
        {articles.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 p-10 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-muted/60 text-muted-foreground">
              <Newspaper className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No posts yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Check back soon — new articles are on the way.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/tools">Browse tools instead</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <Link
                key={a.id}
                href={`/blog/${a.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:border-primary/40 hover:-translate-y-0.5"
              >
                {a.coverImage && (
                  <div className="aspect-[16/9] w-full overflow-hidden bg-muted/40">
                    <RemoteImage
                      src={a.coverImage}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <time className="text-xs text-muted-foreground" dateTime={new Date(a.createdAt).toISOString()}>
                    {formatDate(a.createdAt)}
                  </time>
                  <h2 className="mt-2 text-lg font-semibold leading-snug group-hover:text-primary transition-colors">
                    {a.title}
                  </h2>
                  {a.excerpt && (
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
                      {a.excerpt}
                    </p>
                  )}
                  <span className="mt-4 inline-flex items-center text-sm text-primary">
                    Read more <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
