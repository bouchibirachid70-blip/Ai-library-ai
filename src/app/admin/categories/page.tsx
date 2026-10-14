import type { Metadata } from "next";
import { AdminCategories } from "@/app/admin/categories/categories-client";

export const metadata: Metadata = {
  title: "Categories",
};

export default function AdminCategoriesPage() {
  return <AdminCategories />;
}
