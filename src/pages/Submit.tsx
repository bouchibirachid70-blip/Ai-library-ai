import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, CheckCircle2 } from 'lucide-react';
import Seo from '../components/Seo';
import PageHeader from '../components/PageHeader';
import { api, ApiError } from '../lib/api';
import { useCategories } from '../hooks/useCategories';
import { useToast } from '../components/Toast';

export default function Submit() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: categories } = useCategories(false);

  const [toolName, setToolName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [description, setDescription] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!toolName.trim()) next.toolName = 'Required';
    if (!websiteUrl.trim()) next.websiteUrl = 'Required';
    else if (!/^https?:\/\//i.test(websiteUrl.trim()))
      next.websiteUrl = 'Must start with http:// or https://';
    if (!description.trim() || description.trim().length < 10)
      next.description = 'Please write at least 10 characters.';
    if (!submitterEmail.trim()) next.submitterEmail = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitterEmail.trim()))
      next.submitterEmail = 'Invalid email';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.post('/submissions', {
        tool_name: toolName.trim(),
        website_url: websiteUrl.trim(),
        description: description.trim(),
        submitter_email: submitterEmail.trim(),
        category_id: categoryId || null,
      });
      setDone(true);
      toast.push('Submission received. We will review it shortly.', 'success');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Submission failed.';
      toast.push(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <>
        <Seo title="Submit a tool — submitted" noIndex />
        <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/5 bg-slate-900/60 p-10 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <h1 className="text-2xl font-bold text-white">Thanks for submitting</h1>
            <p className="max-w-md text-sm text-slate-400">
              Our editors will review your submission and publish it if it meets
              our quality bar. You'll hear back at the email you provided.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/tools')}
                className="rounded-lg border border-white/10 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 hover:border-white/20 hover:text-white"
              >
                Browse tools
              </button>
              <button
                type="button"
                onClick={() => {
                  setDone(false);
                  setToolName('');
                  setWebsiteUrl('');
                  setDescription('');
                  setSubmitterEmail('');
                  setCategoryId('');
                }}
                className="rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30"
              >
                Submit another
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Seo
        title="Submit a tool"
        description="Suggest an AI tool for the Aivora directory. Our editors review every submission."
        canonical="/submit"
      />
      <PageHeader
        eyebrow="Contribute"
        title="Submit a tool"
        description="Found an AI tool that should be in the directory? Tell us about it and we'll review it."
      />
      <form
        onSubmit={onSubmit}
        className="mx-auto grid max-w-3xl gap-5 px-4 pb-20 sm:px-6 lg:px-8"
      >
        <Field label="Tool name" error={errors.toolName} htmlFor="tool-name">
          <input
            id="tool-name"
            type="text"
            value={toolName}
            onChange={(e) => setToolName(e.target.value)}
            maxLength={100}
            className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
            placeholder="e.g. Aivora Writer"
          />
        </Field>
        <Field label="Website URL" error={errors.websiteUrl} htmlFor="tool-url">
          <input
            id="tool-url"
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            maxLength={500}
            placeholder="https://example.com"
            className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
          />
        </Field>
        <Field label="Category" htmlFor="tool-category">
          <select
            id="tool-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Description"
          error={errors.description}
          htmlFor="tool-description"
          hint="What does it do? Who is it for? (10–2000 chars)"
        >
          <textarea
            id="tool-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={5}
            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
            placeholder="A short, honest description of the tool…"
          />
          <div className="mt-1 text-right text-xs text-slate-500">
            {description.length}/2000
          </div>
        </Field>
        <Field label="Your email" error={errors.submitterEmail} htmlFor="tool-email">
          <input
            id="tool-email"
            type="email"
            value={submitterEmail}
            onChange={(e) => setSubmitterEmail(e.target.value)}
            maxLength={254}
            className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
            placeholder="you@example.com"
          />
        </Field>
        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-xs text-slate-500">
            Submissions are reviewed manually. We never share your email publicly.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-400 hover:to-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {submitting ? 'Submitting…' : 'Submit tool'}
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
  error,
  hint,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-white">
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p className="mt-1 text-xs text-red-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
