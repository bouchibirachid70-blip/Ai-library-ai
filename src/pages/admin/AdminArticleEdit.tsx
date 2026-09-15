import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Save, Trash2 } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import type { Article } from '../../types';
import Seo from '../../components/Seo';
import Loader from '../../components/Loader';
import ErrorState from '../../components/ErrorState';
import { useToast } from '../../components/Toast';
import { slugify } from '../../lib/format';

type Mode = 'create' | 'edit';

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  author: string;
  published: boolean;
  tagsCsv: string;
}

const empty: FormState = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover_image: '',
  author: 'Aivora Team',
  published: false,
  tagsCsv: '',
};

export default function AdminArticleEdit() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const mode: Mode = id ? 'edit' : 'create';
  const [form, setForm] = useState<FormState>(empty);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (mode !== 'edit' || !id) return;
    let active = true;
    setLoading(true);
    setError(null);
    api
      .get<Article>(`/articles/${id}`)
      .then((a) => {
        if (!active) return;
        setForm({
          title: a.title,
          slug: a.slug,
          excerpt: a.excerpt || '',
          content: a.content,
          cover_image: a.cover_image || '',
          author: a.author,
          published: !!a.published,
          tagsCsv: (a.tags || []).join(', '),
        });
        setSlugTouched(true);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load article');
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id, mode]);

  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const tags = form.tagsCsv.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 30);
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        excerpt: form.excerpt.trim() || null,
        content: form.content.trim(),
        cover_image: form.cover_image.trim() || null,
        author: form.author.trim() || 'Aivora Team',
        published: form.published,
        tags,
      };
      if (mode === 'create') {
        const created = await api.post<Article>('/articles', payload);
        toast.push('Article created', 'success');
        navigate(`/admin/articles/${created.id}`, { replace: true });
      } else {
        await api.put<Article>(`/articles/${id}`, payload);
        toast.push('Article updated', 'success');
        navigate('/admin/articles');
      }
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!id) return;
    if (!confirm('Delete this article?')) return;
    try {
      await api.delete(`/articles/${id}`);
      toast.push('Article deleted', 'success');
      navigate('/admin/articles');
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : 'Delete failed', 'error');
    }
  };

  if (loading) {
    return (
      <div>
        <Seo title="Admin · Article" noIndex />
        <Loader label="Loading article…" />
      </div>
    );
  }

  return (
    <>
      <Seo title={`Admin · ${mode === 'create' ? 'New article' : 'Edit article'}`} noIndex />
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <Link to="/admin/articles" className="text-xs text-slate-400 hover:text-white">
            ← All articles
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {mode === 'create' ? 'New article' : 'Edit article'}
          </h1>
        </div>
        {mode === 'edit' && (
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 text-sm font-medium text-red-200 hover:bg-red-500/20"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        )}
      </div>
      {error && <ErrorState message={error} />}
      <form onSubmit={onSave} className="grid gap-5">
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Field label="Title" htmlFor="a-title">
              <input
                id="a-title"
                type="text"
                value={form.title}
                onChange={(e) => {
                  const v = e.target.value;
                  update({ title: v });
                  if (!slugTouched) update({ slug: slugify(v) });
                }}
                className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                required
                maxLength={200}
              />
            </Field>
            <Field label="Slug" htmlFor="a-slug" hint="URL identifier (a-z, 0-9, hyphens)">
              <input
                id="a-slug"
                type="text"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  update({ slug: slugify(e.target.value) });
                }}
                className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                required
                maxLength={200}
              />
            </Field>
            <Field label="Excerpt" htmlFor="a-excerpt" hint="Short summary for cards and meta description (max 500).">
              <textarea
                id="a-excerpt"
                value={form.excerpt}
                onChange={(e) => update({ excerpt: e.target.value })}
                rows={3}
                maxLength={500}
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              />
            </Field>
            <Field
              label="Content"
              htmlFor="a-content"
              hint="Markdown-lite: # headings, - lists, **bold**, *italic*, `code`, [link](https://…). All HTML is escaped."
            >
              <textarea
                id="a-content"
                value={form.content}
                onChange={(e) => update({ content: e.target.value })}
                rows={18}
                maxLength={50000}
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                required
              />
              <div className="mt-1 text-right text-xs text-slate-500">
                {form.content.length}/50000
              </div>
            </Field>
          </div>
          <div className="space-y-4">
            <Field label="Author" htmlFor="a-author">
              <input
                id="a-author"
                type="text"
                value={form.author}
                onChange={(e) => update({ author: e.target.value })}
                className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                maxLength={100}
              />
            </Field>
            <Field label="Cover image URL" htmlFor="a-cover" hint="Optional. https://…">
              <input
                id="a-cover"
                type="url"
                value={form.cover_image}
                onChange={(e) => update({ cover_image: e.target.value })}
                className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                maxLength={500}
              />
              {form.cover_image && /^https?:\/\//i.test(form.cover_image) && (
                <img
                  src={form.cover_image}
                  alt=""
                  className="mt-2 h-32 w-full rounded-lg object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
            </Field>
            <Field label="Tags" htmlFor="a-tags" hint="Comma-separated. Max 30.">
              <input
                id="a-tags"
                type="text"
                value={form.tagsCsv}
                onChange={(e) => update({ tagsCsv: e.target.value })}
                className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => update({ published: e.target.checked })}
                className="h-4 w-4 rounded border-white/20 bg-slate-950 text-indigo-500 focus:ring-indigo-500/30"
              />
              Published (visible to the public)
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-400 hover:to-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save article'}
          </button>
        </div>
      </form>
    </>
  );
}

function Field({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-white">
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
