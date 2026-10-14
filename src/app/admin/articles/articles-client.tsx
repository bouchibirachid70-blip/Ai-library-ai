"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2, FileText, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

type ArticlesResponse = {
  items: Article[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export function AdminArticles() {
  const router = useRouter();
  const [data, setData] = useState<ArticlesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/articles?admin=1&limit=100", {
        credentials: "same-origin",
      });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) throw new Error();
      const json = (await res.json()) as ArticlesResponse;
      setData(json);
    } catch {
      toast.error("Failed to load articles");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) throw new Error();
      toast.success("Article deleted");
      fetchArticles();
    } catch {
      toast.error("Failed to delete article");
    } finally {
      setDeleting(null);
    }
  };

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

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Articles</h2>
          <p className="text-sm text-muted-foreground">
            Blog posts and announcements shown at /blog.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/articles/new">
            <Plus className="size-4" />
            New article
          </Link>
        </Button>
      </header>

      <Card className="py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Title
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Published date
                </TableHead>
                <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`s-${i}`} className="hover:bg-transparent">
                    {Array.from({ length: 4 }).map((__, j) => (
                      <TableCell key={`s-${i}-${j}`}>
                        <Skeleton className="h-6 w-full max-w-[200px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="py-16 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                      <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
                        <FileText className="size-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">No articles yet</p>
                        <p className="text-sm text-muted-foreground">
                          Write your first blog post to share updates and guides.
                        </p>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href="/admin/articles/new">
                          <Plus className="size-4" />
                          New article
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((a) => (
                  <TableRow key={a.id} className="text-sm hover:bg-muted/40">
                    <TableCell>
                      <Link
                        href={`/admin/articles/${a.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {a.title}
                      </Link>
                      {a.excerpt && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {a.excerpt}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {a.published ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                        >
                          <Eye className="size-3" />
                          Published
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-muted bg-muted text-muted-foreground"
                        >
                          <EyeOff className="size-3" />
                          Draft
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(a.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          asChild
                          size="icon"
                          variant="ghost"
                          aria-label={`Edit ${a.title}`}
                        >
                          <Link href={`/admin/articles/${a.id}`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              aria-label={`Delete ${a.title}`}
                              disabled={deleting === a.id}
                            >
                              {deleting === a.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Trash2 className="size-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete article</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete{" "}
                                <strong className="text-foreground">
                                  {a.title}
                                </strong>
                                . This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-white hover:bg-destructive/90"
                                onClick={() => handleDelete(a.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
