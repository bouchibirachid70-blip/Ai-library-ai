import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-white/5 bg-slate-950/50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-400">
            Aivora is a curated directory of AI tools. Discover, compare, and
            launch the tools that move your work forward — from writing and
            design to engineering and research.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Directory</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-400">
            <li><Link className="hover:text-white" to="/tools">All tools</Link></li>
            <li><Link className="hover:text-white" to="/categories">Categories</Link></li>
            <li><Link className="hover:text-white" to="/top-tools">Top tools</Link></li>
            <li><Link className="hover:text-white" to="/blog">Blog</Link></li>
            <li><Link className="hover:text-white" to="/submit">Submit a tool</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Company</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-400">
            <li><Link className="hover:text-white" to="/contact">Contact</Link></li>
            <li><Link className="hover:text-white" to="/privacy">Privacy</Link></li>
            <li><Link className="hover:text-white" to="/terms">Terms</Link></li>
            <li><Link className="hover:text-white" to="/admin/login">Admin</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p>© {year} Aivora. All rights reserved.</p>
          <p>Built with care for the AI community.</p>
        </div>
      </div>
    </footer>
  );
}
