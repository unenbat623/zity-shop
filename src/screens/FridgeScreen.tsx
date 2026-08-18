import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ChefHat,
  Clock3,
  Database,
  Minus,
  PackageOpen,
  Plus,
  Trash2,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';

import { AppShell } from '../components/AppShell';
import { Skeleton } from '../components/ui/Skeleton';
import { useCatalogStore } from '../store/useCatalogStore';
import { useToastStore } from '../store/useToastStore';
import { FridgeItem } from '../types';
import { formatDateTime } from '../lib/format';

/** Энэ хоногоос бага үлдсэн орцыг анхааруулж харуулна */
const EXPIRY_WARNING_DAYS = 3;

function expiryTone(days: number): { className: string; label: string } {
  if (days <= 0) return { className: 'text-red-500', label: 'Хугацаа дууссан' };
  if (days <= EXPIRY_WARNING_DAYS) return { className: 'text-amber-500', label: `${days} хоног` };
  return { className: 'text-text-main', label: `${days} хоног` };
}

export function FridgeScreen() {
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.show);

  const { fridgeItems, isLoadingFridge, connection, loadFridge } = useCatalogStore();

  useEffect(() => {
    void loadFridge();
  }, [loadFridge]);

  const handleRefresh = async () => {
    await loadFridge({ force: true });
    showToast('Хөргөгчийн мэдээлэл шинэчлэгдлээ.', 'success');
  };

  const isLive = connection.status === 'live';
  const expiringSoon = fridgeItems.filter((item) => item.expiryDays <= EXPIRY_WARNING_DAYS).length;

  return (
    <AppShell showSearch={false} title="Zity Chef хөргөгч" maxWidth="lg">
        <section className="zity-brand-surface mb-6 overflow-hidden rounded-3xl p-6 shadow-xl">
          {/* Нарийн дэлгэцэнд гарчиг, товч хоёр шахцалдахгүйн тулд босоо байрлана */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3 py-1 text-xs font-extrabold text-emerald-200">
                <ChefHat className="h-4 w-4" /> Zity Chef хөргөгч
              </span>
              <h1 className="mb-2 text-2xl font-black text-white sm:text-3xl">Хөргөгчийн орц бүртгэл</h1>
              <p className="max-w-xl text-xs leading-relaxed text-emerald-100/80 sm:text-sm">
                Захиалсан бараа Zity Chef хөргөгчид автоматаар нэмэгдэж, жор бэлтгэхэд ашиглагдана.
              </p>
            </div>

            <button
              onClick={() => navigate(-1)}
              className="inline-flex w-fit shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" /> Буцах
            </button>
          </div>
        </section>

        <div className="zity-card mb-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
              <Database className="h-5 w-5 text-emerald-500" />
            </span>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-extrabold text-text-main">
                Inventory sync
                {isLive ? (
                  <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5 text-amber-500" />
                )}
              </p>
              <p className="text-[10px] leading-relaxed text-text-muted">{connection.message}</p>
            </div>
          </div>

          <button
            onClick={() => void handleRefresh()}
            disabled={isLoadingFridge}
            className="zity-btn-primary shrink-0 px-4 py-2.5 text-xs"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingFridge ? 'animate-spin' : ''}`} />
            {isLoadingFridge ? 'Синк хийж байна...' : 'Одоо синк'}
          </button>
        </div>

        {expiringSoon > 0 && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] font-bold text-amber-600">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {expiringSoon} орцны хадгалах хугацаа дуусах дөхөж байна.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {isLoadingFridge && fridgeItems.length === 0 ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="zity-card space-y-3 p-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))
          ) : fridgeItems.length > 0 ? (
            fridgeItems.map((item) => <FridgeCard key={item.id} item={item} />)
          ) : (
            <div className="col-span-full rounded-3xl border border-dashed border-border bg-surface p-10 text-center">
              <PackageOpen className="mx-auto mb-3 h-8 w-8 text-emerald-500" />
              <p className="text-sm font-bold text-text-main">Хөргөгч хоосон байна.</p>
              <p className="mt-1 text-xs text-text-muted">
                Захиалга хийсний дараа орцууд энд автоматаар нэмэгдэнэ.
              </p>
              <button onClick={() => navigate('/')} className="zity-btn-primary mx-auto mt-4 px-5 py-2.5 text-xs">
                Дэлгүүр хэсэх
              </button>
            </div>
          )}
        </div>
      </AppShell>
  );
}

function FridgeCard({ item }: { item: FridgeItem }) {
  const expiry = expiryTone(item.expiryDays);
  const showToast = useToastStore((state) => state.show);
  const { updateFridgeQuantity, removeFridgeItem } = useCatalogStore();
  const [isBusy, setIsBusy] = useState(false);

  const changeQuantity = async (delta: number) => {
    if (isBusy) return;
    setIsBusy(true);
    const result = await updateFridgeQuantity(item.id, Math.round((item.quantity + delta) * 100) / 100);
    setIsBusy(false);
    if (!result.ok) showToast(result.message, 'warning');
  };

  const handleRemove = async () => {
    if (isBusy) return;
    setIsBusy(true);
    const result = await removeFridgeItem(item.id);
    setIsBusy(false);
    showToast(result.message, result.ok ? 'info' : 'warning');
  };

  /** 1 ширхэг/литрээс жижиг нэгжийг илүү нарийн алхамаар өөрчилнө */
  const step = item.unit === 'гр' || item.unit === 'g' ? 100 : 1;

  return (
    <article className="zity-card p-4 transition-all hover:border-emerald-500/30">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-xl">
            {item.emoji || '🥬'}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-extrabold text-text-main">{item.name}</h2>
            <p className="truncate text-[10px] font-bold text-emerald-600">{item.category}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {item.expiryDays <= EXPIRY_WARNING_DAYS && (
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          )}
          <button
            onClick={() => void handleRemove()}
            disabled={isBusy}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-hover hover:text-red-500 disabled:opacity-40"
            aria-label={`${item.name} хөргөгчөөс хасах`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-2xl border border-border bg-surface-hover p-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wide text-text-muted">Нөөц</div>
          <div className="mt-1 flex items-center justify-between gap-1">
            <span className="text-sm font-extrabold text-text-main">
              {item.quantity} {item.unit}
            </span>
            <span className="flex items-center gap-1">
              <button
                onClick={() => void changeQuantity(-step)}
                disabled={isBusy}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-text-main shadow-xs transition-all hover:bg-border active:scale-95 disabled:opacity-40"
                aria-label="Тоо хасах"
              >
                <Minus className="h-3 w-3" />
              </button>
              <button
                onClick={() => void changeQuantity(step)}
                disabled={isBusy}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-text-main shadow-xs transition-all hover:bg-border active:scale-95 disabled:opacity-40"
                aria-label="Тоо нэмэх"
              >
                <Plus className="h-3 w-3" />
              </button>
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface-hover p-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wide text-text-muted">Хадгалах</div>
          <div className={`mt-1 text-sm font-extrabold ${expiry.className}`}>{expiry.label}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl border border-border bg-surface-hover px-3 py-2 text-[10px] text-text-muted">
        <span className="flex min-w-0 items-center gap-1.5">
          <Clock3 className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span className="truncate">{formatDateTime(item.lastSyncedAt)}</span>
        </span>
        <span className="shrink-0 font-bold text-emerald-600">{item.source}</span>
      </div>
    </article>
  );
}
