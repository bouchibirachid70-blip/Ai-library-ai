import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ToolForm } from "@/app/admin/tools/tool-form";

export const metadata: Metadata = {
  title: "Edit tool",
};

type ToolForForm = {
  id: string;
  name: string;
  slug: string;
  description: string;
  websiteUrl: string;
  categoryId: string | null;
  status: string;
  pricing: string;
  tags: string;
  logo: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    description: string;
  } | null;
};

export default async function EditToolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tool = await db.tool.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!tool) notFound();
  return <ToolForm mode="edit" tool={tool as unknown as ToolForForm} />;
}
