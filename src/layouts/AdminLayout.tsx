import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import Logo from '../components/Logo';
import { Link } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <AdminSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <div className="flex h-16 items-center justify-between border-b border-white/5 px-4 sm:px-6 lg:px-8">
          <Logo size="sm" />
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <Link to="/" className="hover:text-white">
              ← Back to site
            </Link>
          </div>
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
