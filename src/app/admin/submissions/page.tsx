import type { Metadata } from "next";
import { AdminSubmissions } from "@/app/admin/submissions/submissions-client";

export const metadata: Metadata = {
  title: "Submissions",
};

export default function AdminSubmissionsPage() {
  return <AdminSubmissions />;
}
