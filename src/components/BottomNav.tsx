import { useLocation, useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';

import { isNavItemActive, NAV_ITEMS } from './navigation';
import { useOrderStore } from '../store/useOrderStore';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Мобайл доод навигаци (< lg). Desktop дээр sidebar нь үүнийг орлоно.
 * Цэсийн жагсаалт нь `navigation.ts`-ээс ирдэг тул sidebar-тай хэзээ ч зөрөхгүй.
 */
export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const account = useAuthStore((state) => state.account);
  const orders = useOrderStore((state) => state.orders);

  const activeOrdersCount = orders.filter(
    (order) =>
      order.userId === (account?.id ?? null) &&
      order.status !== 'delivered' &&
      order.status !== 'cancelled'
  ).length;

  // Доод цэсэнд 4 үндсэн зам + профайл/нэвтрэх = 5 таб
  const items = [
    ...NAV_ITEMS.filter((item) => item.inBottomNav),
    account
      ? { path: '/profile', label: 'Профайл', icon: User }
      : { path: '/login', label: 'Нэвтрэх', icon: User },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-xl lg:hidden"
      aria-label="Үндсэн цэс"
    >
      <div className="mx-auto flex max-w-md items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(item, location.pathname);
          const badge = item.path === '/orders' && activeOrdersCount > 0 ? activeOrdersCount : undefined;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex w-16 flex-col items-center justify-center rounded-2xl py-1"
            >
              <span
                className={`mb-0.5 flex h-8 w-11 items-center justify-center rounded-2xl transition-all ${
                  isActive ? 'bg-emerald-600 shadow-md shadow-emerald-600/25' : 'bg-transparent'
                }`}
              >
                <span className="relative">
                  <Icon className={`h-5 w-5 transition-all ${isActive ? 'text-white' : 'text-text-muted'}`} />
                  {badge !== undefined && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[9px] font-black text-slate-900">
                      {badge}
                    </span>
                  )}
                </span>
              </span>
              <span
                className={`text-[10px] font-bold leading-tight tracking-tight ${
                  isActive ? 'text-emerald-600' : 'text-text-muted'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
