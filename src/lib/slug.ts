export function slugify(input: string): string {
  return input
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // remove non-word chars
    .replace(/[\s_-]+/g, "-") // collapse whitespace/underscores
    .replace(/^-+|-+$/g, ""); // trim dashes
}

export async function ensureUniqueSlug(
  base: string,
  existingId?: string,
  model: "tool" | "category" | "article" = "tool",
): Promise<string> {
  const { db } = await import("@/lib/db");
  let slug = slugify(base) || "untitled";
  let suffix = 1;
  while (true) {
    let existing: { id: string } | null = null;
    if (model === "tool") {
      existing = await db.tool.findUnique({ where: { slug }, select: { id: true } });
    } else if (model === "category") {
      existing = await db.category.findUnique({ where: { slug }, select: { id: true } });
    } else {
      existing = await db.article.findUnique({ where: { slug }, select: { id: true } });
    }
    if (!existing || existing.id === existingId) return slug;
    suffix += 1;
    slug = `${slugify(base)}-${suffix}`;
  }
}
