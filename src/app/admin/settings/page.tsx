import type { Metadata } from "next";
import { AdminSettings } from "@/app/admin/settings/settings-client";

export const metadata: Metadata = {
  title: "Settings",
};

export default function AdminSettingsPage() {
  return <AdminSettings />;
}
