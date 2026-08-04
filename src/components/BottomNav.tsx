import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ChefHat, PackageCheck, Database, User } from 'lucide-react';
import { useOrderStore } from '../store/useOrderStore';

export function BottomNav({ onOpenOdooModal }: { onOpenOdooModal?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders } = useOrderStore();

  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled'
  ).length;

  const navItems = [
    { path: '/', label: 'Дэлгүүр', icon: Home },
    { path: '/recipe-kits', label: 'Chef Орц', icon: ChefHat },
    { path: '/orders', label: 'Захиалга', icon: PackageCheck, badge: activeOrdersCount > 0 ? activeOrdersCount : undefined },
    { path: '/odoo-admin', label: 'Odoo ERP', icon: Database },
    { path: '/profile', label: 'Профайл', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-border px-3 py-2 pb-safe shadow-2xl">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center w-14 py-1 rounded-2xl transition-all relative"
            >
              {/* Active pill indicator */}
              <div
                className={`flex items-center justify-center w-10 h-8 rounded-2xl mb-0.5 transition-all ${
                  isActive
                    ? 'bg-gradient-to-br from-indigo-600 to-emerald-600 shadow-md shadow-indigo-500/30'
                    : 'bg-transparent'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`h-5 w-5 transition-all ${
                      isActive ? 'text-white' : 'text-text-muted'
                    }`}
                  />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-white shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`text-[10px] tracking-tight transition-all font-bold ${
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
