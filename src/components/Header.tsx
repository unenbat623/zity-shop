import { ChevronDown, LogIn, MapPin, Menu, Moon, Search, ShoppingCart, Sun, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { ZityMark } from './ui/ZityLogo';
import { useCartStore } from '../store/useCartStore';
import { useThemeStore } from '../store/useThemeStore';
import { useSearchStore } from '../store/useSearchStore';
import { useAuthStore } from '../store/useAuthStore';
import { getInitials } from '../lib/format';

interface HeaderProps {
  /** Хайлтын мөр харуулах эсэх — зөвхөн каталогтой хуудсанд хэрэгтэй */
  showSearch?: boolean;
  /** Мобайл дээр хажуугийн цэс нээх */
  onOpenMenu?: () => void;
  /** Хуудсын гарчиг — каталоггүй хуудсанд лого дээр нэмж харуулна */
  title?: string;
}

export function Header({ showSearch = true, onOpenMenu, title }: HeaderProps) {
  const navigate = useNavigate();

  const totalItems = useCartStore((state) => state.getTotalItems());
  const { isDark, toggleTheme } = useThemeStore();
  const { searchQuery, setSearchQuery } = useSearchStore();

  const account = useAuthStore((state) => state.account);
  const selectedAddress = useAuthStore((state) => state.getSelectedAddress());

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/90 px-4 pb-3 pt-3 shadow-xs backdrop-blur-md">
      <div className="mx-auto max-w-7xl space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {/* Хажуугийн цэс — зөвхөн мобайл/таблет */}
            <button
              onClick={onOpenMenu}
              className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-surface-hover hover:text-text-main lg:hidden"
              aria-label="Цэс нээх"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Лого: desktop дээр sidebar-т байгаа тул зөвхөн мобайл дээр */}
            <button
              onClick={() => navigate('/')}
              className="flex min-w-0 items-center gap-2 text-left lg:hidden"
              aria-label="Нүүр хуудас"
            >
              <ZityMark className="h-9 w-9 shrink-0" />
              <span className="hidden min-w-0 sm:block">
                <span className="flex items-center gap-1">
                  <span className="text-sm font-extrabold tracking-tight text-text-main">ZITY</span>
                  <span className="text-sm font-extrabold tracking-tight text-emerald-600">SHOP</span>
                </span>
              </span>
            </button>

            {/* Desktop дээр хуудсын гарчиг — лого нь sidebar дээр байгаа тул давхардуулахгүй */}
            {title && (
              <h1 className="hidden truncate text-lg font-extrabold text-text-main lg:block">{title}</h1>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-hover text-text-main transition-colors hover:bg-border"
              aria-label={isDark ? 'Гэрэлтэй горим руу шилжих' : 'Харанхуй горим руу шилжих'}
              title={isDark ? 'Гэрэлтэй горим' : 'Харанхуй горим'}
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              onClick={() => navigate(account ? '/profile' : '/login')}
              className="hidden h-9 items-center gap-2 rounded-full border border-border bg-surface-hover px-2 text-text-main transition-colors hover:bg-border sm:flex"
              title={account ? account.name : 'Нэвтрэх / бүртгүүлэх'}
            >
              {account ? (
                <>
                  {account.avatarUrl ? (
                    <img
                      src={account.avatarUrl}
                      alt=""
                      className="h-7 w-7 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-black text-white">
                      {getInitials(account.name)}
                    </span>
                  )}
                  <span className="max-w-[90px] truncate pr-1 text-xs font-bold">{account.name}</span>
                </>
              ) : (
                <>
                  <LogIn className="ml-1.5 h-4 w-4 text-emerald-600" />
                  <span className="pr-2 text-xs font-bold">Нэвтрэх</span>
                </>
              )}
            </button>

            <button
              onClick={() => navigate('/cart')}
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md shadow-emerald-600/20 transition-transform active:scale-95"
              aria-label={`Сагс${totalItems > 0 ? ` (${totalItems} бараа)` : ''}`}
            >
              <ShoppingCart className="h-4 w-4" />
              {totalItems > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-surface bg-amber-400 px-1 text-[10px] font-black text-slate-900">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Хаяг + хайлт */}
        {showSearch && (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
            <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface-hover/70 px-3 py-2 text-xs md:col-span-4">
              <div className="flex min-w-0 items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-emerald-500" />
                {selectedAddress ? (
                  <span className="truncate">
                    <span className="mr-1 font-semibold text-text-main">
                      {selectedAddress.district}, {selectedAddress.khoroo}
                    </span>
                    <span className="text-text-muted">{selectedAddress.streetBuilding}</span>
                  </span>
                ) : (
                  <span className="truncate text-text-muted">
                    {account ? 'Хүргэлтийн хаяг нэмээгүй байна' : 'Нэвтрээд хаягаа хадгална уу'}
                  </span>
                )}
              </div>
              <button
                onClick={() => navigate(account ? '/profile' : '/login')}
                className="flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-emerald-600 hover:underline"
              >
                {selectedAddress ? 'Солих' : 'Нэмэх'} <ChevronDown className="h-3 w-3" />
              </button>
            </div>

            <div className="relative flex w-full items-center md:col-span-8">
              <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-text-subtle" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Бараа, хоолны орц, жор хайх..."
                aria-label="Хайлт"
                className="h-10 w-full rounded-xl border border-border bg-surface-hover pl-10 pr-10 text-xs font-medium text-text-main outline-none transition-all placeholder:text-text-subtle focus:border-emerald-500 focus:bg-surface focus:ring-2 focus:ring-emerald-500/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-text-muted transition-colors hover:text-text-main"
                  aria-label="Хайлт цэвэрлэх"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
