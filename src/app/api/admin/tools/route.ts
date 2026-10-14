import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminGuard } from "@/lib/api-guard";
import { isHttpUrl, parsePositiveInt } from "@/lib/validation";

export async function GET(req: Request) {
  const { error } = await adminGuard();
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const status = searchParams.get("status") || ""; // all | pending | approved | rejected
  const category = searchParams.get("category") || "";
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const limit = parsePositiveInt(searchParams.get("limit"), 20, 100);

  const where: Record<string, unknown> = {};
  if (q) {
    // Preserve SQLite's case-insensitive `contains` on PostgreSQL.
    const ins = { contains: q, mode: "insensitive" as const };
    where.OR = [{ name: ins }, { description: ins }];
  }
  if (status && status !== "all") where.status = status;
  if (category) where.categoryId = category;

  const [total, tools] = await Promise.all([
    db.tool.count({ where }),
    db.tool.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { category: true },
    }),
  ]);
  return NextResponse.json({ items: tools, total, page, limit, pages: Math.ceil(total / limit) });
}
