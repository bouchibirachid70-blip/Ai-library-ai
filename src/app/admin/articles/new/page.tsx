import type { Metadata } from "next";
import { ArticleForm } from "@/app/admin/articles/article-form";

export const metadata: Metadata = {
  title: "New article",
};

export default function NewArticlePage() {
  return <ArticleForm mode="create" />;
}
