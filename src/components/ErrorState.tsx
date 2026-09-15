import { AlertTriangle } from 'lucide-react';

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = 'Something went wrong',
  message = 'We had trouble loading this. Please try again.',
  onRetry,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-12 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-300 ring-1 ring-red-500/20">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="max-w-md text-sm leading-6 text-slate-400">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex items-center justify-center rounded-lg border border-white/10 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 hover:border-white/20 hover:text-white"
        >
          Retry
        </button>
      )}
    </div>
  );
}
