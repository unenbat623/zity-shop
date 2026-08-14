import { ReactNode, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

/**
 * Бүх цонхны нэг суурь.
 *
 * Хангадаг зүйлс:
 *  - Esc товчоор хаах, backdrop дарж хаах
 *  - Арын хуудсыг гүйлгэхгүй болгох (scroll lock)
 *  - Focus trap: Tab дарахад focus цонхон дотор эргэлдэнэ
 *  - Цонх хаагдахад focus өмнөх элемент рүү буцна
 *  - Зөв ARIA шинжүүд (role=dialog, aria-modal, aria-labelledby)
 */

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Цонхны хамгийн их өргөн */
  size?: 'sm' | 'md' | 'lg';
  /** Backdrop дарахад хаагдах эсэх (жишээ нь төлбөр явж байхад хаахгүй) */
  closeOnBackdrop?: boolean;
  /** Хаах товчийг харуулах эсэх */
  showCloseButton?: boolean;
}

const SIZE_CLASS: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  showCloseButton = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2, 8)}`).current;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      // Focus цонхноос гарахыг сэргийлж эхэн/хамгийн сүүлийн элемент рүү эргүүлнэ
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    // Цонх нээгдэхэд дотрох эхний элемент рүү focus шилжүүлнэ
    const focusTimer = window.setTimeout(() => {
      const panel = panelRef.current;
      const target = panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel;
      target?.focus();
    }, 50);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(focusTimer);
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={closeOnBackdrop ? onClose : undefined}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            variants={{
              hidden: { opacity: 0, y: 16, scale: 0.98 },
              visible: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { type: 'spring', damping: 26, stiffness: 320 },
              },
              // Хаах нь нээхээс хурдан байх ёстой — хэрэглэгч хаах шийдвэрээ
              // аль хэдийн гаргасан тул хүлээлгэх нь удаашралтай мэдрэгддэг
              exiting: { opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.12 } },
            }}
            initial="hidden"
            animate="visible"
            exit="exiting"
            className={`relative flex max-h-[90vh] w-full ${SIZE_CLASS[size]} flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl outline-none`}
          >
            <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                {icon && (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
                    {icon}
                  </span>
                )}
                <div className="min-w-0">
                  <h2 id={titleId} className="truncate text-base font-bold text-text-main">
                    {title}
                  </h2>
                  {description && (
                    <p className="truncate text-xs text-text-muted">{description}</p>
                  )}
                </div>
              </div>

              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-hover text-text-muted transition-colors hover:bg-border hover:text-text-main"
                  aria-label="Хаах"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

            {footer && <div className="border-t border-border px-5 py-3">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
