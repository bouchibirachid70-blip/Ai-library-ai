import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminGuard } from "@/lib/api-guard";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  message: z.string().min(1).max(5000),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const d = parsed.data;
    const contact = await db.contact.create({
      data: { name: d.name, email: d.email.toLowerCase(), message: d.message },
    });
    return NextResponse.json({ ok: true, contact });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  const { error } = await adminGuard();
  if (error) return error;
  const items = await db.contact.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ items });
}
