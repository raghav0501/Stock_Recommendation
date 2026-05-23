import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────

type ToastType = 'error';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

// ── Context ────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

// ── Provider ───────────────────────────────────────────────────────

const MAX_TOASTS = 4;
const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'error') => {
    const id = ++counter.current;
    setToasts(prev => {
      const next = [...prev, { id, message, type }];
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
    });
    setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ── Container ──────────────────────────────────────────────────────

const STYLES: Record<ToastType, { wrapper: string; icon: string }> = {
  error: {
    wrapper: 'bg-dark-bg-elevated border-rose-500/40 text-rose-300',
    icon: 'text-rose-400',
  },
};

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map(toast => {
        const s = STYLES[toast.type];
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl max-w-sm w-full animate-fade-in ${s.wrapper}`}
          >
            <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${s.icon}`} />
            <p className="flex-1 text-sm leading-snug">{toast.message}</p>
            <button
              onClick={() => onDismiss(toast.id)}
              className="flex-shrink-0 p-0.5 rounded hover:opacity-70 transition-opacity"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
