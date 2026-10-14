import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminGuard } from "@/lib/api-guard";

const schema = z.object({
  position: z.string().min(1).max(80).trim(),
  code: z.string().min(1).max(20000),
  isActive: z.boolean().default(true),
});

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
  const slot = await db.adSlot.update({
    where: { id },
    data: { position: d.position, code: d.code, isActive: d.isActive },
  });
  return NextResponse.json({ ok: true, slot });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await adminGuard();
  if (error) return error;
  const { id } = await params;
  await db.adSlot.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
