"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  ShieldCheck,
  Info,
  LogOut,
  ExternalLink,
  Loader2,
  Wrench,
  FileText,
  FolderTree,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type MeResponse = {
  user: { id: string; email: string; name: string } | null;
};

type StatsResponse = {
  counts: {
    totalTools: number;
    totalCategories: number;
    totalArticles: number;
    totalSubmissions: number;
    pendingSubmissions: number;
    totalClicks: number;
  };
};

export function AdminSettings() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse["user"] | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [stats, setStats] = useState<StatsResponse["counts"] | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "same-origin" });
        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }
        if (res.ok) {
          const data = (await res.json()) as MeResponse;
          setMe(data.user);
        }
      } catch {
        /* ignore */
      } finally {
        setMeLoading(false);
      }
    })();
  }, [router]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/stats", { credentials: "same-origin" });
        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }
        if (res.ok) {
          const data = (await res.json()) as StatsResponse;
          setStats(data.counts);
        }
      } catch {
        /* ignore */
      }
    })();
  }, [router]);

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } catch {
      /* ignore */
    } finally {
      toast.success("Signed out");
      router.replace("/admin/login");
    }
  };

  const siteInfo = [
    {
      label: "Total tools",
      value: stats?.totalTools ?? null,
      icon: Wrench,
    },
    {
      label: "Categories",
      value: stats?.totalCategories ?? null,
      icon: FolderTree,
    },
    {
      label: "Articles",
      value: stats?.totalArticles ?? null,
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Account profile, site summary, and quick actions.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserIcon className="size-4 text-primary" />
              Admin profile
            </CardTitle>
            <CardDescription>
              Your signed-in administrator account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {meLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-5 w-64" />
              </div>
            ) : me ? (
              <div className="flex items-start gap-4">
                <span className="grid size-12 place-items-center rounded-full bg-primary/15 text-lg font-semibold text-primary">
                  {(me.name || me.email).charAt(0).toUpperCase()}
                </span>
                <div className="space-y-1">
                  <div className="text-sm font-medium">
                    {me.name || "Admin"}
                  </div>
                  <div className="text-xs text-muted-foreground">{me.email}</div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Session info unavailable.
              </p>
            )}

            <div className="rounded-md border border-border/60 bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5 text-primary" />
                <span>Role: Administrator</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Change password support requires direct DB access in this
                version. Contact your infrastructure owner to rotate credentials.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Site info card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="size-4 text-primary" />
              Site summary
            </CardTitle>
            <CardDescription>Quick stats across the directory.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {siteInfo.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="flex items-center justify-between rounded-md border border-border/60 p-3"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="size-4 text-muted-foreground" />
                    {s.label}
                  </span>
                  <span className="tabular-nums text-lg font-semibold">
                    {s.value === null ? (
                      <Skeleton className="h-6 w-10" />
                    ) : (
                      s.value.toLocaleString()
                    )}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base">Danger zone</CardTitle>
          <CardDescription>
            Sign out of the admin panel or jump to the public site.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={signingOut}
            className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            {signingOut ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-4" />
            )}
            Sign out
          </Button>
          <Button asChild variant="outline">
            <Link href="/" target="_blank">
              <ExternalLink className="size-4" />
              View public site
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
