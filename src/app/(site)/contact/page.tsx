import { Mail, MessageSquare, Clock } from "lucide-react";
import { buildMetadata } from "@/components/seo";
import { Card } from "@/components/ui/card";
import { ContactForm } from "./contact-form";

export const metadata = buildMetadata({
  title: "Contact",
  description:
    "Get in touch with the Aivora team — feedback, partnership ideas, or tool submissions welcome.",
  path: "/contact",
});

export const revalidate = 3600;

export default function ContactPage() {
  return (
    <div className="bg-grid pb-12">
      <section className="border-b border-border/40">
        <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Contact us
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Questions, feedback, partnership ideas, or found a bug? Send us a
            message and we&apos;ll get back to you.
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="p-6 md:p-8">
              <ContactForm />
            </Card>
          </div>

          <aside className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Mail className="h-4 w-4 text-primary" />
                Email
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Prefer email? Reach us at{" "}
                <a
                  href="mailto:hello@aivora.dev"
                  className="text-primary underline underline-offset-4"
                >
                  hello@aivora.dev
                </a>
                .
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <MessageSquare className="h-4 w-4 text-primary" />
                Other ways to reach us
              </div>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                <li>
                  <strong className="text-foreground">Submissions:</strong> use
                  the{" "}
                  <a
                    href="/submit"
                    className="text-primary underline underline-offset-4"
                  >
                    submit form
                  </a>{" "}
                  — submissions sent via this contact form may be missed.
                </li>
                <li>
                  <strong className="text-foreground">Tool updates:</strong>{" "}
                  email us from the address on file for the listing.
                </li>
                <li>
                  <strong className="text-foreground">Press / partnerships:</strong>{" "}
                  email us with a brief intro and what you have in mind.
                </li>
              </ul>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="h-4 w-4 text-primary" />
                Response time
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                We read every message. You can usually expect a reply within a
                few business days.
              </p>
            </Card>
          </aside>
        </div>
      </section>
    </div>
  );
}
