import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminGuard } from "@/lib/api-guard";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await adminGuard();
  if (error) return error;
  const { id } = await params;
  const submission = await db.submission.findUnique({ where: { id } });
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.submission.update({ where: { id }, data: { status: "rejected" } });
  return NextResponse.json({ ok: true });
}
