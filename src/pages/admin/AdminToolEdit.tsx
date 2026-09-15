import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Save, Trash2 } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import type { Category, Tool } from '../../types';
import Seo from '../../components/Seo';
import Loader from '../../components/Loader';
import ErrorState from '../../components/ErrorState';
import { useToast } from '../../components/Toast';
import { useCategories } from '../../hooks/useCategories';
import { slugify } from '../../lib/format';
import { PRICING_OPTIONS } from '../../lib/constants';

type Mode = 'create' | 'edit';

interface FormState {
  name: string;
  slug: string;
  description: string;
  website_url: string;
  category_id: string;
  pricing: string;
  logo_url: string;
  rating: number;
  status: string;
  featured: boolean;
  tagsCsv: string;
}

const empty: FormState = {
  name: '',
  slug: '',
  description: '',
  website_url: '',
  category_id: '',
  pricing: 'Free',
  logo_url: '',
  rating: 0,
  status: 'pending',
  featured: false,
  tagsCsv: '',
};

export default function AdminToolEdit() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const mode: Mode = id ? 'edit' : 'create';
  const [form, setForm] = useState<FormState>(empty);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const { data: categories } = useCategories(false);

  useEffect(() => {
    if (mode !== 'edit' || !id) return;
    let active = true;
    setLoading(true);
    setError(null);
    api
      .get<Tool>(`/tools/${id}`)
      .then((t) => {
        if (!active) return;
        setForm({
          name: t.name,
          slug: t.slug,
          description: t.description,
          website_url: t.website_url,
          category_id: t.category_id || '',
          pricing: t.pricing,
          logo_url: t.logo_url || '',
          rating: t.rating || 0,
          status: t.status,
          featured: !!t.featured,
          tagsCsv: (t.tags || []).join(', '),
        });
        setSlugTouched(true);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load tool');
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
      const tags = form.tagsCsv
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 30);
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        website_url: form.website_url.trim(),
        category_id: form.category_id || null,
        pricing: form.pricing,
        logo_url: form.logo_url.trim() || null,
        rating: form.rating,
        status: form.status,
        featured: form.featured,
        tags,
      };
      if (mode === 'create') {
        const created = await api.post<Tool>('/tools', payload);
        toast.push('Tool created', 'success');
        navigate(`/admin/tools/${created.id}`, { replace: true });
      } else {
        await api.put<Tool>(`/tools/${id}`, payload);
        toast.push('Tool updated', 'success');
        navigate('/admin/tools');
      }
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!id) return;
    if (!confirm('Delete this tool? This cannot be undone.')) return;
    try {
      await api.delete(`/tools/${id}`);
      toast.push('Tool deleted', 'success');
      navigate('/admin/tools');
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : 'Delete failed', 'error');
    }
  };

  if (loading) {
    return (
      <div>
        <Seo title="Admin · Tool" noIndex />
        <Loader label="Loading tool…" />
      </div>
    );
  }

  return (
    <>
      <Seo title={`Admin · ${mode === 'create' ? 'New tool' : 'Edit tool'}`} noIndex />
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <Link to="/admin/tools" className="text-xs text-slate-400 hover:text-white">
            ← All tools
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {mode === 'create' ? 'New tool' : 'Edit tool'}
          </h1>
        </div>
        {mode === 'edit' && (
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 text-sm font-medium text-red-200 hover:bg-red-500/20"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        )}
      </div>
      {error && <ErrorState message={error} />}
      <form onSubmit={onSave} className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Field label="Name" htmlFor="t-name">
            <input
              id="t-name"
              type="text"
              value={form.name}
              onChange={(e) => {
                const v = e.target.value;
                update({ name: v });
                if (!slugTouched) update({ slug: slugify(v) });
              }}
              className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              required
              maxLength={100}
            />
          </Field>
          <Field label="Slug" htmlFor="t-slug" hint="URL identifier (a-z, 0-9, hyphens)">
            <input
              id="t-slug"
              type="text"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                update({ slug: slugify(e.target.value) });
              }}
              className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              required
              maxLength={100}
            />
          </Field>
          <Field label="Description" htmlFor="t-description">
            <textarea
              id="t-description"
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              rows={6}
              maxLength={2000}
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              required
            />
            <div className="mt-1 text-right text-xs text-slate-500">{form.description.length}/2000</div>
          </Field>
          <Field label="Tags" htmlFor="t-tags" hint="Comma-separated. Max 30.">
            <input
              id="t-tags"
              type="text"
              value={form.tagsCsv}
              onChange={(e) => update({ tagsCsv: e.target.value })}
              className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
            />
          </Field>
        </div>
        <div className="space-y-4">
          <Field label="Website URL" htmlFor="t-url">
            <input
              id="t-url"
              type="url"
              value={form.website_url}
              onChange={(e) => update({ website_url: e.target.value })}
              className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              required
              maxLength={500}
            />
          </Field>
          <Field label="Logo URL" htmlFor="t-logo">
            <input
              id="t-logo"
              type="url"
              value={form.logo_url}
              onChange={(e) => update({ logo_url: e.target.value })}
              className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              maxLength={500}
            />
          </Field>
          <Field label="Category" htmlFor="t-cat">
            <select
              id="t-cat"
              value={form.category_id}
              onChange={(e) => update({ category_id: e.target.value })}
              className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
            >
              <option value="">— None —</option>
              {categories.map((c: Category) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Pricing" htmlFor="t-pricing">
            <select
              id="t-pricing"
              value={form.pricing}
              onChange={(e) => update({ pricing: e.target.value })}
              className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
            >
              {PRICING_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Rating (0–5)" htmlFor="t-rating">
            <input
              id="t-rating"
              type="number"
              step="0.1"
              min={0}
              max={5}
              value={form.rating}
              onChange={(e) => update({ rating: Math.max(0, Math.min(5, Number(e.target.value) || 0)) })}
              className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
            />
          </Field>
          <Field label="Status" htmlFor="t-status">
            <select
              id="t-status"
              value={form.status}
              onChange={(e) => update({ status: e.target.value })}
              className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => update({ featured: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-slate-950 text-indigo-500 focus:ring-indigo-500/30"
            />
            Featured on the home page
          </label>
        </div>
        <div className="lg:col-span-3 flex justify-end gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-400 hover:to-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save tool'}
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
