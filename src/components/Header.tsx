import React from 'react';
import { Search, ShoppingCart, MapPin, Moon, Sun, ChefHat, Database, ChevronDown, UtensilsCrossed, PackageCheck, User } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useThemeStore } from '../store/useThemeStore';
import { useSearchStore } from '../store/useSearchStore';
import { useOdooStore } from '../store/useOdooStore';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, useLocation } from 'react-router-dom';

export function Header({ onOpenOdooModal }: { onOpenOdooModal?: () => void }) {
  const { getTotalItems } = useCartStore();
  const { isDark, toggleTheme } = useThemeStore();
  const { searchQuery, setSearchQuery } = useSearchStore();
  const { config } = useOdooStore();
  const { user, selectedAddressIndex } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const totalItems = getTotalItems();

  const currentAddress = user.addresses[selectedAddressIndex] || user.addresses[0];

  const navLinks = [
    { label: 'Дэлгүүр', path: '/', icon: UtensilsCrossed },
    { label: 'Хоолны Багцууд', path: '/recipe-kits', icon: ChefHat },
    { label: 'Захиалгууд', path: '/orders', icon: PackageCheck },
    { label: 'Odoo ERP', path: '/odoo-admin', icon: Database },
    { label: 'Профайл', path: '/profile', icon: User },
  ];

  return (
    <header className="sticky top-0 z-30 bg-surface/90 px-4 pt-3 pb-3 backdrop-blur-md border-b border-border shadow-xs">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Top Banner Row */}
        <div className="flex items-center justify-between gap-4">
          {/* Brand logo & tagline */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-500 text-white shadow-md shadow-purple-500/20 font-black text-xl shrink-0">
              Z
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-text-main">ZITY SHOP</span>
                <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-500 border border-purple-500/20">
                  CHEF ECOSYSTEM
                </span>
              </div>
              <p className="text-[11px] text-text-muted flex items-center gap-1 font-medium hidden sm:flex">
                <ChefHat className="h-3.5 w-3.5 text-purple-400" /> Zity Chef & Odoo ERP Unified Standard
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-surface-hover/80 p-1 rounded-2xl border border-border">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                      : 'text-text-muted hover:text-text-main hover:bg-surface'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Action icons */}
          <div className="flex items-center gap-2">
            {/* Odoo Status Badge */}
            <button
              onClick={onOpenOdooModal}
              className="hidden lg:flex items-center gap-1.5 rounded-full bg-surface-hover px-3 py-1.5 text-xs font-semibold text-text-main border border-border hover:bg-border transition-colors"
              title="Odoo ERP холболтын төлөв"
            >
              <Database className="h-3.5 w-3.5 text-emerald-500" />
              <span>Odoo</span>
              <span className={`h-2 w-2 rounded-full ${config.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-hover text-text-main transition-colors hover:bg-border border border-border shrink-0"
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
            </button>

            {/* Cart Icon */}
            <button
              onClick={() => navigate('/cart')}
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white transition-transform active:scale-95 shadow-md shadow-emerald-600/20 shrink-0"
            >
              <ShoppingCart className="h-4 w-4" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-slate-900 border-2 border-surface">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Address & Search Row (Flex responsive on tablet/desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
          {/* Address Quick Selector */}
          <div className="md:col-span-4 flex items-center justify-between gap-2 bg-surface-hover/70 rounded-xl px-3 py-2 border border-border text-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-text-main mr-1">{currentAddress.district}, {currentAddress.khoroo}:</span>
                <span className="text-text-muted truncate">{currentAddress.streetBuilding}</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="text-[11px] font-bold text-emerald-600 hover:underline shrink-0 flex items-center gap-0.5"
            >
              Солих <ChevronDown className="h-3 w-3" />
            </button>
          </div>

          {/* Search Input */}
          <div className="md:col-span-8 relative flex items-center w-full">
            <Search className="absolute left-3.5 h-4 w-4 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Бараа, хоолны орц, жор хайх..."
              className="h-10 w-full rounded-xl bg-surface-hover pl-10 pr-10 text-xs font-medium text-text-main outline-none transition-all focus:bg-surface focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 border border-border placeholder:text-text-muted"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-xs text-text-muted hover:text-text-main font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
