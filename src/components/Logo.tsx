import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  to?: string;
  className?: string;
}

export default function Logo({ size = 'md', to = '/', className = '' }: LogoProps) {
  const dims = size === 'lg' ? 'h-10 w-10' : size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';
  const text =
    size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-lg';
  const inner = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`relative inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 ${dims}`}
      >
        <Sparkles className="h-1/2 w-1/2 text-white" strokeWidth={2.5} />
        <span className="absolute -inset-1 -z-10 rounded-2xl bg-gradient-to-br from-indigo-500/30 via-violet-500/30 to-fuchsia-500/30 blur-md" />
      </span>
      <span className={`font-semibold tracking-tight text-white ${text}`}>
        Aivora
      </span>
    </span>
  );
  if (to) {
    return (
      <Link to={to} className="inline-flex items-center" aria-label="Aivora home">
        {inner}
      </Link>
    );
  }
  return inner;
}
