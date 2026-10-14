"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  X,
  Trash2,
  Search,
  Loader2,
  Inbox,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

type Submission = {
  id: string;
  toolName: string;
  websiteUrl: string;
  description: string;
  submitterEmail: string;
  categoryId: string | null;
  status: string;
  createdAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    description: string;
  } | null;
};

type SubmissionsResponse = {
  items: Submission[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
] as const;

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "border-amber-500/40 bg-amber-500/15 text-amber-300",
  },
  approved: {
    label: "Approved",
    className: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  },
  rejected: {
    label: "Rejected",
    className: "border-rose-500/40 bg-rose-500/15 text-rose-300",
  },
};

export function AdminSubmissions() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "pending";
  const initialQ = searchParams.get("q") || "";

  const [status, setStatus] = useState<string>(
    STATUS_OPTIONS.some((o) => o.value === initialStatus)
      ? initialStatus
      : "pending",
  );
  const [q, setQ] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<SubmissionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [status, debouncedQ]);

  const fetchSubs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        status,
      });
      if (debouncedQ) params.set("q", debouncedQ);
      const res = await fetch(`/api/submissions?${params.toString()}`, {
        credentials: "same-origin",
      });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) throw new Error();
      const json = (await res.json()) as SubmissionsResponse;
      setData(json);
    } catch {
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }, [page, status, debouncedQ, router]);

  useEffect(() => {
    fetchSubs();
  }, [fetchSubs]);

  useEffect(() => {
    const params = new URLSearchParams({ status });
    if (debouncedQ) params.set("q", debouncedQ);
    if (page > 1) params.set("page", String(page));
    router.replace(`/admin/submissions?${params.toString()}`, {
      scroll: false,
    });
  }, [status, debouncedQ, page, router]);

  const approve = async (id: string) => {
    setActing(id);
    try {
      const res = await fetch(`/api/submissions/${id}/approve`, {
        method: "POST",
        credentials: "same-origin",
      });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { ok?: boolean; tool?: { name: string } };
      toast.success("Submission approved", {
        description:
          data.tool?.name
            ? `Live tool "${data.tool.name}" created.`
            : "Live tool created.",
      });
      fetchSubs();
    } catch {
      toast.error("Failed to approve submission");
    } finally {
      setActing(null);
    }
  };

  const reject = async (id: string) => {
    setActing(id);
    try {
      const res = await fetch(`/api/submissions/${id}/reject`, {
        method: "POST",
        credentials: "same-origin",
      });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) throw new Error();
      toast.success("Submission rejected");
      fetchSubs();
    } catch {
      toast.error("Failed to reject submission");
    } finally {
      setActing(null);
    }
  };

  const remove = async (id: string) => {
    setActing(id);
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) throw new Error();
      toast.success("Submission deleted");
      fetchSubs();
    } catch {
      toast.error("Failed to delete submission");
    } finally {
      setActing(null);
    }
  };

  const pages = data?.pages ?? 1;
  const items = data?.items ?? [];
  const headerCells = useMemo(
    () =>
      [
        "Tool",
        "Website",
        "Submitter",
        "Category",
        "Submitted",
        "Status",
        "Actions",
      ] as const,
    [],
  );

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

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Submissions</h2>
          <p className="text-sm text-muted-foreground">
            Review and curate community tool submissions.
          </p>
        </div>
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
            placeholder="Search by tool or email…"
            className="pl-9"
            aria-label="Search submissions"
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
                        <Inbox className="size-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">
                          {status === "pending"
                            ? "No pending submissions"
                            : "No submissions found"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {debouncedQ
                            ? "Try a different search term."
                            : "New submissions from the public form will appear here."}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((s) => {
                  const sb = STATUS_BADGE[s.status] || {
                    label: s.status,
                    className: "",
                  };
                  return (
                    <TableRow key={s.id} className="text-sm hover:bg-muted/40">
                      <TableCell>
                        <Link
                          href={s.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:text-primary"
                          title={s.description}
                        >
                          {s.toolName}
                        </Link>
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {s.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={s.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                        >
                          Visit
                          <ExternalLink className="size-3" />
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.submitterEmail}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.category ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span aria-hidden>{s.category.icon}</span>
                            {s.category.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/70">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(s.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={sb.className}>
                          {sb.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {s.status !== "approved" && (
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-emerald-500 text-white hover:bg-emerald-500/90"
                              onClick={() => approve(s.id)}
                              disabled={acting === s.id}
                              aria-label={`Approve ${s.toolName}`}
                            >
                              {acting === s.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Check className="size-3.5" />
                              )}
                              <span className="hidden sm:inline">Approve</span>
                            </Button>
                          )}
                          {s.status !== "rejected" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => reject(s.id)}
                              disabled={acting === s.id}
                              aria-label={`Reject ${s.toolName}`}
                            >
                              {acting === s.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <X className="size-3.5" />
                              )}
                              <span className="hidden sm:inline">Reject</span>
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                aria-label={`Delete ${s.toolName}`}
                                disabled={acting === s.id}
                              >
                                {acting === s.id ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Trash2 className="size-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete submission
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Delete{" "}
                                  <strong className="text-foreground">
                                    {s.toolName}
                                  </strong>{" "}
                                  submission? This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-white hover:bg-destructive/90"
                                  onClick={() => remove(s.id)}
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
