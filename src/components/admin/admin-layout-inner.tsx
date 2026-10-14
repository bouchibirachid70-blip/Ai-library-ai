"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import type { SessionUser } from "@/lib/auth";

/**
 * Decides whether to render the admin chrome (sidebar + topbar) or just the
 * bare children (for the login page). Also handles the redirect to /admin/login
 * when there is no session. We do this client-side because the server layout
 * cannot read the pathname without middleware.
 */
export function AdminLayoutInner({
  session,
  children,
}: {
  session: SessionUser | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (!session && !isLogin) {
      router.replace("/admin/login");
    }
  }, [session, isLogin, router]);

  if (isLogin) {
    return <>{children}</>;
  }

  if (!session) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-2 animate-pulse rounded-full bg-primary" />
          Redirecting to login…
        </div>
      </div>
    );
  }

  return <AdminShell user={session}>{children}</AdminShell>;
}
