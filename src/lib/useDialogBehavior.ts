import { RefObject, useCallback, useEffect } from 'react';

/**
 * Давхарга (dialog) бүрт хэрэгтэй нэг ижил зан төлөв.
 *
 * Modal, BottomSheet, sidebar drawer гурав нэг зүйлийг шаарддаг:
 *   - Esc товчоор хаагдах
 *   - арын хуудас гүйлгэгдэхгүй байх (scroll lock)
 *   - Tab дарахад focus давхаргын дотор эргэлдэх (focus trap)
 *   - хаагдахад focus өмнөх элемент рүү буцах
 *
 * Өмнө нь эдгээрийн зөвхөн `Modal` дээр бүрэн байсан — BottomSheet болон drawer
 * нээлттэй байхад Tab дарвал focus ард нуугдсан хуудас руу гарч, гарнаас удирддаг
 * хэрэглэгч хаана байгаагаа алддаг байв. Одоо гурвуулаа эндээс ижил зан төлөв авна.
 */

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusable(panel: HTMLElement | null): HTMLElement[] {
  if (!panel) return [];
  // `offsetParent === null` = нуугдсан элемент. Түүн рүү focus шилжүүлбэл
  // хэрэглэгчид юу ч харагдахгүй тул алгасна.
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.offsetParent !== null
  );
}

interface DialogBehaviorOptions {
  isOpen: boolean;
  onClose: () => void;
  /** Давхаргын гол хэсэг — focus энэ дотор баригдана */
  panelRef: RefObject<HTMLElement | null>;
  /** Нээгдэхэд дотоод эхний элемент рүү focus шилжүүлэх эсэх. Default: тийм */
  autoFocus?: boolean;
}

export function useDialogBehavior({
  isOpen,
  onClose,
  panelRef,
  autoFocus = true,
}: DialogBehaviorOptions): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = getFocusable(panelRef.current);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      // Focus давхаргаас гарахыг сэргийлж эхэн/сүүл рүү эргүүлнэ
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose, panelRef]
  );

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    /**
     * Focus-ыг нэг frame хүлээж шилжүүлнэ.
     *
     * Нээх анимац эхлэхэд элементүүд хараахан байрлаагүй байдаг — тэр агшинд
     * `offsetParent` нь `null` тул focus авах элемент "олдохгүй" өнгөрдөг.
     */
    const focusTimer = window.setTimeout(() => {
      if (!autoFocus) return;
      const panel = panelRef.current;
      const target = getFocusable(panel)[0] ?? panel;
      target?.focus();
    }, 50);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(focusTimer);
      previouslyFocused?.focus?.();
    };
  }, [isOpen, handleKeyDown, panelRef, autoFocus]);
}
