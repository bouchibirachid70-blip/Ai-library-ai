import { db } from "@/lib/db";

/** Known ad positions wired into the public site (used for autocomplete). */
export const AD_POSITIONS = [
  "home_top",
  "home_middle",
  "home_bottom",
  "tools_list_top",
  "tools_list_bottom",
  "tool_detail_top",
  "tool_detail_middle",
  "tool_detail_bottom",
  "category_top",
  "blog_list_top",
  "blog_post_bottom",
] as const;

export const PRICING_OPTIONS = [
  "Free",
  "Freemium",
  "Paid",
  "Contact for pricing",
] as const;

export const TOOL_STATUSES = ["pending", "approved", "rejected"] as const;
export const SUBMISSION_STATUSES = ["pending", "approved", "rejected"] as const;

/** Get active ad slots for a given position, server-side. */
export async function getActiveAdSlots(position: string) {
  return db.adSlot.findMany({
    where: { position, isActive: true },
    orderBy: { createdAt: "asc" },
  });
}

/** Get categories with tool counts (for navigation/cards). */
export async function getCategoriesWithCounts() {
  const categories = await db.category.findMany({
    include: {
      _count: { select: { tools: { where: { status: "approved" } } } },
    },
    orderBy: { name: "asc" },
  });
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    description: c.description,
    toolCount: c._count.tools,
  }));
}
