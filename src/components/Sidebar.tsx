import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight, Loader2, LogIn, LogOut, Moon, Sun, Wifi, WifiOff, X } from 'lucide-react';

import { ZityLogo } from './ui/ZityLogo';
import { isNavItemActive, visibleNavItems } from './navigation';
import { useAuthStore, useUserProfile } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { useOrderStore } from '../store/useOrderStore';
import { useCatalogStore } from '../store/useCatalogStore';
import { useThemeStore } from '../store/useThemeStore';
import { formatMnt, getInitials } from '../lib/format';

interface SidebarProps {
  /** Мобайл drawer нээлттэй эсэх (desktop дээр хамаарахгүй) */
  isOpen?: boolean;
  onClose?: () => void;
  /** `drawer` — мобайл дээр гарч ирдэг; `fixed` — desktop дээр байнга харагдана */
  variant?: 'drawer' | 'fixed';
}

/** Sidebar-ын дотоод агуулга — drawer болон fixed хоёул ижил зүйл харуулна */
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();

  const account = useAuthStore((state) => state.account);
  const isAdmin = useAuthStore((state) => state.isAdmin());
  const signOut = useAuthStore((state) => state.signOut);
  const profile = useUserProfile();

  const totalItems = useCartStore((state) => state.getTotalItems());
  const orders = useOrderStore((state) => state.orders);
  const connection = useCatalogStore((state) => state.connection);
  const { isDark, toggleTheme } = useThemeStore();

  const activeOrders = orders.filter(
    (order) =>
      order.userId === (account?.id ?? null) &&
      order.status !== 'delivered' &&
      order.status !== 'cancelled'
  ).length;

  const items = visibleNavItems({ isAdmin });
  const isChefLive = connection.status === 'live';

  const go = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  /** Тухайн цэсэнд харуулах тоо (badge) */
  const badgeFor = (path: string): number | undefined => {
    if (path === '/cart') return totalItems || undefined;
    if (path === '/orders') return activeOrders || undefined;
    return undefined;
  };

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <button onClick={() => go('/')} className="text-left" aria-label="Нүүр хуудас">
          <ZityLogo showTagline />
        </button>
      </div>

      {/* Хэрэглэгчийн карт */}
      <div className="px-3">
        {account ? (
          <button
            onClick={() => go('/profile')}
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface-hover p-3 text-left transition-colors hover:border-emerald-500/30"
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt=""
                className="h-10 w-10 shrink-0 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">
                {getInitials(profile.name)}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-extrabold text-text-main">
                {profile.name}
              </span>
              <span className="block truncate text-[10px] text-text-muted">{profile.email}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
          </button>
        ) : (
          <button onClick={() => go('/login')} className="zity-btn-primary w-full py-3 text-xs">
            <LogIn className="h-4 w-4" /> Нэвтрэх / бүртгүүлэх
          </button>
        )}
      </div>

      {/* Навигаци */}
      <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-3" aria-label="Хажуугийн цэс">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(item, location.pathname);
          const badge = badgeFor(item.path);

          return (
            <button
              key={item.path}
              onClick={() => go(item.path)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-text-muted hover:bg-surface-hover hover:text-text-main'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {badge !== undefined && (
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-600'
                  }`}
                >
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Доод хэсэг */}
      <div className="space-y-2 border-t border-border p-3">
        {account && (
          <div className="rounded-2xl border border-border bg-surface-hover p-3">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-text-muted">
              <span>Zity Points</span>
              <span className="text-emerald-600">{profile.zityPoints}</span>
            </div>
            {totalItems > 0 && (
              <button
                onClick={() => go('/cart')}
                className="mt-1 flex w-full items-center justify-between rounded-lg py-2 text-xs font-bold text-text-main hover:text-emerald-600"
              >
                <span>Сагсанд {totalItems} бараа</span>
                <span className="text-emerald-600">
                  {formatMnt(useCartStore.getState().getTotalPrice())}
                </span>
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="zity-btn-secondary flex-1 py-2.5 text-[11px]"
            aria-label={isDark ? 'Гэрэлтэй горим' : 'Харанхуй горим'}
          >
            {isDark ? (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-400" /> Гэрэлтэй
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5" /> Харанхуй
              </>
            )}
          </button>

          {account && (
            <button
              onClick={() => {
                void signOut();
                onNavigate?.();
              }}
              className="zity-btn-secondary px-3 py-2.5 text-[11px]"
              aria-label="Гарах"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Холболтын төлөв. "unknown/checking" нь "офлайн" гэсэн үг биш —
            хараахан шалгаагүй гэсэн үг тул тусад нь харуулна. */}
        <div
          className="flex items-center gap-1.5 px-1 text-[10px] font-bold text-text-subtle"
          title={connection.message}
        >
          {isChefLive ? (
            <Wifi className="h-3 w-3 text-emerald-500" />
          ) : connection.status === 'offline' ? (
            <WifiOff className="h-3 w-3 text-amber-500" />
          ) : (
            <Loader2 className="h-3 w-3 animate-spin text-text-subtle" />
          )}
          Chef backend:{' '}
          {isChefLive ? 'холбогдсон' : connection.status === 'offline' ? 'локал' : 'шалгаж байна'}
        </div>
      </div>
    </div>
  );
}

/** Desktop дээр байнга харагдах хажуугийн цэс */
export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 shrink-0 border-r border-border bg-surface lg:block">
      <SidebarContent />
    </aside>
  );
}

/** Мобайл/таблет дээр гарч ирдэг цэс */
export function SidebarDrawer({ isOpen = false, onClose }: SidebarProps) {
  // Drawer нээлттэй үед арын хуудсыг гүйлгэхгүй, Esc-ээр хаана
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative h-full w-72 max-w-[85vw] border-r border-border bg-surface shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Навигацийн цэс"
          >
            <button
              onClick={onClose}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-surface-hover text-text-muted transition-colors hover:text-text-main"
              aria-label="Цэсийг хаах"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent onNavigate={onClose} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
