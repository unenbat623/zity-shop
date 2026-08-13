import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { ZityChefService } from '../services/zityChefService';
import { FridgeItem } from '../types';
import { ChefHat, Database, RefreshCw, PackageOpen, Clock3, ArrowLeft, CheckCircle2 } from 'lucide-react';

export function FridgeScreen() {
  const navigate = useNavigate();
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  const loadFridge = async () => {
    setIsLoading(true);
    const result = await ZityChefService.fetchFridgeItems();
    setItems(result.items);
    setIsLive(result.isLive);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadFridge();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-28 text-text-main">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 text-white shadow-xl border border-emerald-500/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-extrabold text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                  <ChefHat className="h-4 w-4 text-emerald-400" /> Zity Chef Fridge
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">Хөргөгчийн орц бүртгэл</h1>
              <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed max-w-xl">
                Агуулах болон захиалгын дараа Zity Chef системд нэмэгдсэн шинэхэн орцуудыг энд харуулна.
              </p>
            </div>

            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-[11px] font-bold text-white border border-white/10 hover:bg-white/15"
            >
              <ArrowLeft className="h-4 w-4" /> Буцах
            </button>
          </div>
        </div>

        <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-3xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <Database className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-text-main">Zity Chef inventory sync</p>
              <p className="text-[10px] text-text-muted">
                {isLive ? 'Холболт амжилттай, live data синк хийж байна' : 'Local fallback mode'}
              </p>
            </div>
          </div>

          <button
            onClick={() => void loadFridge()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-emerald-700 active:scale-95"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Синк хийж байна...' : 'Одоо синк'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-3xl border border-border bg-surface p-4 shadow-xs animate-pulse">
                <div className="h-4 w-24 rounded bg-surface-hover mb-4" />
                <div className="h-10 w-full rounded bg-surface-hover mb-3" />
                <div className="h-4 w-28 rounded bg-surface-hover" />
              </div>
            ))
          ) : items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="rounded-3xl border border-border bg-surface p-4 shadow-xs hover:border-emerald-500/30 transition-all">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 text-xl">🥬</span>
                    <div>
                      <h2 className="text-sm font-extrabold text-text-main">{item.name}</h2>
                      <p className="text-[10px] font-bold text-emerald-600">{item.category}</p>
                    </div>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-text-muted">
                  <div className="rounded-2xl bg-surface-hover p-2.5 border border-border">
                    <div className="font-bold uppercase text-[9px] tracking-wide text-text-muted">Нөөц</div>
                    <div className="mt-1 text-sm font-extrabold text-text-main">{item.quantity} {item.unit}</div>
                  </div>
                  <div className="rounded-2xl bg-surface-hover p-2.5 border border-border">
                    <div className="font-bold uppercase text-[9px] tracking-wide text-text-muted">Дуусах</div>
                    <div className="mt-1 text-sm font-extrabold text-text-main">{item.expiryDays} хоног</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between rounded-2xl border border-border bg-surface-hover px-3 py-2 text-[10px] text-text-muted">
                  <span className="flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5 text-amber-500" />
                    {new Date(item.lastSyncedAt).toLocaleString('mn-MN', { timeStyle: 'short', dateStyle: 'short' })}
                  </span>
                  <span className="font-bold text-emerald-600">{item.source}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full rounded-3xl border border-dashed border-border bg-surface p-8 text-center text-text-muted">
              <PackageOpen className="mx-auto mb-3 h-8 w-8 text-emerald-500" />
              <p className="text-sm font-bold text-text-main">Хөргөгчийн мэдээлэл байхгүй байна.</p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
