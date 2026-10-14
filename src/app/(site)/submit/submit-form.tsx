"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2, Send } from "lucide-react";
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

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
};

const MAX_DESC = 2000;

const schema = z.object({
  toolName: z
    .string()
    .min(1, "Tool name is required")
    .max(120, "Tool name must be 120 characters or less")
    .trim(),
  websiteUrl: z
    .string()
    .min(1, "Website URL is required")
    .url("Please enter a valid URL, e.g. https://example.com"),
  description: z
    .string()
    .min(10, "Please describe the tool in a few sentences (at least 10 characters)")
    .max(MAX_DESC, `Description must be ${MAX_DESC} characters or less`),
  submitterEmail: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  categoryId: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

export function SubmitToolForm({ categories }: { categories: CategoryOption[] }) {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      toolName: "",
      websiteUrl: "",
      description: "",
      submitterEmail: "",
      categoryId: "",
    },
    mode: "onTouched",
  });

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = form;

  const descriptionValue = useWatch({ control, name: "description" }) || "";
  const descLength = descriptionValue.length;

  // Reset success state if the user navigates back later — minor UX nicety.
  useEffect(() => {
    return () => setSubmitted(false);
  }, []);

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolName: values.toolName,
          websiteUrl: values.websiteUrl,
          description: values.description,
          submitterEmail: values.submitterEmail,
          categoryId: values.categoryId || null,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: unknown };
      if (!res.ok || !data.ok) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : "Submission failed. Please try again.";
        toast.error(msg);
        return;
      }
      toast.success("Submission received", {
        description: "We'll review your tool and reach out if needed.",
      });
      setSubmitted(true);
      reset();
    } catch {
      toast.error("Network error — please try again.");
    }
  };

  if (submitted) {
    return (
      <Card className="flex flex-col items-center gap-4 p-10 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-primary">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Thanks! Your submission is pending review.</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            We review every submission by hand to keep the directory high-quality.
            You&apos;ll hear from us at the email you provided if we have questions.
          </p>
        </div>
        <Button onClick={() => setSubmitted(false)} variant="outline">
          Submit another tool
        </Button>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormField
          control={control}
          name="toolName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tool name</FormLabel>
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
          name="websiteUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website URL</FormLabel>
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
              <FormDescription>
                The official site visitors should land on.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What does this tool do? Who is it for? What makes it different?"
                  rows={6}
                  maxLength={MAX_DESC}
                  {...field}
                />
              </FormControl>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <FormDescription className="m-0">
                  Tell us what the tool does. Plain text, no HTML.
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

        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            control={control}
            name="submitterEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    autoCapitalize="none"
                    autoCorrect="off"
                    inputMode="email"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  We&apos;ll only use this to follow up on your submission.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category (optional)</FormLabel>
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
                        <span className="mr-1">{c.icon}</span>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                Submit tool
                <Send className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Submissions are reviewed by our team before going live.
          </p>
        </div>
      </form>
    </Form>
  );
}
