import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminGuard } from "@/lib/api-guard";
import { ensureUniqueSlug } from "@/lib/slug";
import { isHttpUrl, parsePositiveInt } from "@/lib/validation";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const admin = searchParams.get("admin") === "1";
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const limit = parsePositiveInt(searchParams.get("limit"), 12, 48);

  // The admin branch (which returns ALL articles including unpublished
  // drafts) MUST be guarded server-side. Unauthenticated requests receive 401.
  if (admin) {
    const { error } = await adminGuard();
    if (error) return error;
  }

  const where = admin ? {} : { published: true };
  const [total, items] = await Promise.all([
    db.article.count({ where }),
    db.article.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  return NextResponse.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
}

const schema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().optional(),
  excerpt: z.string().max(400).optional().default(""),
  content: z.string().optional().default(""),
  coverImage: z.string().nullable().optional(),
  published: z.boolean().default(false),
});

export async function POST(req: Request) {
  const { error } = await adminGuard();
  if (error) return error;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const slug = await ensureUniqueSlug(d.slug || d.title, undefined, "article");
  const article = await db.article.create({
    data: {
      title: d.title,
      slug,
      excerpt: d.excerpt,
      content: d.content,
      coverImage: d.coverImage || null,
      published: d.published,
    },
  });
  return NextResponse.json({ ok: true, article });
}
