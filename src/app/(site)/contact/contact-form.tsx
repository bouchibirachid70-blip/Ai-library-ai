"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

const MAX_MSG = 5000;

const schema = z.object({
  name: z
    .string()
    .min(1, "Please enter your name")
    .max(120, "Name must be 120 characters or less")
    .trim(),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  message: z
    .string()
    .min(1, "Please enter a message")
    .max(MAX_MSG, `Message must be ${MAX_MSG} characters or less`),
});

type FormValues = z.infer<typeof schema>;

export function ContactForm() {
  const [done, setDone] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", message: "" },
    mode: "onTouched",
  });

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = form;

  const messageValue = useWatch({ control, name: "message" }) || "";
  const messageLen = messageValue.length;

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          message: values.message,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: unknown };
      if (!res.ok || !data.ok) {
        const msg =
          typeof data.error === "string" ? data.error : "Couldn't send your message. Please try again.";
        toast.error(msg);
        return;
      }
      toast.success("Message sent", {
        description: "We'll get back to you as soon as we can.",
      });
      setDone(true);
      reset();
    } catch {
      toast.error("Network error — please try again.");
    }
  };

  if (done) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
        <h2 className="text-lg font-semibold text-primary">Thanks for reaching out!</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your message has been sent. We&apos;ll get back to you shortly.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => setDone(false)}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
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
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="How can we help?"
                  rows={6}
                  maxLength={MAX_MSG}
                  {...field}
                />
              </FormControl>
              <div className="flex items-center justify-end text-xs text-muted-foreground">
                <span aria-live="polite">
                  {messageLen.toLocaleString()} / {MAX_MSG.toLocaleString()}
                </span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              Send message
              <Send className="ml-1.5 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
