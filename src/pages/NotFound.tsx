import { Link } from 'react-router-dom';
import Seo from '../components/Seo';

export default function NotFound() {
  return (
    <>
      <Seo title="Page not found" noIndex />
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-300">
          404
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          We couldn't find that page
        </h1>
        <p className="mt-3 text-base text-slate-400">
          The link may be broken or the resource may have been moved.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30"
          >
            Go home
          </Link>
          <Link
            to="/tools"
            className="rounded-xl border border-white/10 bg-slate-900/60 px-5 py-3 text-sm font-semibold text-slate-200 hover:border-white/20 hover:text-white"
          >
            Browse tools
          </Link>
        </div>
      </div>
    </>
  );
}
