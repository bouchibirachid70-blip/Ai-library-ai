import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminGuard } from "@/lib/api-guard";
import { ensureUniqueSlug } from "@/lib/slug";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await adminGuard();
  if (error) return error;
  const { id } = await params;
  await db.submission.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
