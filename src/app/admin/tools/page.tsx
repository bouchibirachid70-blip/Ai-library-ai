import type { Metadata } from "next";
import { AdminToolsTable } from "@/app/admin/tools/tools-table";

export const metadata: Metadata = {
  title: "Tools",
};

export default function AdminToolsPage() {
  return <AdminToolsTable />;
}
