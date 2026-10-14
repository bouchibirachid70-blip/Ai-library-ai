"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2, FolderTree } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string;
  toolCount: number;
};

type Form = {
  name: string;
  slug: string;
  icon: string;
  description: string;
};

const EMPTY_FORM: Form = {
  name: "",
  slug: "",
  icon: "🏷️",
  description: "",
};

export function AdminCategories() {
  const router = useRouter();
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [forceDeleteTarget, setForceDeleteTarget] = useState<{
    id: string;
    name: string;
    count: number;
  } | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories", { credentials: "same-origin" });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { items: Category[] };
      setItems(data.items ?? []);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = async (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon ?? "🏷️",
      description: cat.description ?? "",
    });
    setDialogOpen(true);
    // Prefetch fresh values from /api/categories/[id] to ensure slug/desc are correct.
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        credentials: "same-origin",
      });
      if (res.ok) {
        const data = (await res.json()) as { category: Category };
        if (data.category) {
          setForm({
            name: data.category.name,
            slug: data.category.slug,
            icon: data.category.icon ?? "🏷️",
            description: data.category.description ?? "",
          });
        }
      }
    } catch {
      /* fall back to list data */
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        icon: form.icon || "🏷️",
        description: form.description,
      };
      const url = editing
        ? `/api/categories/${editing.id}`
        : "/api/categories";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const data = (await res.json()) as {
        ok?: boolean;
        error?: unknown;
      };
      if (!res.ok || !data.ok) {
        const msg =
          data.error && typeof data.error === "object"
            ? (((data.error as { fieldErrors?: Record<string, string[]> }).fieldErrors?.name?.[0]) ?? "Failed to save category")
            : "Failed to save category";
        toast.error(msg);
        return;
      }
      toast.success(editing ? "Category updated" : "Category created");
      setDialogOpen(false);
      fetchCategories();
    } catch {
      toast.error("Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    setDeleting(cat.id);
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (res.status === 409) {
        const data = (await res.json()) as { count?: number; code?: string };
        if (data.code === "HAS_TOOLS") {
          setForceDeleteTarget({
            id: cat.id,
            name: cat.name,
            count: data.count ?? 0,
          });
          return;
        }
        toast.error("Category has tools assigned");
        return;
      }
      if (!res.ok) throw new Error();
      toast.success("Category deleted");
      fetchCategories();
    } catch {
      toast.error("Failed to delete category");
    } finally {
      setDeleting(null);
    }
  };

  const handleForceDelete = async () => {
    if (!forceDeleteTarget) return;
    try {
      const res = await fetch(
        `/api/categories/${forceDeleteTarget.id}?force=1`,
        {
          method: "DELETE",
          credentials: "same-origin",
        },
      );
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) throw new Error();
      toast.success("Category and its tool links deleted");
      setForceDeleteTarget(null);
      fetchCategories();
    } catch {
      toast.error("Failed to delete category");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Categories</h2>
          <p className="text-sm text-muted-foreground">
            Organise tools into browsable categories.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add category
        </Button>
      </header>

      <Card className="py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Name
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Icon
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Slug
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Tools
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
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={`s-${i}-${j}`}>
                        <Skeleton className="h-6 w-full max-w-[160px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="py-16 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                      <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
                        <FolderTree className="size-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">No categories yet</p>
                        <p className="text-sm text-muted-foreground">
                          Add your first category to organise tools.
                        </p>
                      </div>
                      <Button onClick={openCreate} size="sm" variant="outline">
                        <Plus className="size-4" />
                        Add category
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((c) => (
                  <TableRow key={c.id} className="text-sm hover:bg-muted/40">
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <span aria-hidden className="text-lg">
                        {c.icon || "🏷️"}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {c.slug}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {c.toolCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Edit ${c.name}`}
                          onClick={() => openEdit(c)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              aria-label={`Delete ${c.name}`}
                              disabled={deleting === c.id}
                            >
                              {deleting === c.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Trash2 className="size-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete category</AlertDialogTitle>
                              <AlertDialogDescription>
                                Delete{" "}
                                <strong className="text-foreground">
                                  {c.name}
                                </strong>
                                ? Tools in this category will be unassigned.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-white hover:bg-destructive/90"
                              onClick={() => handleDelete(c)}
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

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit category" : "New category"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the category name, icon, or description."
                : "Create a new category to group tools."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name *</Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Writing"
                required
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-slug">Slug</Label>
              <Input
                id="cat-slug"
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value }))
                }
                placeholder="auto-generated from name"
                className="font-mono"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to auto-generate from the name.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-icon">Icon (emoji)</Label>
              <Input
                id="cat-icon"
                value={form.icon}
                onChange={(e) =>
                  setForm((f) => ({ ...f, icon: e.target.value }))
                }
                placeholder="🏷️"
                maxLength={10}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea
                id="cat-desc"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
                maxLength={500}
                placeholder="Short description shown on the category page."
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Force-delete dialog (when category has tools) */}
      <AlertDialog
        open={forceDeleteTarget !== null}
        onOpenChange={(o) => {
          if (!o) setForceDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Category has tools</AlertDialogTitle>
            <AlertDialogDescription>
              {forceDeleteTarget
                ? `${forceDeleteTarget.name} currently has ${forceDeleteTarget.count} tool${forceDeleteTarget.count === 1 ? "" : "s"} assigned. Force-deleting will detach these tools but will not delete the tools themselves. This cannot be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleForceDelete}
            >
              Force delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
