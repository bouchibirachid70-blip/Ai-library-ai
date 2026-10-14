import Link from "next/link";
import { Trophy, MousePointerClick } from "lucide-react";
import { db } from "@/lib/db";
import { buildMetadata } from "@/components/seo";
import { ToolLogo } from "@/components/tool-logo";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Top AI Tools",
  description:
    "The 50 most popular AI tools on Aivora, ranked by visits. See what other builders are using right now.",
  path: "/top-tools",
});

export const revalidate = 60;
// External-DB (Supabase) renders are request-time only; never prerendered at build.
export const dynamic = "force-dynamic";

const PRICING_STYLES: Record<string, string> = {
  Free: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Freemium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Paid: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  "Contact for pricing": "bg-violet-500/15 text-violet-400 border-violet-500/30",
};

// Medal styles for the top 3 ranks.
const RANK_STYLES: Record<number, string> = {
  1: "bg-gradient-to-br from-amber-400 to-amber-600 text-amber-950 shadow-lg shadow-amber-500/20",
  2: "bg-gradient-to-br from-zinc-200 to-zinc-400 text-zinc-900 shadow-lg shadow-zinc-500/20",
  3: "bg-gradient-to-br from-orange-500 to-orange-700 text-orange-50 shadow-lg shadow-orange-500/20",
};

export default async function TopToolsPage() {
  const tools = await db.tool.findMany({
    where: { status: "approved" },
    orderBy: { clicksCount: "desc" },
    take: 50,
    include: { category: true },
  });

  return (
    <div className="bg-grid pb-12">
      <section className="border-b border-border/40">
        <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Trophy className="h-4 w-4" />
            <span>Top 50</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Top AI Tools
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Ranked by popularity (clicks). The most-visited AI tools on Aivora
            this month.
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-10">
        {tools.length === 0 ? (
          <p className="text-muted-foreground">No tools yet.</p>
        ) : (
          <ol className="space-y-3">
            {tools.map((t, i) => {
              const rank = i + 1;
              const medal = rank <= 3;
              return (
                <li key={t.id}>
                  <Link
                    href={`/tools/${t.slug}`}
                    className="group flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-primary/40 hover:-translate-y-0.5"
                  >
                    {/* Rank */}
                    <div
                      className={cn(
                        "grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold",
                        medal
                          ? RANK_STYLES[rank]
                          : "bg-muted/60 text-muted-foreground",
                      )}
                      aria-label={`Rank ${rank}`}
                    >
                      {medal ? `#${rank}` : rank}
                    </div>

                    {/* Identity */}
                    <ToolLogo
                      logo={t.logo}
                      name={t.name}
                      className="grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br from-primary/20 to-accent"
                      textClassName="text-lg font-semibold text-primary"
                    />

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-semibold leading-tight group-hover:text-primary transition-colors">
                        {t.name}
                      </h2>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {t.category && (
                          <span>
                            <span aria-hidden className="mr-0.5">{t.category.icon}</span>
                            {t.category.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <MousePointerClick className="h-3 w-3" />
                          {t.clicksCount.toLocaleString()} visits
                        </span>
                      </div>
                    </div>

                    {/* Pricing */}
                    <Badge
                      variant="outline"
                      className={cn("hidden shrink-0 font-medium sm:inline-flex", PRICING_STYLES[t.pricing] || "")}
                    >
                      {t.pricing}
                    </Badge>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* Hint card */}
      <section className="container mx-auto max-w-6xl px-4">
        <Card className="flex flex-col items-start gap-3 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Want to see your tool here?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Submit your AI tool to Aivora — free to submit, every submission is
              reviewed by our team.
            </p>
          </div>
          <Link
            href="/submit"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Submit a tool
          </Link>
        </Card>
      </section>
    </div>
  );
}
