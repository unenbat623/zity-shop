import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { ToastVariant, useToastStore } from '../../store/useToastStore';

const VARIANT_STYLE: Record<ToastVariant, { icon: typeof Info; ring: string; iconColor: string }> = {
  success: { icon: CheckCircle2, ring: 'border-emerald-500/40', iconColor: 'text-emerald-500' },
  error: { icon: XCircle, ring: 'border-red-500/40', iconColor: 'text-red-500' },
  warning: { icon: AlertTriangle, ring: 'border-amber-500/40', iconColor: 'text-amber-500' },
  info: { icon: Info, ring: 'border-border', iconColor: 'text-emerald-500' },
};

/** Дэлгэцийн доод/дээд буланд гарах мэдэгдлүүд */
export function ToastHost() {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6"
      role="status"
      aria-live="polite"
    >
      {toasts.map((item) => {
        const style = VARIANT_STYLE[item.variant];
        const Icon = style.icon;

        return (
          <div
            key={item.id}
            className={`animate-slide-up pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border bg-surface px-4 py-3 shadow-lg ${style.ring}`}
          >
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.iconColor}`} />
            <p className="flex-1 text-xs font-semibold leading-relaxed text-text-main">{item.message}</p>
            <button
              onClick={() => dismiss(item.id)}
              className="shrink-0 rounded-lg p-0.5 text-text-muted transition-colors hover:text-text-main"
              aria-label="Хаах"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
