import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminGuard } from "@/lib/api-guard";
import { ensureUniqueSlug } from "@/lib/slug";

export async function GET() {
  const categories = await db.category.findMany({
    include: {
      _count: { select: { tools: { where: { status: "approved" } } } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({
    items: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      description: c.description,
      toolCount: c._count.tools,
    })),
  });
}

const schema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().optional(),
  icon: z.string().optional().default("🏷️"),
  description: z.string().max(500).optional().default(""),
});

export async function POST(req: Request) {
  const { error } = await adminGuard();
  if (error) return error;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const slug = await ensureUniqueSlug(d.slug || d.name, undefined, "category");
  const category = await db.category.create({
    data: { name: d.name, slug, icon: d.icon, description: d.description },
  });
  return NextResponse.json({ ok: true, category });
}
