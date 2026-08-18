import React, { useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

import { useDialogBehavior } from '../../lib/useDialogBehavior';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Esc, scroll lock, focus trap, focus сэргээлт — Modal-той ижил зан төлөв
  useDialogBehavior({ isOpen, onClose, panelRef });

  return (
    <AnimatePresence>
      {isOpen && (
        /*
          Нэг stacking context дотор багтаана.
          Өмнө нь дэвсгэр z-40 байсан нь доод цэстэй (мөн z-40) тэнцүү тул
          DOM дараалалаар цэс дээр гарч, хуудасны гол товч болох "Сагсанд нэмэх"-ийг
          31px халхалдаг байв — мобайл дээр дарж чаддаггүй.
        */
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            aria-label={title || 'Дэлгэрэнгүй'}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-x-0 bottom-0 flex max-h-[90vh] flex-col rounded-t-3xl border-t border-border bg-surface shadow-xl outline-none"
          >
            <div className="flex w-full items-center justify-center pb-2 pt-3">
              <span className="h-1.5 w-12 rounded-full bg-border" />
            </div>

            <div className="flex items-center justify-between px-6 pb-4">
              <h2 className="text-xl font-bold text-text-main">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-full bg-surface-hover p-2 text-text-muted transition-colors hover:text-text-main"
                aria-label="Хаах"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/*
              Доод зай нь 2rem, iOS-ийн home indicator түүнээс өндөр бол түүнийг авна.
              (`pb-8 pb-safe` гэж хоёуланг нь бичвэл аль нь давамгайлах нь тодорхойгүй.)
            */}
            <div className="overflow-y-auto px-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
