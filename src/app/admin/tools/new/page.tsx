import type { Metadata } from "next";
import { ToolForm } from "@/app/admin/tools/tool-form";

export const metadata: Metadata = {
  title: "New tool",
};

export default function NewToolPage() {
  return <ToolForm mode="create" />;
}
