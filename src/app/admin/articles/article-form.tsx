"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

type ArticleForForm = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string | null;
  published: boolean;
};

type Mode = "create" | "edit";

export function ArticleForm({
  mode,
  article,
}: {
  mode: Mode;
  article?: ArticleForForm;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [coverImage, setCoverImage] = useState(article?.coverImage ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [published, setPublished] = useState(article?.published ?? false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim()) {
      setFormError("Title is required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim(),
        coverImage: coverImage.trim() || null,
        content,
        published,
      };
      const url =
        mode === "create" ? "/api/articles" : `/api/articles/${article!.id}`;
      const method = mode === "create" ? "POST" : "PUT";
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
        if (data.error && typeof data.error === "object") {
          const fe = data.error as {
            formErrors?: string[];
            fieldErrors?: Record<string, string[]>;
          };
          setFormError(
            (fe.formErrors && fe.formErrors[0]) ||
              (fe.fieldErrors && Object.values(fe.fieldErrors)[0]?.[0]) ||
              "Failed to save article",
          );
        } else {
          setFormError("Failed to save article");
        }
        return;
      }
      toast.success(
        mode === "create" ? "Article created" : "Article updated",
        {
          description: body.title,
        },
      );
      router.replace("/admin/articles");
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!article) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/articles/${article.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) throw new Error();
      toast.success("Article deleted");
      router.replace("/admin/articles");
    } catch {
      toast.error("Failed to delete article");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link href="/admin/articles">
            <ArrowLeft className="size-4" />
            Back to articles
          </Link>
        </Button>
        <h2 className="text-2xl font-semibold tracking-tight">
          {mode === "create" ? "New article" : "Edit article"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {mode === "create"
            ? "Write a new blog post for the /blog section."
            : `Editing "${article?.title ?? ""}".`}
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        {formError && (
          <div
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {formError}
          </div>
        )}

        <Card className="p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. The 10 best AI writing tools in 2025"
                required
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated from title"
                className="font-mono"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to auto-generate from the title.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover">Cover image URL (optional)</Label>
              <Input
                id="cover"
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://images.example.com/cover.jpg"
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Input
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="One-line summary shown in the blog list"
                maxLength={400}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="content">Article content (HTML)</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={20}
                placeholder="<h2>Intro</h2><p>Write your article in HTML…</p>"
                className="font-mono text-xs leading-relaxed"
              />
              <p className="text-xs text-muted-foreground">
                The content is rendered as-is using the site&apos;s prose styles. Use
                semantic HTML ({`<h2>`}, {`<p>`}, {`<ul>`}, etc.).
              </p>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border/60 p-3 md:col-span-2">
              <div className="space-y-0.5">
                <Label
                  htmlFor="published"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  {published ? (
                    <Eye className="size-4 text-emerald-400" />
                  ) : (
                    <EyeOff className="size-4 text-muted-foreground" />
                  )}
                  Published
                </Label>
                <p className="text-xs text-muted-foreground">
                  Only published articles appear on the public blog.
                </p>
              </div>
              <Switch
                id="published"
                checked={published}
                onCheckedChange={setPublished}
              />
            </div>
          </div>

          <Collapsible
            open={previewOpen}
            onOpenChange={setPreviewOpen}
            className="mt-5 rounded-md border border-border/60"
          >
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-between rounded-b-none border-b border-border/60"
              >
                <span>
                  {previewOpen ? "Hide preview" : "Show preview"}
                </span>
                <Eye className="size-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="bg-muted/20 p-4">
                {content.trim() ? (
                  <div
                    className="article-content max-w-none"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nothing to preview yet. Start writing the content above.
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save
            </Button>
            <Button asChild variant="outline" type="button">
              <Link href="/admin/articles">Cancel</Link>
            </Button>
          </div>
          {mode === "edit" && article && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  type="button"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete article</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete{" "}
                    <strong className="text-foreground">{article.title}</strong>.
                    This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    onClick={handleDelete}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </form>
    </div>
  );
}
