import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminGuard } from "@/lib/api-guard";
import { ensureUniqueSlug } from "@/lib/slug";

/** Approve a submission: creates an approved live tool and marks submission approved. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await adminGuard();
  if (error) return error;
  const { id } = await params;
  const submission = await db.submission.findUnique({ where: { id } });
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (submission.status === "approved") {
    return NextResponse.json({ ok: true, already: true });
  }
  const slug = await ensureUniqueSlug(submission.toolName, undefined, "tool");
  const tool = await db.tool.create({
    data: {
      name: submission.toolName,
      slug,
      description: submission.description,
      websiteUrl: submission.websiteUrl,
      categoryId: submission.categoryId || null,
      pricing: "Free",
      tags: "",
      logo: submission.toolName.charAt(0).toUpperCase(),
      status: "approved",
    },
  });
  await db.submission.update({ where: { id }, data: { status: "approved" } });
  return NextResponse.json({ ok: true, tool });
}
