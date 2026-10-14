"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { AD_POSITIONS } from "@/lib/constants";

type AdSlot = {
  id: string;
  position: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type Form = {
  position: string;
  code: string;
  isActive: boolean;
};

const EMPTY_FORM: Form = {
  position: "",
  code: "",
  isActive: true,
};

const ADSENNSE_EXAMPLE = `<ins class="adsbygoogle"
  style="display:block"
  data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
  data-ad-slot="XXXXXXXXXX"
  data-ad-format="auto"></ins>`;

export function AdminAdSlots() {
  const router = useRouter();
  const [items, setItems] = useState<AdSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdSlot | null>(null);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ad-slots", { credentials: "same-origin" });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { items: AdSlot[] };
      setItems(data.items ?? []);
    } catch {
      toast.error("Failed to load ad slots");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (slot: AdSlot) => {
    setEditing(slot);
    setForm({
      position: slot.position,
      code: slot.code,
      isActive: slot.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.position.trim()) {
      toast.error("Position is required");
      return;
    }
    if (!form.code.trim()) {
      toast.error("Ad code is required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        position: form.position.trim(),
        code: form.code,
        isActive: form.isActive,
      };
      const url = editing ? `/api/ad-slots/${editing.id}` : "/api/ad-slots";
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
      const data = (await res.json()) as { ok?: boolean; error?: unknown };
      if (!res.ok || !data.ok) {
        toast.error("Failed to save ad slot");
        return;
      }
      toast.success(editing ? "Ad slot updated" : "Ad slot created");
      setDialogOpen(false);
      fetchSlots();
    } catch {
      toast.error("Failed to save ad slot");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (slot: AdSlot) => {
    setToggling(slot.id);
    try {
      const res = await fetch(`/api/ad-slots/${slot.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          position: slot.position,
          code: slot.code,
          isActive: !slot.isActive,
        }),
      });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) throw new Error();
      toast.success(
        !slot.isActive ? "Ad slot enabled" : "Ad slot disabled",
      );
      fetchSlots();
    } catch {
      toast.error("Failed to toggle ad slot");
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/ad-slots/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) throw new Error();
      toast.success("Ad slot deleted");
      fetchSlots();
    } catch {
      toast.error("Failed to delete ad slot");
    } finally {
      setDeleting(null);
    }
  };

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
          <h2 className="text-2xl font-semibold tracking-tight">Ad slots</h2>
          <p className="text-sm text-muted-foreground">
            Manage ad units injected into specific positions across the site.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add ad slot
        </Button>
      </header>

      <Card className="py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Position
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Code preview
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Created
                </TableHead>
                <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
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
                        <Megaphone className="size-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">No ad slots yet</p>
                        <p className="text-sm text-muted-foreground">
                          Add your first ad unit to start monetising.
                        </p>
                      </div>
                      <Button onClick={openCreate} size="sm" variant="outline">
                        <Plus className="size-4" />
                        Add ad slot
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((slot) => (
                  <TableRow key={slot.id} className="text-sm hover:bg-muted/40">
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-muted/40 font-mono text-xs text-foreground"
                      >
                        {slot.position}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                          slot.isActive
                            ? "text-emerald-300"
                            : "text-muted-foreground"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            slot.isActive ? "bg-emerald-400" : "bg-muted-foreground"
                          }`}
                        />
                        {slot.isActive ? "Active" : "Disabled"}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[280px]">
                      <code className="block truncate font-mono text-xs text-muted-foreground">
                        {slot.code.replace(/\s+/g, " ").trim().slice(0, 60)}
                        {slot.code.length > 60 ? "…" : ""}
                      </code>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(slot.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <div className="flex items-center gap-2 pr-1">
                          <Switch
                            checked={slot.isActive}
                            onCheckedChange={() => handleToggle(slot)}
                            disabled={toggling === slot.id}
                            aria-label={`Toggle ${slot.position}`}
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Edit ${slot.position}`}
                          onClick={() => openEdit(slot)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              aria-label={`Delete ${slot.position}`}
                              disabled={deleting === slot.id}
                            >
                              {deleting === slot.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Trash2 className="size-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete ad slot</AlertDialogTitle>
                              <AlertDialogDescription>
                                Delete the{" "}
                                <code className="font-mono text-foreground">
                                  {slot.position}
                                </code>{" "}
                                ad slot? This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-white hover:bg-destructive/90"
                                onClick={() => handleDelete(slot.id)}
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit ad slot" : "New ad slot"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the position, code, or status."
                : "Configure where and what ad code to inject."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                list="ad-positions"
                value={form.position}
                onChange={(e) =>
                  setForm((f) => ({ ...f, position: e.target.value }))
                }
                placeholder="e.g. home_top"
                className="font-mono"
                autoComplete="off"
                required
              />
              <datalist id="ad-positions">
                {AD_POSITIONS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground">
                Free-text key. Known site positions:{" "}
                <code className="font-mono">home_top, home_middle, home_bottom,
                tools_list_top, tools_list_bottom, tool_detail_top,
                tool_detail_middle, tool_detail_bottom, category_top,
                blog_list_top, blog_post_bottom</code>
                . Custom keys only render where a developer has placed{" "}
                <code className="font-mono">{`<AdSlot position="..."/>`}</code>.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Ad code (HTML / JS)</Label>
              <Textarea
                id="code"
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value }))
                }
                rows={8}
                placeholder={ADSENNSE_EXAMPLE}
                className="min-h-[160px] font-mono text-xs leading-relaxed"
                required
              />
              <p className="text-xs text-muted-foreground">
                Paste the full HTML/JS snippet. Script tags are executed in the
                browser when the slot is rendered.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
              <div className="space-y-0.5">
                <Label
                  htmlFor="active"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  Active
                </Label>
                <p className="text-xs text-muted-foreground">
                  Inactive slots stay saved but won&apos;t render.
                </p>
              </div>
              <Switch
                id="active"
                checked={form.isActive}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, isActive: v }))
                }
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
    </div>
  );
}
