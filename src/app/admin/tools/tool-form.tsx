"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
import { PRICING_OPTIONS } from "@/lib/constants";

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string;
};

type ToolForForm = {
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
};

const MAX_DESC = 2000;

const schema = z.object({
  name: z.string().min(1, "Name is required").max(120, "Max 120 characters"),
  slug: z
    .string()
    .max(120, "Max 120 characters")
    .optional()
    .or(z.literal("")),
  websiteUrl: z
    .string()
    .min(1, "Website URL is required")
    .url("Please enter a valid URL, e.g. https://example.com"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(MAX_DESC, `Max ${MAX_DESC} characters`),
  categoryId: z.string().optional().nullable(),
  pricing: z.string().min(1),
  tags: z.string().default(""),
  logo: z
    .string()
    .max(20, "Max 20 characters")
    .optional()
    .or(z.literal("")),
  status: z.enum(["pending", "approved", "rejected"]),
});

// Zod defaults make the parsed output stricter than the values accepted by
// the form (for example, `tags` is optional on input but always a string on
// output). Keep React Hook Form's input and submit/output types distinct so
// the resolver is correctly typed without unsafe casts.
type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

type Mode = "create" | "edit";

export function ToolForm({
  mode,
  tool,
}: {
  mode: Mode;
  tool?: ToolForForm;
}) {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const defaultValues: FormInput = {
    name: tool?.name ?? "",
    slug: tool?.slug ?? "",
    websiteUrl: tool?.websiteUrl ?? "",
    description: tool?.description ?? "",
    categoryId: tool?.categoryId ?? "",
    pricing: tool?.pricing ?? "Free",
    tags: tool?.tags ?? "",
    logo: tool?.logo ?? "",
    status:
      (tool?.status as "pending" | "approved" | "rejected") ?? "approved",
  };

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onTouched",
  });

  const {
    handleSubmit,
    control,
    setError,
    formState: { isSubmitting: rhfSubmitting },
  } = form;

  const descriptionValue = useWatch({ control, name: "description" }) || "";
  const descLength = descriptionValue.length;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/categories", { credentials: "same-origin" });
        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { items: CategoryOption[] };
        if (!cancelled) setCategories(data.items ?? []);
      } catch {
        if (!cancelled) toast.error("Failed to load categories");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const body = {
        name: values.name.trim(),
        slug: values.slug?.trim() || "",
        websiteUrl: values.websiteUrl.trim(),
        description: values.description,
        categoryId: values.categoryId || null,
        pricing: values.pricing,
        tags: values.tags || "",
        logo: values.logo || null,
        status: values.status,
      };
      const url =
        mode === "create" ? "/api/tools/create" : `/api/tools/${tool!.id}`;
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
          if (fe.formErrors && fe.formErrors.length > 0) {
            setFormError(fe.formErrors.join(" "));
          }
          if (fe.fieldErrors) {
            for (const [field, messages] of Object.entries(fe.fieldErrors)) {
              const msg = (messages as string[])[0];
              if (msg) setError(field as keyof FormInput, { message: msg });
            }
          }
        } else {
          setFormError("Something went wrong. Please try again.");
        }
        return;
      }
      toast.success(
        mode === "create" ? "Tool created" : "Tool updated",
        {
          description: `${body.name} has been saved.`,
        },
      );
      router.replace("/admin/tools");
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!tool) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tools/${tool.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) throw new Error();
      toast.success("Tool deleted");
      router.replace("/admin/tools");
    } catch {
      toast.error("Failed to delete tool");
      setDeleting(false);
    }
  };

  const busy = submitting || rhfSubmitting;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link href="/admin/tools">
            <ArrowLeft className="size-4" />
            Back to tools
          </Link>
        </Button>
        <h2 className="text-2xl font-semibold tracking-tight">
          {mode === "create" ? "Add tool" : "Edit tool"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {mode === "create"
            ? "Create a new directory listing."
            : `Editing "${tool?.name ?? ""}".`}
        </p>
      </header>

      <Form {...form}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
        >
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
              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Acme Writer AI"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="auto-generated from name"
                        autoComplete="off"
                        className="font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Leave empty to auto-generate from the name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={control}
              name="websiteUrl"
              render={({ field }) => (
                <FormItem className="mt-5">
                  <FormLabel>Website URL *</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      autoCapitalize="none"
                      autoCorrect="off"
                      inputMode="url"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="description"
              render={({ field }) => (
                <FormItem className="mt-5">
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What does this tool do? Who is it for?"
                      rows={6}
                      maxLength={MAX_DESC}
                      {...field}
                    />
                  </FormControl>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <FormDescription className="m-0">
                      Plain text, no HTML.
                    </FormDescription>
                    <span
                      className={
                        descLength > MAX_DESC - 100 ? "text-amber-500" : undefined
                      }
                      aria-live="polite"
                    >
                      {descLength.toLocaleString()} / {MAX_DESC.toLocaleString()}
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <FormField
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={field.value || "none"}
                      onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">— No category —</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <span className="mr-1">{c.icon || "🏷️"}</span>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="pricing"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pricing</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose a pricing" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRICING_OPTIONS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <FormField
                control={control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="writing, productivity, gpt-4"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Comma-separated keywords used in search.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="🚀 or a single letter"
                        autoComplete="off"
                        maxLength={20}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Emoji or short text shown as the tool avatar.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={control}
              name="status"
              render={({ field }) => (
                <FormItem className="mt-5">
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full sm:w-56">
                        <SelectValue placeholder="Choose a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Only approved tools appear in the public directory.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Save
                  </>
                )}
              </Button>
              <Button asChild variant="outline" type="button">
                <Link href="/admin/tools">Cancel</Link>
              </Button>
            </div>
            {mode === "edit" && tool && (
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
                    <AlertDialogTitle>Delete tool</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete{" "}
                      <strong className="text-foreground">{tool.name}</strong>{" "}
                      and remove it from the directory. This cannot be undone.
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
      </Form>
    </div>
  );
}
