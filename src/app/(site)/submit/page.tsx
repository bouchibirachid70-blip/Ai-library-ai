import { CheckCircle2, Clock, Eye, MailCheck, ShieldCheck } from "lucide-react";
import { getCategoriesWithCounts } from "@/lib/constants";
import { buildMetadata } from "@/components/seo";
import { Card } from "@/components/ui/card";
import { SubmitToolForm } from "./submit-form";

export const metadata = buildMetadata({
  title: "Submit a Tool",
  description:
    "Submit your AI tool to Aivora. Free to submit — every submission is reviewed by our team before going live.",
  path: "/submit",
});

export const revalidate = 3600;
// External-DB (Supabase) renders are request-time only; never prerendered at build.
export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  const categories = await getCategoriesWithCounts();

  return (
    <div className="bg-grid pb-12">
      <section className="border-b border-border/40">
        <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Submit an AI tool
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Get your tool in front of builders searching for the right AI solution.
            It&apos;s free to submit — we review every entry by hand to keep the
            directory high-quality.
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="p-6 md:p-8">
              <SubmitToolForm
                categories={categories.map((c) => ({
                  id: c.id,
                  name: c.name,
                  slug: c.slug,
                  icon: c.icon,
                }))}
              />
            </Card>
          </div>

          <aside className="space-y-4">
            <Card className="p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                How it works
              </h2>
              <ol className="mt-3 space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    1
                  </span>
                  <span>
                    You submit your tool with a short description and a link to
                    the website.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    2
                  </span>
                  <span>
                    Our team reviews the submission (usually within a few days).
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    3
                  </span>
                  <span>
                    If it&apos;s a fit, we approve it and the tool goes live in
                    the directory.
                  </span>
                </li>
              </ol>
            </Card>

            <Card className="p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Submission tips
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>Describe what your tool does and who it&apos;s for.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>Use the official website URL — no affiliate links.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>Pick the most accurate category.</span>
                </li>
              </ul>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Your privacy
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Your email is only used to follow up on this submission. We
                don&apos;t sell your data. See our{" "}
                <a href="/privacy" className="text-primary underline underline-offset-4">
                  privacy policy
                </a>
                .
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  ~few days review
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Eye className="h-3.5 w-3.5" />
                  Manual review
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MailCheck className="h-3.5 w-3.5" />
                  Email follow-up
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Free to submit
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </section>
    </div>
  );
}
