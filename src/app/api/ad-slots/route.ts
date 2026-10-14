import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminGuard } from "@/lib/api-guard";

export async function GET() {
  const { error } = await adminGuard();
  if (error) return error;
  const slots = await db.adSlot.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items: slots });
}

const schema = z.object({
  position: z.string().min(1).max(80).trim(),
  code: z.string().min(1).max(20000),
  isActive: z.boolean().default(true),
});

export async function POST(req: Request) {
  const { error } = await adminGuard();
  if (error) return error;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const slot = await db.adSlot.create({
    data: { position: d.position, code: d.code, isActive: d.isActive },
  });
  return NextResponse.json({ ok: true, slot });
}
