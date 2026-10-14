import type { Metadata } from "next";
import { AdminArticles } from "@/app/admin/articles/articles-client";

export const metadata: Metadata = {
  title: "Articles",
};

export default function AdminArticlesPage() {
  return <AdminArticles />;
}
