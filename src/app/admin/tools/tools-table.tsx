"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Pencil, Trash2, Loader2, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
};

type Tool = {
  id: string;
  name: string;
  slug: string;
  description: string;
  websiteUrl: string;
  categoryId: string | null;
  status: string;
  pricing: string;
  tags: string;
  logo: string | null;
  clicksCount: number;
  createdAt: string;
  category: Category | null;
};

type ToolsResponse = {
  items: Tool[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
] as const;

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className:
      "border-amber-500/40 bg-amber-500/15 text-amber-300",
  },
  approved: {
    label: "Approved",
    className:
      "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  },
  rejected: {
    label: "Rejected",
    className: "border-rose-500/40 bg-rose-500/15 text-rose-300",
  },
};

export function AdminToolsTable() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialStatus = searchParams.get("status") || "all";
  const initialQ = searchParams.get("q") || "";
  const initialPage = Number(searchParams.get("page") || "1");

  const [status, setStatus] = useState<string>(
    STATUS_OPTIONS.some((o) => o.value === initialStatus) ? initialStatus : "all",
  );
  const [q, setQ] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);
  const [page, setPage] = useState(initialPage);
  const [data, setData] = useState<ToolsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Debounce the search input.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  // Reset to page 1 when filters change.
  useEffect(() => {
    setPage(1);
  }, [status, debouncedQ]);

  const fetchTools = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
      });
      if (status !== "all") params.set("status", status);
      if (debouncedQ) params.set("q", debouncedQ);
      const res = await fetch(`/api/admin/tools?${params.toString()}`, {
        credentials: "same-origin",
      });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to load tools");
      const json = (await res.json()) as ToolsResponse;
      setData(json);
    } catch {
      toast.error("Failed to load tools");
    } finally {
      setLoading(false);
    }
  }, [page, status, debouncedQ, router]);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  // Sync filter state to the URL (shareable + survives refresh).
  useEffect(() => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (debouncedQ) params.set("q", debouncedQ);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    router.replace(qs ? `/admin/tools?${qs}` : "/admin/tools", {
      scroll: false,
    });
  }, [status, debouncedQ, page, router]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/tools/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Tool deleted");
      fetchTools();
    } catch {
      toast.error("Failed to delete tool");
    } finally {
      setDeleting(null);
    }
  };

  const pages = data?.pages ?? 1;
  const items = data?.items ?? [];

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const headerCells = useMemo(
    () =>
      ["Name", "Category", "Pricing", "Status", "Clicks", "Created", "Actions"],
    [],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Tools</h2>
          <p className="text-sm text-muted-foreground">
            Add, edit, and review directory listings.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/tools/new">
            <Plus className="size-4" />
            Add tool
          </Link>
        </Button>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={status}
          onValueChange={(v) => setStatus(v)}
          className="w-fit"
        >
          <TabsList>
            {STATUS_OPTIONS.map((o) => (
              <TabsTrigger key={o.value} value={o.value}>
                {o.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or description…"
            className="pl-9"
            aria-label="Search tools"
          />
        </div>
      </div>

      <Card className="py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {headerCells.map((h) => (
                  <TableHead
                    key={h}
                    className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`s-${i}`} className="hover:bg-transparent">
                    {headerCells.map((_, j) => (
                      <TableCell key={`s-${i}-${j}`}>
                        <Skeleton className="h-6 w-full max-w-[140px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={headerCells.length}
                    className="py-16 text-center"
                  >
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                      <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
                        <Wrench className="size-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">No tools found</p>
                        <p className="text-sm text-muted-foreground">
                          {debouncedQ || status !== "all"
                            ? "Try clearing your filters."
                            : "Add your first tool to get started."}
                        </p>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href="/admin/tools/new">
                          <Plus className="size-4" />
                          Add tool
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((t) => {
                  const sb = STATUS_BADGE[t.status] || {
                    label: t.status,
                    className: "",
                  };
                  const logoText =
                    t.logo && t.logo.length <= 3 ? t.logo : t.name.charAt(0).toUpperCase();
                  return (
                    <TableRow
                      key={t.id}
                      className="text-sm hover:bg-muted/40"
                    >
                      <TableCell>
                        <Link
                          href={`/admin/tools/${t.id}`}
                          className="flex items-center gap-2.5 font-medium hover:text-primary"
                        >
                          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/15 text-xs font-semibold text-primary">
                            {logoText}
                          </span>
                          <span className="truncate">{t.name}</span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {t.category ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span aria-hidden>{t.category.icon}</span>
                            {t.category.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/70">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {t.pricing}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={sb.className}
                        >
                          {sb.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {t.clicksCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(t.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            asChild
                            size="icon"
                            variant="ghost"
                            aria-label={`Edit ${t.name}`}
                          >
                            <Link href={`/admin/tools/${t.id}`}>
                              <Pencil className="size-4" />
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                aria-label={`Delete ${t.name}`}
                                disabled={deleting === t.id}
                              >
                                {deleting === t.id ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Trash2 className="size-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete tool</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete{" "}
                                  <strong className="text-foreground">
                                    {t.name}
                                  </strong>{" "}
                                  and remove it from the directory. This action
                                  cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-white hover:bg-destructive/90"
                                  onClick={() => handleDelete(t.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && items.length > 0 && (
          <div className="flex items-center justify-between border-t border-border/60 px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              {data?.total.toLocaleString() ?? 0} total
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {Math.max(1, pages)}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
