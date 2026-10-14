import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { AdminLayoutInner } from "@/components/admin/admin-layout-inner";

export const metadata: Metadata = {
  title: { default: "Admin · Aivora", template: "%s · Aivora Admin" },
  description: "Aivora admin panel",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  return (
    <AdminLayoutInner session={session}>{children}</AdminLayoutInner>
  );
}
