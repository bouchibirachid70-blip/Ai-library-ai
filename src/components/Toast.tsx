import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

type Variant = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  variant: Variant;
}

interface ToastContextValue {
  push: (message: string, variant?: Variant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<Variant, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
  error: 'border-red-500/30 bg-red-500/10 text-red-100',
  info: 'border-sky-500/30 bg-sky-500/10 text-sky-100',
};

const VARIANT_ICON: Record<Variant, ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4" />,
  error: <AlertTriangle className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
};

let _toastSeq = 0;
function nextToastId(): string {
  // Prefer a cryptographically-secure UUID; fall back to a monotonic counter on
  // very old runtimes. Never use Math.random() for identifiers.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  _toastSeq += 1;
  return `toast-${Date.now().toString(36)}-${_toastSeq.toString(36)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, variant: Variant = 'info') => {
    const id = nextToastId();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  useEffect(() => {
    // Expose a tiny helper for non-React code (api error handlers) to use.
    (window as unknown as { aivoraToast?: ToastContextValue['push'] }).aivoraToast = push;
    return () => {
      delete (window as unknown as { aivoraToast?: unknown }).aivoraToast;
    };
  }, [push]);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto inline-flex max-w-md items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl shadow-slate-950/40 backdrop-blur-xl ${VARIANT_STYLES[t.variant]}`}
          >
            <span className="mt-0.5">{VARIANT_ICON[t.variant]}</span>
            <p className="text-sm">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="ml-2 text-current/70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
