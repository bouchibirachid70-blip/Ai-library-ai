import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ArticleForm } from "@/app/admin/articles/article-form";

export const metadata: Metadata = {
  title: "Edit article",
};

type ArticleForForm = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string | null;
  published: boolean;
};

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await db.article.findUnique({ where: { id } });
  if (!article) notFound();
  return <ArticleForm mode="edit" article={article as ArticleForForm} />;
}
