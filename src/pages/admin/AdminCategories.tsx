import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import type { Category } from '../../types';
import Seo from '../../components/Seo';
import Loader from '../../components/Loader';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import { slugify } from '../../lib/format';
import { useCategories } from '../../hooks/useCategories';

interface FormState {
  name: string;
  slug: string;
  icon: string;
  description: string;
}

const empty: FormState = { name: '', slug: '', icon: '', description: '' };

export default function AdminCategories() {
  const { data, loading, error, refetch } = useCategories(true);
  const toast = useToast();
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        slug: editing.slug,
        icon: editing.icon || '',
        description: editing.description || '',
      });
      setSlugTouched(true);
      setShowForm(true);
    }
  }, [editing]);

  const onCreate = () => {
    setEditing(null);
    setForm(empty);
    setSlugTouched(false);
    setShowForm(true);
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {
      toast.push('Name and slug are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        icon: form.icon.trim() || null,
        description: form.description.trim() || null,
      };
      if (editing) {
        await api.put<Category>(`/categories/${editing.id}`, payload);
        toast.push('Category updated', 'success');
      } else {
        await api.post<Category>('/categories', payload);
        toast.push('Category created', 'success');
      }
      setShowForm(false);
      setEditing(null);
      refetch();
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (c: Category) => {
    if (!confirm(`Delete "${c.name}"? Tools in this category will become uncategorized.`)) return;
    try {
      await api.delete(`/categories/${c.id}`);
      toast.push('Category deleted', 'success');
      refetch();
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : 'Delete failed', 'error');
    }
  };

  return (
    <>
      <Seo title="Admin · Categories" noIndex />
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Categories</h1>
          <p className="mt-1 text-sm text-slate-400">Organize the directory.</p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-400 hover:to-violet-400"
        >
          <Plus className="h-4 w-4" /> New category
        </button>
      </div>
      {showForm && (
        <form onSubmit={onSave} className="mb-8 grid gap-4 rounded-2xl border border-white/5 bg-slate-900/60 p-5 sm:grid-cols-2">
          <div>
            <label htmlFor="cat-name" className="block text-sm font-medium text-white">Name</label>
            <input
              id="cat-name"
              type="text"
              value={form.name}
              onChange={(e) => {
                const v = e.target.value;
                setForm((f) => ({ ...f, name: v }));
                if (!slugTouched) setForm((f) => ({ ...f, slug: slugify(v) }));
              }}
              className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              required
              maxLength={80}
            />
          </div>
          <div>
            <label htmlFor="cat-slug" className="block text-sm font-medium text-white">Slug</label>
            <input
              id="cat-slug"
              type="text"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((f) => ({ ...f, slug: slugify(e.target.value) }));
              }}
              className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              required
              maxLength={80}
            />
          </div>
          <div>
            <label htmlFor="cat-icon" className="block text-sm font-medium text-white">Icon name</label>
            <input
              id="cat-icon"
              type="text"
              value={form.icon}
              onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
              className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              placeholder="e.g. Code, PenTool, Image"
              maxLength={60}
            />
            <p className="mt-1 text-xs text-slate-500">Lucide icon name (PascalCase).</p>
          </div>
          <div>
            <label htmlFor="cat-desc" className="block text-sm font-medium text-white">Description</label>
            <textarea
              id="cat-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              maxLength={500}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
            />
          </div>
          <div className="sm:col-span-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
              }}
              className="h-10 rounded-lg border border-white/10 bg-slate-900/60 px-4 text-sm font-medium text-slate-200 hover:border-white/20 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : editing ? 'Update category' : 'Create category'}
            </button>
          </div>
        </form>
      )}
      {loading && <Loader label="Loading categories…" />}
      {!loading && error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && data.length === 0 && (
        <EmptyState
          title="No categories yet"
          description="Add your first category to organize the directory."
          action={
            <button
              type="button"
              onClick={onCreate}
              className="rounded-lg border border-white/10 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 hover:border-white/20 hover:text-white"
            >
              Add category
            </button>
          }
        />
      )}
      {!loading && !error && data.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-white/5">
          <table className="min-w-full divide-y divide-white/5 text-sm">
            <thead className="bg-slate-900/60 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Tools</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.map((c) => (
                <tr key={c.id} className="bg-slate-950/40">
                  <td className="px-4 py-3 text-white">{c.name}</td>
                  <td className="px-4 py-3 text-slate-300">{c.slug}</td>
                  <td className="px-4 py-3 text-slate-300">
                    {(c as Category & { tools_count?: number }).tools_count ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(c)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/20 hover:text-white"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(c)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-slate-900/60 text-red-300 hover:border-red-500/40 hover:text-red-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
