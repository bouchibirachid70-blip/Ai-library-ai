import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminGuard } from "@/lib/api-guard";
import { isHttpUrl, parsePositiveInt } from "@/lib/validation";

const schema = z.object({
  toolName: z.string().min(1).max(120),
  websiteUrl: z.string().url().refine(isHttpUrl, "URL must start with http:// or https://"),
  description: z.string().min(1).max(2000),
  submitterEmail: z.string().email(),
  categoryId: z.string().nullable().optional(),
});

/** Public: any visitor can submit a tool (status = pending). */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;
    const submission = await db.submission.create({
      data: {
        toolName: d.toolName,
        websiteUrl: d.websiteUrl,
        description: d.description,
        submitterEmail: d.submitterEmail.toLowerCase(),
        categoryId: d.categoryId || null,
        status: "pending",
      },
    });
    return NextResponse.json({ ok: true, submission });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** Admin: list all submissions with filters. */
export async function GET(req: Request) {
  const { error } = await adminGuard();
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "all";
  const q = searchParams.get("q")?.trim() || "";
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const limit = parsePositiveInt(searchParams.get("limit"), 20, 100);

  const where: Record<string, unknown> = {};
  if (status !== "all") where.status = status;
  if (q) {
    // Preserve SQLite's case-insensitive `contains` on PostgreSQL.
    const ins = { contains: q, mode: "insensitive" as const };
    where.OR = [{ toolName: ins }, { submitterEmail: ins }];
  }

  const [total, items] = await Promise.all([
    db.submission.count({ where }),
    db.submission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { category: true },
    }),
  ]);
  return NextResponse.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
}
