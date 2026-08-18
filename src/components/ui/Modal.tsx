import { ReactNode, useId, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

import { useDialogBehavior } from '../../lib/useDialogBehavior';

/**
 * Бүх цонхны нэг суурь.
 *
 * Esc, scroll lock, focus trap, focus сэргээлт нь `useDialogBehavior`-оос ирнэ —
 * BottomSheet, drawer-тай яг ижил зан төлөвтэй байхын тулд.
 * Энд зөвхөн харагдац болон ARIA шинжүүд.
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
  const titleId = useId();

  useDialogBehavior({ isOpen, onClose, panelRef });

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
