import type { Metadata } from "next";
import { AdminLoginForm } from "@/app/admin/login/login-form";

export const metadata: Metadata = {
  title: "Admin Login",
};

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}
