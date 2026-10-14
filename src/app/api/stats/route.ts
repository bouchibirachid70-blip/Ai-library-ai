import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminGuard } from "@/lib/api-guard";

export async function GET() {
  const { error } = await adminGuard();
  if (error) return error;

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
    topToolsRaw,
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
    db.click.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
    db.tool.findMany({
      orderBy: { clicksCount: "desc" },
      take: 5,
      select: { id: true, name: true, slug: true, clicksCount: true },
    }),
  ]);

  return NextResponse.json({
    counts: {
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
    },
    topTools: topToolsRaw,
  });
}
