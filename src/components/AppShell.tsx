import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Sidebar, SidebarDrawer } from './Sidebar';

interface AppShellProps {
  children: ReactNode;
  /** Хайлтын мөр харуулах эсэх */
  showSearch?: boolean;
  /** Хуудсын гарчиг */
  title?: string;
  /** Агуулгын хамгийн их өргөн */
  maxWidth?: 'md' | 'lg' | 'xl' | 'full';
  /** Мобайл доод цэсийг нуух (checkout зэрэг төвлөрсөн урсгалд) */
  hideBottomNav?: boolean;
  /**
   * Заасан бол үндсэн header-ийн оронд "буцах" сумтай нарийн толгой гарна.
   * Сагс → төлбөр гэх мэт урсгалын хуудсанд ашиглана. `-1` бол түүхээр буцна.
   */
  backTo?: string | -1;
  /** Буцах толгойн баруун талд харагдах жижиг агуулга */
  headerRight?: ReactNode;
  /** Агуулгын доор наалдах самбар (жишээ нь мобайл "Захиалах" товч) */
  stickyFooter?: ReactNode;
}

const MAX_WIDTH_CLASS: Record<NonNullable<AppShellProps['maxWidth']>, string> = {
  md: 'max-w-2xl',
  lg: 'max-w-5xl',
  xl: 'max-w-7xl',
  full: 'max-w-none',
};

/**
 * Бүх хуудасны нэг бүрхүүл.
 *
 * Хуудас тус бүр Header/BottomNav-ыг өөрөө зурах шаардлагагүй — padding,
 * max-width, sidebar-ын зай, доод цэсийн зай бүх хуудсанд ижил байна.
 *
 * Дэлгэцийн хэмжээ:
 *   < lg  — Header (hamburger) + доод цэс + drawer
 *   ≥ lg  — зүүн талд байнгын sidebar, доод цэс байхгүй
 */
export function AppShell({
  children,
  showSearch = true,
  title,
  maxWidth = 'xl',
  hideBottomNav = false,
  backTo,
  headerRight,
  stickyFooter,
}: AppShellProps) {
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const goBack = () => {
    if (backTo === -1 || backTo === undefined) navigate(-1);
    else navigate(backTo);
  };

  /** Доод наалдмал самбар + доод цэсэнд зай гаргана */
  const bottomPadding = stickyFooter
    ? hideBottomNav
      ? 'pb-32 lg:pb-28'
      : 'pb-44 lg:pb-28'
    : hideBottomNav
      ? 'pb-12'
      : 'pb-28 lg:pb-12';

  return (
    <div className="min-h-screen bg-background text-text-main">
      <Sidebar />
      <SidebarDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <div className="lg:pl-64">
        {backTo !== undefined ? (
          <header className="sticky top-0 z-30 border-b border-border bg-surface/90 px-4 py-3 shadow-xs backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-1">
                <button
                  onClick={goBack}
                  className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-surface-hover hover:text-text-main"
                  aria-label="Буцах"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="truncate text-base font-extrabold text-text-main">{title}</h1>
              </div>
              {headerRight && <div className="shrink-0">{headerRight}</div>}
            </div>
          </header>
        ) : (
          <Header showSearch={showSearch} title={title} onOpenMenu={() => setIsDrawerOpen(true)} />
        )}

        <main className={`mx-auto ${MAX_WIDTH_CLASS[maxWidth]} px-4 pt-4 sm:px-6 ${bottomPadding}`}>
          {children}
        </main>
      </div>

      {stickyFooter && (
        <div
          className={`fixed inset-x-0 z-30 border-t border-border bg-surface/95 px-4 py-3 shadow-2xl backdrop-blur-md lg:left-64 ${
            hideBottomNav ? 'bottom-0 pb-safe' : 'bottom-[68px] lg:bottom-0 lg:pb-3'
          }`}
        >
          <div className={`mx-auto ${MAX_WIDTH_CLASS[maxWidth]}`}>{stickyFooter}</div>
        </div>
      )}

      {!hideBottomNav && <BottomNav />}
    </div>
  );
}
