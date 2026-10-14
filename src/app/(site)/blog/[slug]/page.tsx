import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { db } from "@/lib/db";
import { AdSlot } from "@/components/ad-slot";
import { RemoteImage } from "@/components/remote-image";
import { JsonLd, buildMetadata } from "@/components/seo";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const revalidate = 60;
// External-DB (Supabase) renders are request-time only; never prerendered at build.
export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

async function getArticle(slug: string) {
  const article = await db.article.findUnique({ where: { slug } });
  if (!article || !article.published) return null;
  return article;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) {
    return buildMetadata({
      title: "Article not found",
      description: "This article could not be found.",
      path: `/blog/${slug}`,
    });
  }
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.excerpt || undefined,
    image: article.coverImage || undefined,
    datePublished: new Date(article.createdAt).toISOString(),
    dateModified: new Date(article.updatedAt).toISOString(),
    author: { "@type": "Organization", name: "Aivora" },
    publisher: { "@type": "Organization", name: "Aivora" },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://aivora.dev/blog/${article.slug}`,
    },
  };
  return buildMetadata({
    title: article.title,
    description: article.excerpt || article.title,
    path: `/blog/${article.slug}`,
    jsonLd,
  });
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.excerpt || undefined,
    image: article.coverImage || undefined,
    datePublished: new Date(article.createdAt).toISOString(),
    dateModified: new Date(article.updatedAt).toISOString(),
    author: { "@type": "Organization", name: "Aivora" },
    publisher: { "@type": "Organization", name: "Aivora" },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://aivora.dev/blog/${article.slug}`,
    },
  };

  return (
    <div className="pb-12">
      <JsonLd data={jsonLd} />

      {/* Breadcrumb */}
      <div className="container mx-auto max-w-3xl px-4 pt-6">
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
                <Link href="/blog">Blog</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{article.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <article className="container mx-auto max-w-3xl px-4 pt-8">
        <header className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <time dateTime={new Date(article.createdAt).toISOString()}>
              {formatDate(article.createdAt)}
            </time>
          </div>
          <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
            {article.title}
          </h1>
          {article.excerpt && (
            <p className="text-pretty text-lg text-muted-foreground">
              {article.excerpt}
            </p>
          )}
        </header>

        {article.coverImage && (
          <div className="mt-6 overflow-hidden rounded-xl border border-border/60 bg-muted/40">
            <RemoteImage
              src={article.coverImage}
              alt={article.title}
              loading="eager"
              className="w-full object-cover"
            />
          </div>
        )}

        <div
          className="article-content mt-8"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        <div className="mt-10">
          <Button asChild variant="outline">
            <Link href="/blog">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to blog
            </Link>
          </Button>
        </div>
      </article>

      <div className="container mx-auto max-w-3xl px-4">
        <AdSlot position="blog_post_bottom" />
      </div>
    </div>
  );
}
