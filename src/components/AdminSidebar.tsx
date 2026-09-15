import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wrench,
  Tags,
  Inbox,
  Newspaper,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/tools', label: 'Tools', icon: Wrench },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/submissions', label: 'Submissions', icon: Inbox },
  { to: '/admin/articles', label: 'Articles', icon: Newspaper },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminSidebar() {
  const { signOut, email } = useAdminAuth();
  return (
    <aside className="hidden w-60 shrink-0 border-r border-white/5 bg-slate-950/40 lg:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <div className="flex h-16 items-center border-b border-white/5 px-5">
          <span className="text-sm font-semibold tracking-wide text-white">Admin</span>
        </div>
        <nav className="flex-1 space-y-1 p-3" aria-label="Admin">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/10 text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/5 p-3">
          <div className="truncate rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-400">
            Signed in as
            <div className="truncate text-sm font-medium text-white">
              {email || 'admin'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-300 hover:border-white/20 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
