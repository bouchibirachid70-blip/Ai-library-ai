import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminGuard } from "@/lib/api-guard";
import { ensureUniqueSlug } from "@/lib/slug";

const schema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().optional(),
  icon: z.string().optional().default("🏷️"),
  description: z.string().max(500).optional().default(""),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await adminGuard();
  if (error) return error;
  const { id } = await params;
  const category = await db.category.findUnique({ where: { id } });
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ category });
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
  const slug = await ensureUniqueSlug(d.slug || d.name, id, "category");
  const category = await db.category.update({
    where: { id },
    data: { name: d.name, slug, icon: d.icon, description: d.description },
  });
  return NextResponse.json({ ok: true, category });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await adminGuard();
  if (error) return error;
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const force = searchParams.get("force") === "1";
  const count = await db.tool.count({ where: { categoryId: id } });
  if (count > 0 && !force) {
    return NextResponse.json(
      { error: "Category has tools assigned", count, code: "HAS_TOOLS" },
      { status: 409 },
    );
  }
  await db.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
