import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isHttpUrl, parsePositiveInt } from "@/lib/validation";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const category = searchParams.get("category") || "";
  const pricing = searchParams.get("pricing") || "";
  const sort = searchParams.get("sort") || "popular"; // popular | newest | clicks
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const limit = parsePositiveInt(searchParams.get("limit"), 12, 48);

  const where: Record<string, unknown> = { status: "approved" };
  if (q) {
    // PostgreSQL `contains` is case-sensitive by default; SQLite was
    // case-insensitive. Preserve the existing public search behavior with
    // `mode: "insensitive"` (PostgreSQL-only, ignored by SQLite but we are now
    // on PostgreSQL). This keeps "chat" matching "Chat" etc.
    const ins = { contains: q, mode: "insensitive" as const };
    where.OR = [
      { name: ins },
      { description: ins },
      { tags: ins },
    ];
  }
  if (category) {
    where.category = { slug: category };
  }
  if (pricing) {
    where.pricing = pricing;
  }

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
      skip: (page - 1) * limit,
      take: limit,
      include: { category: true },
    }),
  ]);

  return NextResponse.json({
    items: tools,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
}
