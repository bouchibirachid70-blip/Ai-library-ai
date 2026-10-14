import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminGuard } from "@/lib/api-guard";
import { isHttpUrl, parsePositiveInt } from "@/lib/validation";
import { ensureUniqueSlug } from "@/lib/slug";

const schema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().optional(),
  description: z.string().min(1).max(2000),
  websiteUrl: z.string().url().refine(isHttpUrl, "URL must start with http:// or https://"),
  categoryId: z.string().nullable().optional(),
  pricing: z.string().min(1),
  tags: z.string().optional().default(""),
  logo: z.string().optional().nullable(),
  status: z.enum(["pending", "approved", "rejected"]),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await adminGuard();
  if (error) return error;
  const { id } = await params;
  const tool = await db.tool.findUnique({ where: { id }, include: { category: true } });
  if (!tool) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ tool });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await adminGuard();
  if (error) return error;
  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;
    const slug = await ensureUniqueSlug(d.slug || d.name, id, "tool");
    const tool = await db.tool.update({
      where: { id },
      data: {
        name: d.name,
        slug,
        description: d.description,
        websiteUrl: d.websiteUrl,
        categoryId: d.categoryId || null,
        pricing: d.pricing,
        tags: d.tags,
        logo: d.logo || null,
        status: d.status,
      },
    });
    return NextResponse.json({ ok: true, tool });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await adminGuard();
  if (error) return error;
  const { id } = await params;
  await db.tool.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
