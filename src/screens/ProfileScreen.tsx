import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { useAuthStore } from '../store/useAuthStore';
import { useOrderStore } from '../store/useOrderStore';
import { useOdooStore } from '../store/useOdooStore';
import {
  User,
  MapPin,
  Star,
  ChefHat,
  Database,
  PackageCheck,
  Phone,
  Mail,
  Plus,
  CheckCircle2,
  Settings,
  ArrowRight,
  Edit3,
  Trophy,
  ShoppingBag,
} from 'lucide-react';

export function ProfileScreen() {
  const navigate = useNavigate();
  const { user, selectedAddressIndex, setSelectedAddressIndex, toggleZityChefConnection } = useAuthStore();
  const { orders } = useOrderStore();
  const { config } = useOdooStore();

  const totalSpend = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;

  return (
    <div className="min-h-screen bg-background pb-28 text-text-main">
      <Header />

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Profile Header Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 p-6 text-white border border-emerald-500/20 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 text-3xl font-extrabold text-white shadow-lg">
              {user.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">{user.name}</h1>
              <div className="flex items-center gap-1 text-emerald-300 text-xs font-medium">
                <Mail className="h-3 w-3" /> {user.email}
              </div>
              <div className="flex items-center gap-1 text-emerald-300 text-xs font-medium mt-0.5">
                <Phone className="h-3 w-3" /> {user.phone}
              </div>
            </div>
          </div>

          {/* Zity Points Badge */}
          <div className="mt-4 flex items-center justify-between bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-wide">Zity Points</p>
                <p className="text-2xl font-extrabold text-white">{user.zityPoints.toLocaleString()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-emerald-200 uppercase">Нийт зарцуулсан</p>
              <p className="text-sm font-extrabold text-white">{totalSpend.toLocaleString()}₮</p>
            </div>
          </div>

          {/* Decorative */}
          <ChefHat className="absolute -right-6 -top-6 h-36 w-36 text-emerald-500/10 rotate-12 pointer-events-none" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: PackageCheck, label: 'Нийт Захиалга', value: orders.length },
            { icon: CheckCircle2, label: 'Хүргэгдсэн', value: deliveredOrders },
            { icon: Star, label: 'Zity Points', value: user.zityPoints },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-2xl bg-surface border border-border p-3 text-center shadow-xs">
              <Icon className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-lg font-extrabold text-text-main">{value}</p>
              <p className="text-[10px] text-text-muted font-bold">{label}</p>
            </div>
          ))}
        </div>

        {/* Zity Chef Integration Card */}
        <div
          className={`rounded-3xl p-4 border shadow-xs ${
            user.isZityChefConnected
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-surface border-border'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${
                  user.isZityChefConnected
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-surface-hover border-border text-text-muted'
                }`}
              >
                <ChefHat className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-text-main">Zity Chef Холболт</p>
                <p className="text-[10px] text-text-muted">
                  {user.isZityChefConnected
                    ? 'Холбогдсон — Zity Chef жорын дагуу бараа захиалах боломжтой'
                    : 'Холбоогүй байна — Зiti Chef-тэй холбогдоорой'}
                </p>
              </div>
            </div>

            <button
              onClick={toggleZityChefConnection}
              className={`rounded-full px-3 py-1.5 text-[11px] font-extrabold transition-all active:scale-95 ${
                user.isZityChefConnected
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-surface-hover border border-border text-text-main hover:bg-border'
              }`}
            >
              {user.isZityChefConnected ? 'Идэвхтэй' : 'Холбох'}
            </button>
          </div>
        </div>

        {/* Odoo Sync Status */}
        <div
          className="rounded-3xl bg-surface border border-border shadow-xs p-4 flex items-center justify-between cursor-pointer hover:border-emerald-500/30 transition-all"
          onClick={() => navigate('/odoo-admin')}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <Database className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-text-main">Odoo ERP Холболт</p>
              <p className="text-[10px] text-text-muted font-mono">{config.url}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${config.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <ArrowRight className="h-4 w-4 text-text-muted" />
          </div>
        </div>

        {/* Saved Addresses */}
        <div className="rounded-3xl bg-surface border border-border shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-xs font-extrabold text-text-main flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-500" /> Хадгалсан Хаягууд
            </h3>
            <button className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:underline">
              <Plus className="h-3.5 w-3.5" /> Нэмэх
            </button>
          </div>

          <div className="p-3 space-y-2">
            {user.addresses.map((addr, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedAddressIndex(idx)}
                className={`w-full flex items-start gap-3 rounded-2xl p-3 text-left border transition-all ${
                  idx === selectedAddressIndex
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-surface-hover border-border hover:border-emerald-500/20'
                }`}
              >
                <div
                  className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl shrink-0 ${
                    idx === selectedAddressIndex
                      ? 'bg-emerald-600 text-white'
                      : 'bg-border text-text-muted'
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-main">
                    {addr.district}, {addr.khoroo}
                  </p>
                  <p className="text-[11px] text-text-muted">{addr.streetBuilding}</p>
                  <p className="text-[10px] text-text-muted">{addr.entranceAppt}</p>
                  {addr.notes && (
                    <p className="text-[10px] text-emerald-600 font-medium mt-0.5">📝 {addr.notes}</p>
                  )}
                </div>
                {idx === selectedAddressIndex && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto mt-0.5 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Links */}
        <div className="rounded-3xl bg-surface border border-border shadow-xs overflow-hidden">
          {[
            { icon: PackageCheck, label: 'Захиалгын Түүх', path: '/orders', badge: orders.length },
            { icon: ShoppingBag, label: 'Хоолны Орц Багцууд', path: '/recipe-kits' },
            { icon: Database, label: 'Odoo ERP Удирдлага', path: '/odoo-admin' },
          ].map(({ icon: Icon, label, path, badge }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex w-full items-center justify-between p-4 border-b border-border last:border-0 hover:bg-surface-hover transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-bold text-text-main">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                {badge !== undefined && (
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600">
                    {badge}
                  </span>
                )}
                <ArrowRight className="h-4 w-4 text-text-muted" />
              </div>
            </button>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
