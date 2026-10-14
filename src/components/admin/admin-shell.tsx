"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Wrench,
  FolderTree,
  Inbox,
  FileText,
  Megaphone,
  Settings,
  Sparkles,
  Menu,
  LogOut,
  ChevronDown,
  User as UserIcon,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/tools", label: "Tools", icon: Wrench },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/submissions", label: "Submissions", icon: Inbox },
  { href: "/admin/articles", label: "Articles", icon: FileText },
  { href: "/admin/ad-slots", label: "Ad Slots", icon: Megaphone },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string | null, href: string, exact?: boolean) {
  if (!pathname) return false;
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function deriveTitle(pathname: string | null): string {
  if (!pathname) return "Admin";
  if (pathname === "/admin") return "Dashboard";
  if (pathname.startsWith("/admin/tools/new")) return "New tool";
  if (pathname.startsWith("/admin/tools/")) return "Edit tool";
  if (pathname.startsWith("/admin/tools")) return "Tools";
  if (pathname.startsWith("/admin/categories")) return "Categories";
  if (pathname.startsWith("/admin/submissions")) return "Submissions";
  if (pathname.startsWith("/admin/articles/new")) return "New article";
  if (pathname.startsWith("/admin/articles/")) return "Edit article";
  if (pathname.startsWith("/admin/articles")) return "Articles";
  if (pathname.startsWith("/admin/ad-slots")) return "Ad slots";
  if (pathname.startsWith("/admin/settings")) return "Settings";
  if (pathname.startsWith("/admin/login")) return "Login";
  return "Admin";
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 px-3 py-2" aria-label="Admin navigation">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href, item.exact);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link
      href="/admin"
      className="flex items-center gap-2 px-4 py-4 text-foreground"
    >
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Sparkles className="size-4" />
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-semibold tracking-tight">Aivora</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Admin panel
        </span>
      </div>
    </Link>
  );
}

function UserMenu({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } catch {
      /* ignore — we still navigate away */
    } finally {
      setSigningOut(false);
      router.replace("/admin/login");
    }
  };

  const initial = (user.name || user.email || "A").charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 px-2 py-1.5"
          aria-label="Account menu"
        >
          <span className="grid size-7 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
            {initial}
          </span>
          <span className="hidden text-sm font-medium sm:inline-block">
            {user.name || user.email}
          </span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{user.name || "Admin"}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/admin/settings" className="cursor-pointer">
            <UserIcon className="size-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/" className="cursor-pointer">
            <ExternalLink className="size-4" />
            <span>View public site</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={signingOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" />
          <span>{signingOut ? "Signing out…" : "Sign out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AdminShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const title = deriveTitle(pathname);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border/60 bg-sidebar/40 md:flex md:flex-col">
        <Brand />
        <div className="mt-1 flex-1 overflow-y-auto">
          <SidebarNav />
        </div>
        <div className="border-t border-border/60 p-3 text-[11px] text-muted-foreground">
          Aivora Admin · v1.0
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {/* Mobile menu trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="px-0 pt-0">
                <SheetTitle className="m-0">
                  <Brand />
                </SheetTitle>
              </SheetHeader>
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <h1 className="truncate text-base font-semibold tracking-tight">
            {title}
          </h1>

          <div className="ml-auto flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden text-muted-foreground sm:inline-flex"
            >
              <Link href="/" target="_blank">
                <ExternalLink className="size-4" />
                <span>View site</span>
              </Link>
            </Button>
            <UserMenu user={user} />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
