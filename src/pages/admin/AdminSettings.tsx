import Seo from '../../components/Seo';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

export default function AdminSettings() {
  const { email, role } = useAdminAuth();
  return (
    <>
      <Seo title="Admin · Settings" noIndex />
      <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
      <p className="mt-1 text-sm text-slate-400">Your admin profile and account info.</p>
      <div className="mt-6 max-w-xl space-y-4">
        <Row label="Email" value={email || '—'} />
        <Row label="Role" value={role || 'admin'} />
        <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-5">
          <h2 className="text-sm font-semibold text-white">Adding a new admin</h2>
          <p className="mt-2 text-sm text-slate-400">
            New admin access is granted by inserting a row into{' '}
            <code className="rounded bg-white/5 px-1.5 py-0.5 text-[11px]">public.admin_users</code>{' '}
            with the user's Supabase Auth UUID and the role{' '}
            <code className="rounded bg-white/5 px-1.5 py-0.5 text-[11px]">admin</code>.
            The frontend then signs in with that user's email and password.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-slate-950 p-3 text-[11px] text-slate-300">
{`insert into public.admin_users (user_id, role)
values ('00000000-0000-0000-0000-000000000000', 'admin');`}
          </pre>
          <p className="mt-3 text-xs text-slate-500">
            Replace the UUID with the target user's id from{' '}
            <code className="rounded bg-white/5 px-1 py-0.5">auth.users</code>. The row in
            admin_users is checked server-side on every admin request — the client cannot
            grant itself admin powers.
          </p>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-slate-900/60 px-4 py-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <span className="truncate text-sm font-medium text-white">{value}</span>
    </div>
  );
}
