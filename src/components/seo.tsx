import type { Metadata } from "next";
import { jsonForScript } from "@/lib/validation";

type SeoProps = {
  title?: string;
  description?: string;
  path?: string; // e.g. "/tools/foo"
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://aivora.dev";

export function buildMetadata({
  title,
  description,
  path,
  jsonLd,
}: SeoProps): Metadata {
  const fullTitle = title ? `${title} | Aivora` : "Aivora — Discover the Best AI Tools";
  const desc =
    description ||
    "Aivora is a curated directory of the best AI tools. Browse by category, compare features, and find the right AI tool for your workflow.";
  const url = path ? `${SITE_URL}${path}` : SITE_URL;
  return {
    title: fullTitle,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description: desc,
      url,
      siteName: "Aivora",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
    },
    other: jsonLd
      ? { "json-ld": JSON.stringify(Array.isArray(jsonLd) ? jsonLd : [jsonLd]) }
      : undefined,
  };
}

/** Renders JSON-LD script tags (server component). */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: jsonForScript(Array.isArray(data) ? data : [data]),
      }}
    />
  );
}
