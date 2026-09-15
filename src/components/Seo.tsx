import { useEffect } from 'react';

export interface SeoProps {
  title: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
  /** One or more JSON-LD objects (e.g. SoftwareApplication, Article, BreadcrumbList). */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const SITE_NAME = 'Aivora';
const DEFAULT_DESC =
  'Aivora is a curated directory of the best AI tools. Discover, search, and filter AI products across writing, design, code, productivity, and more.';

// Absolute site origin. Prefer the configured production domain
// (VITE_SITE_URL); fall back to the current browser origin so canonical
// URLs are always absolute without requiring configuration.
function siteOrigin(): string {
  const configured =
    (import.meta.env.VITE_SITE_URL as string | undefined) ||
    (import.meta.env.SITE_URL as string | undefined);
  if (configured) return configured.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

function toAbsolute(path?: string): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/')) return `${siteOrigin()}${path}`;
  return `${siteOrigin()}/${path}`;
}

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

const JSONLD_ID = 'aivora-jsonld';

function setJsonLd(data: Record<string, unknown> | Record<string, unknown>[] | undefined) {
  let el = document.getElementById(JSONLD_ID) as HTMLScriptElement | null;
  if (!data) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('script');
    el.id = JSONLD_ID;
    el.setAttribute('type', 'application/ld+json');
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export default function Seo({
  title,
  description = DEFAULT_DESC,
  canonical,
  image,
  type = 'website',
  noIndex = false,
  jsonLd,
}: SeoProps) {
  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} · ${SITE_NAME}`;
    const absoluteCanonical = toAbsolute(canonical);
    const absoluteImage = toAbsolute(image);

    document.title = fullTitle;
    setMeta('description', description);
    setMeta('og:title', fullTitle, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:type', type, 'property');
    setMeta('og:site_name', SITE_NAME, 'property');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    if (absoluteImage) {
      setMeta('og:image', absoluteImage, 'property');
      setMeta('twitter:image', absoluteImage);
    }
    if (absoluteCanonical) {
      setLink('canonical', absoluteCanonical);
      setMeta('og:url', absoluteCanonical, 'property');
    }
    setMeta('robots', noIndex ? 'noindex,nofollow' : 'index,follow');
    setJsonLd(jsonLd);
  }, [title, description, canonical, image, type, noIndex, jsonLd]);
  return null;
}
