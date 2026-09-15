import { useState } from 'react';
import { Mail, MessageSquare, Send } from 'lucide-react';
import Seo from '../components/Seo';
import PageHeader from '../components/PageHeader';
import { api, ApiError } from '../lib/api';
import { useToast } from '../components/Toast';

export default function Contact() {
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Required';
    if (!email.trim()) next.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = 'Invalid email';
    if (!message.trim() || message.trim().length < 10) next.message = 'Tell us a bit more.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.post('/contact', {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim() || null,
        message: message.trim(),
      });
      toast.push('Message sent. We will get back to you soon.', 'success');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : 'Could not send message', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Seo
        title="Contact"
        description="Get in touch with the Aivora team."
        canonical="/contact"
      />
      <PageHeader
        eyebrow="Get in touch"
        title="Contact"
        description="Press, partnerships, bug reports — we read every message."
      />
      <div className="mx-auto grid max-w-5xl gap-8 px-4 pb-20 sm:px-6 lg:px-8 lg:grid-cols-3">
        <aside className="space-y-3 text-sm text-slate-400 lg:col-span-1">
          <Info
            icon={<Mail className="h-4 w-4" />}
            title="Email"
            value="hello@aivora.io"
          />
          <Info
            icon={<MessageSquare className="h-4 w-4" />}
            title="Response time"
            value="Usually within 2 business days"
          />
        </aside>
        <form onSubmit={onSubmit} className="grid gap-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={errors.name} htmlFor="c-name">
              <input
                id="c-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                placeholder="Your name"
              />
            </Field>
            <Field label="Email" error={errors.email} htmlFor="c-email">
              <input
                id="c-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={254}
                className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                placeholder="you@example.com"
              />
            </Field>
          </div>
          <Field label="Subject" htmlFor="c-subject">
            <input
              id="c-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              placeholder="What is this about?"
            />
          </Field>
          <Field label="Message" error={errors.message} htmlFor="c-message">
            <textarea
              id="c-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={4000}
              rows={6}
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              placeholder="Tell us what's on your mind…"
            />
            <div className="mt-1 text-right text-xs text-slate-500">
              {message.length}/4000
            </div>
          </Field>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-400 hover:to-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Sending…' : 'Send message'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function Field({
  label,
  htmlFor,
  children,
  error,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-white">
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {error && (
        <p className="mt-1 text-xs text-red-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function Info({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-slate-900/40 p-4">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-indigo-300 ring-1 ring-white/10">
        {icon}
      </span>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {title}
        </div>
        <div className="text-sm text-white">{value}</div>
      </div>
    </div>
  );
}
