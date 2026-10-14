import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Public click tracking. The [id] param actually holds the tool's slug. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: slug } = await params;
  const tool = await db.tool.findUnique({ where: { slug } });
  if (!tool || tool.status !== "approved") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await db.$transaction([
    db.click.create({ data: { toolId: tool.id } }),
    db.tool.update({ where: { id: tool.id }, data: { clicksCount: { increment: 1 } } }),
  ]);
  return NextResponse.json({ ok: true, websiteUrl: tool.websiteUrl });
}
