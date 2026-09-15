import { Loader2 } from 'lucide-react';

export default function Loader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-400">
      <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
