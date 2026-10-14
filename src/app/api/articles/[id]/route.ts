import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminGuard } from "@/lib/api-guard";
import { ensureUniqueSlug } from "@/lib/slug";

const schema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().optional(),
  excerpt: z.string().max(400).optional().default(""),
  content: z.string().optional().default(""),
  coverImage: z.string().nullable().optional(),
  published: z.boolean().default(false),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await adminGuard();
  if (error) return error;
  const { id } = await params;
  const article = await db.article.findUnique({ where: { id } });
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ article });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await adminGuard();
  if (error) return error;
  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const slug = await ensureUniqueSlug(d.slug || d.title, id, "article");
  const article = await db.article.update({
    where: { id },
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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await adminGuard();
  if (error) return error;
  const { id } = await params;
  await db.article.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
