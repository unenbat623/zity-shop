import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ChefHat, PackageCheck, Database, User } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useOrderStore } from '../store/useOrderStore';

export function BottomNav({ onOpenOdooModal }: { onOpenOdooModal?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { getTotalItems } = useCartStore();
  const { orders } = useOrderStore();

  const activeOrdersCount = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length;

  const navItems = [
    { path: '/', label: 'Эхлэл', icon: Home },
    { path: '/recipe-kits', label: 'Chef Орц', icon: ChefHat },
    { path: '/orders', label: 'Захиалгууд', icon: PackageCheck, badge: activeOrdersCount > 0 ? activeOrdersCount : undefined },
    { path: '/odoo-admin', label: 'Odoo ERP', icon: Database },
    { path: '/profile', label: 'Профайл', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-lg border-t border-border px-2 py-2 shadow-lg pb-safe">
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-all relative ${
                isActive
                  ? 'text-emerald-600 font-bold scale-105'
                  : 'text-text-muted hover:text-text-main font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? 'text-emerald-600' : ''}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
