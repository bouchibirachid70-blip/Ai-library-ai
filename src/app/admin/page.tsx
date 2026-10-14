import Link from "next/link";
import type { Metadata } from "next";
import {
  Wrench,
  CheckCircle2,
  Clock,
  XCircle,
  FolderTree,
  FileText,
  Eye,
  Inbox,
  Mail,
  MousePointerClick,
  TrendingUp,
  Trophy,
  ArrowUpRight,
} from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Dashboard",
};

type IconType = React.ComponentType<{ className?: string }>;

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: IconType;
  tone: "primary" | "emerald" | "amber" | "rose" | "muted";
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary/15 text-primary",
    emerald: "bg-emerald-500/15 text-emerald-400",
    amber: "bg-amber-500/15 text-amber-400",
    rose: "bg-rose-500/15 text-rose-400",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <span className="text-3xl font-semibold tabular-nums tracking-tight">
            {value.toLocaleString()}
          </span>
        </div>
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-full ${tones[tone]}`}
        >
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const session = await getSession();

  const [
    totalTools,
    approvedTools,
    pendingTools,
    rejectedTools,
    totalCategories,
    totalArticles,
    publishedArticles,
    totalSubmissions,
    pendingSubmissions,
    totalClicks,
    clicks30,
    topTools,
    recentContacts,
  ] = await Promise.all([
    db.tool.count(),
    db.tool.count({ where: { status: "approved" } }),
    db.tool.count({ where: { status: "pending" } }),
    db.tool.count({ where: { status: "rejected" } }),
    db.category.count(),
    db.article.count(),
    db.article.count({ where: { published: true } }),
    db.submission.count(),
    db.submission.count({ where: { status: "pending" } }),
    db.click.count(),
    db.click.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
    db.tool.findMany({
      orderBy: { clicksCount: "desc" },
      take: 5,
      select: { id: true, name: true, slug: true, clicksCount: true },
    }),
    db.contact.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, message: true, createdAt: true },
    }),
  ]);

  const stats: Array<{
    label: string;
    value: number;
    icon: IconType;
    tone: "primary" | "emerald" | "amber" | "rose" | "muted";
  }> = [
    { label: "Total tools", value: totalTools, icon: Wrench, tone: "primary" },
    { label: "Approved", value: approvedTools, icon: CheckCircle2, tone: "emerald" },
    { label: "Pending", value: pendingTools, icon: Clock, tone: "amber" },
    { label: "Rejected", value: rejectedTools, icon: XCircle, tone: "rose" },
    { label: "Categories", value: totalCategories, icon: FolderTree, tone: "muted" },
    { label: "Articles", value: totalArticles, icon: FileText, tone: "primary" },
    { label: "Published", value: publishedArticles, icon: Eye, tone: "emerald" },
    { label: "Submissions", value: totalSubmissions, icon: Inbox, tone: "primary" },
    { label: "Pending submissions", value: pendingSubmissions, icon: Clock, tone: "amber" },
    { label: "Total clicks", value: totalClicks, icon: MousePointerClick, tone: "muted" },
    { label: "Clicks (30d)", value: clicks30, icon: TrendingUp, tone: "emerald" },
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          {session?.name
            ? `Welcome back, ${session.name}. Here's what's happening.`
            : "Here's what's happening across the directory."}
        </p>
      </header>

      {/* Stat grid */}
      <section
        aria-label="Statistics"
        className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top tools leaderboard */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="size-4 text-primary" />
              Top tools by clicks
            </CardTitle>
            <Link
              href="/admin/tools"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              All tools
              <ArrowUpRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {topTools.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No tools yet. Add your first tool to see it here.
              </p>
            ) : (
              <ol className="space-y-2">
                {topTools.map((t, i) => {
                  const rank = i + 1;
                  const rankClass =
                    rank === 1
                      ? "bg-amber-500/20 text-amber-300"
                      : rank === 2
                        ? "bg-slate-400/20 text-slate-200"
                        : rank === 3
                          ? "bg-orange-700/30 text-orange-300"
                          : "bg-muted text-muted-foreground";
                  return (
                    <li key={t.id}>
                      <Link
                        href={`/admin/tools/${t.id}`}
                        className="group flex items-center gap-3 rounded-md border border-transparent p-2 transition-colors hover:border-border/60 hover:bg-muted/40"
                      >
                        <span
                          className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${rankClass}`}
                        >
                          {rank}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {t.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t.clicksCount.toLocaleString()} clicks
                        </span>
                        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Recent messages */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="size-4 text-primary" />
              Recent messages
            </CardTitle>
            <span className="text-xs text-muted-foreground">Last 5</span>
          </CardHeader>
          <CardContent>
            {recentContacts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No contact messages yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {recentContacts.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-md border border-border/60 bg-muted/30 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {c.name}
                      </span>
                      <time className="shrink-0 text-[11px] text-muted-foreground">
                        {c.createdAt.toLocaleDateString()}
                      </time>
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {c.email}
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-xs text-foreground/80">
                      {c.message}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
