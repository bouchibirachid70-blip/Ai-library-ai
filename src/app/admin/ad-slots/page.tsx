import type { Metadata } from "next";
import { AdminAdSlots } from "@/app/admin/ad-slots/ad-slots-client";

export const metadata: Metadata = {
  title: "Ad slots",
};

export default function AdminAdSlotsPage() {
  return <AdminAdSlots />;
}
