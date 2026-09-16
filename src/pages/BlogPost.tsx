import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Calendar, User as UserIcon } from 'lucide-react';
import Seo from '../components/Seo';
import AdSlot from '../components/AdSlot';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';
import { useArticle } from '../hooks/useArticles';
import { formatDate } from '../lib/format';
import { renderSafeContent } from '../lib/sanitize';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { data, loading, error } = useArticle(slug);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <Loader label="Loading article…" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <ErrorState
          title="Article not found"
          message={error || "We couldn't find that article."}
        />
        <div className="mt-6 text-center">
          <Link to="/blog" className="text-sm text-indigo-300 hover:text-indigo-200">
            ← Back to the blog
          </Link>
        </div>
      </div>
    );
  }

  const html = renderSafeContent(data.content);

  return (
    <>
      <Seo
        title={data.title}
        description={data.excerpt || data.title}
        canonical={`/blog/${data.slug}`}
        image={data.cover_image || undefined}
        type="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: data.title,
          description: data.excerpt || data.title,
          author: { '@type': 'Person', name: data.author },
          datePublished: data.created_at,
          dateModified: data.updated_at,
          ...(data.cover_image ? { image: data.cover_image } : {}),
          ...(typeof window !== 'undefined' ? { url: window.location.href } : {}),
        }}
      />
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" /> All articles
        </Link>
        {data.cover_image && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/5">
            <img
              src={data.cover_image}
              alt=""
              className="h-auto w-full"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        <header className="mt-8">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {data.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <UserIcon className="h-4 w-4" />
              {data.author}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(data.created_at)}
            </span>
          </div>
        </header>
        <div
          className="prose-invert mt-8 space-y-4 text-base leading-7 text-slate-200 [&_a]:text-indigo-300 [&_a:hover]:text-indigo-200 [&_blockquote]:border-l-2 [&_blockquote]:border-white/10 [&_blockquote]:pl-4 [&_blockquote]:text-slate-300 [&_code]:rounded [&_code]:bg-white/5 [&_code]:px-1.5 [&_code]:py-0.5 [&_h1]:mt-8 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-6 [&_li]:list-disc [&_p]:my-2 [&_strong]:font-semibold [&_strong]:text-white [&_ul]:my-2"
          // SAFE: renderSafeContent escapes all raw HTML and only emits a vetted
          // subset (p, h1–h6, ul/li, code, strong, em, br, a with http(s) href).
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <AdSlot position="blog_post_bottom" className="mt-10" />
      </article>
    </>
  );
}
