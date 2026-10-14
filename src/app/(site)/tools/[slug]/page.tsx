import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MousePointerClick, Tag } from "lucide-react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { AdSlot } from "@/components/ad-slot";
import { ToolCard } from "@/components/tool-card";
import { ToolLogo } from "@/components/tool-logo";
import { VisitButton } from "@/components/visit-button";
import { JsonLd, buildMetadata } from "@/components/seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

export const revalidate = 60;
// External-DB (Supabase) renders are request-time only; never prerendered at build.
export const dynamic = "force-dynamic";

const PRICING_STYLES: Record<string, string> = {
  Free: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Freemium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Paid: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  "Contact for pricing": "bg-violet-500/15 text-violet-400 border-violet-500/30",
};

type Params = Promise<{ slug: string }>;

async function getTool(slug: string) {
  const tool = await db.tool.findUnique({
    where: { slug },
    include: { category: true },
  });
  if (!tool || tool.status !== "approved") return null;
  return tool;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getTool(slug);
  if (!tool) {
    return buildMetadata({
      title: "Tool not found",
      description: "This AI tool could not be found.",
      path: `/tools/${slug}`,
    });
  }
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.description,
    url: tool.websiteUrl,
    applicationCategory:
      tool.category?.name ? `AI ${tool.category.name}` : "AI Application",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: tool.pricing === "Free" ? "0" : tool.pricing === "Freemium" ? "0" : "",
      priceCurrency: "USD",
    },
  };
  return buildMetadata({
    title: tool.name,
    description: tool.description,
    path: `/tools/${tool.slug}`,
    jsonLd,
  });
}

export default async function ToolDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const tool = await getTool(slug);
  if (!tool) notFound();

  const tags = (tool.tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  // Related tools in the same category (exclude current).
  const related = tool.category
    ? await db.tool.findMany({
        where: {
          status: "approved",
          categoryId: tool.categoryId,
          id: { not: tool.id },
        },
        orderBy: { clicksCount: "desc" },
        take: 4,
        include: { category: true },
      })
    : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.description,
    url: tool.websiteUrl,
    applicationCategory: tool.category?.name
      ? `AI ${tool.category.name}`
      : "AI Application",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: tool.pricing === "Free" ? "0" : tool.pricing === "Freemium" ? "0" : "",
      priceCurrency: "USD",
    },
  };

  return (
    <div className="pb-12">
      <JsonLd data={jsonLd} />

      {/* Breadcrumb */}
      <div className="container mx-auto max-w-6xl px-4 pt-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/tools">Tools</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {tool.category && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={`/category/${tool.category.slug}`}>
                      {tool.category.name}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{tool.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="container mx-auto max-w-6xl px-4 pt-6">
        <AdSlot position="tool_detail_top" />
      </div>

      {/* Header card */}
      <section className="container mx-auto max-w-6xl px-4">
        <Card className="overflow-hidden p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <ToolLogo
              logo={tool.logo}
              name={tool.name}
              className="grid h-20 w-20 place-items-center rounded-xl bg-gradient-to-br from-primary/30 via-primary/20 to-accent shadow-lg shadow-primary/10"
              textClassName="text-3xl font-bold text-primary"
              imgClassName="p-2"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  {tool.name}
                </h1>
                {tool.category && (
                  <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                    <Link href={`/category/${tool.category.slug}`}>
                      <span aria-hidden className="mr-1">{tool.category.icon}</span>
                      {tool.category.name}
                    </Link>
                  </Button>
                )}
                <Badge
                  variant="outline"
                  className={cn("font-medium", PRICING_STYLES[tool.pricing] || "")}
                >
                  {tool.pricing}
                </Badge>
              </div>
              <p className="mt-3 text-pretty text-muted-foreground leading-relaxed">
                {tool.description}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <VisitButton slug={tool.slug} url={tool.websiteUrl} />
                <Button asChild variant="outline" size="lg">
                  <Link href="/tools">
                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                    Back to tools
                  </Link>
                </Button>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MousePointerClick className="h-4 w-4" />
                  {tool.clicksCount.toLocaleString()} visits
                </span>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Tags */}
      {tags.length > 0 && (
        <section className="container mx-auto max-w-6xl px-4 pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Tag className="h-3.5 w-3.5" /> Tags
            </span>
            {tags.map((t) => (
              <Link
                key={t}
                href={`/tools?q=${encodeURIComponent(t)}`}
                className="rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
              >
                {t}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="container mx-auto max-w-6xl px-4">
        <AdSlot position="tool_detail_middle" />
      </div>

      {/* Related tools */}
      {related.length > 0 && (
        <section className="container mx-auto max-w-6xl px-4 pt-6">
          <h2 className="text-xl font-bold tracking-tight">
            Related {tool.category?.name ? tool.category.name.toLowerCase() : ""} tools
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Other tools you might find useful.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((t) => (
              <ToolCard key={t.id} tool={t} />
            ))}
          </div>
        </section>
      )}

      <div className="container mx-auto max-w-6xl px-4">
        <AdSlot position="tool_detail_bottom" />
      </div>
    </div>
  );
}
