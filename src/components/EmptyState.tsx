import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export default function EmptyState({ title, description, action, icon }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-slate-900/40 px-6 py-14 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-400 ring-1 ring-white/10">
        {icon ?? <Inbox className="h-5 w-5" />}
      </span>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {description && (
        <p className="max-w-md text-sm leading-6 text-slate-400">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
