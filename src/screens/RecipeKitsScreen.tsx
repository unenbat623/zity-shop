import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChefHat,
  Clock,
  Info,
  Layers,
  RefreshCw,
  ShoppingBag,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';

import { AppShell } from '../components/AppShell';
import { Skeleton } from '../components/ui/Skeleton';
import { useCartStore } from '../store/useCartStore';
import { useCatalogStore } from '../store/useCatalogStore';
import { useToastStore } from '../store/useToastStore';
import { RecipeBundle } from '../types';
import { formatMnt } from '../lib/format';

export function RecipeKitsScreen() {
  const showToast = useToastStore((state) => state.show);
  const addBundle = useCartStore((state) => state.addBundle);

  const { recipeKits, isLoadingKits, connection, loadRecipeKits, loadProducts } = useCatalogStore();
  const [addedBundleId, setAddedBundleId] = useState<string | null>(null);

  useEffect(() => {
    // Багцын орцыг каталогийн бодит бараатай тааруулахын тулд хоёуланг нь ачаална
    void loadRecipeKits();
    void loadProducts();
  }, [loadRecipeKits, loadProducts]);

  const handleAddBundle = (bundle: RecipeBundle) => {
    const result = addBundle(bundle);
    showToast(result.message, result.ok ? 'success' : 'warning');

    if (result.ok) {
      setAddedBundleId(bundle.id);
      setTimeout(() => setAddedBundleId((current) => (current === bundle.id ? null : current)), 2000);
    }
  };

  const isLive = connection.status === 'live';

  return (
    <AppShell showSearch={false} title="Орц багцууд" maxWidth="xl">
        <section className="zity-brand-surface relative mb-6 overflow-hidden rounded-3xl p-6 shadow-xl sm:p-8">
          <div className="relative z-10">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3 py-1 text-xs font-extrabold text-emerald-200">
                <ChefHat className="h-4 w-4" /> Zity Chef жор & орц багц
              </span>
              <span
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold ${
                  isLive
                    ? 'border-emerald-400/30 bg-emerald-500/20 text-emerald-200'
                    : 'border-amber-400/30 bg-amber-500/20 text-amber-100'
                }`}
                title={connection.message}
              >
                {isLive ? <Wifi className="h-3.5 w-3.5 animate-pulse" /> : <WifiOff className="h-3.5 w-3.5" />}
                {isLive ? 'Live' : 'Локал'}
              </span>
            </div>

            <h1 className="mb-2 text-2xl font-black text-white sm:text-3xl">
              Хоолны орцоо бэлэн багцаар ав
            </h1>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <p className="max-w-xl text-xs leading-relaxed text-emerald-100/80 sm:text-sm">
                Гэртээ амттай хоол хийхэд хэрэгтэй бүх шинэхэн орцыг яг таг тунгаар нь бэлтгэж нэг дор хүргэнэ.
              </p>
              <button
                onClick={() => void loadRecipeKits({ force: true })}
                disabled={isLoadingKits}
                className="inline-flex w-fit shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-xs font-extrabold text-white transition-colors hover:bg-white/20 disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingKits ? 'animate-spin' : ''}`} />
                Синк
              </button>
            </div>
          </div>

          <ChefHat className="pointer-events-none absolute -bottom-8 -right-8 hidden h-48 w-48 rotate-12 text-white/10 sm:block" />
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {isLoadingKits && recipeKits.length === 0
            ? Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="zity-card overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              ))
            : recipeKits.map((bundle) => {
                const isJustAdded = addedBundleId === bundle.id;
                const availableItems = bundle.productItems.filter(
                  (item) => item.isAvailable !== false
                );
                const hasPrice = bundle.price > 0;

                return (
                  <article
                    key={bundle.id}
                    className="flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-surface shadow-xs transition-all hover:border-emerald-500/30"
                  >
                    <div>
                      <div className="relative h-48 w-full bg-surface-hover">
                        <img
                          src={bundle.image}
                          alt={bundle.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

                        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                          <span className="flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-extrabold text-white shadow-md">
                            <ChefHat className="h-3.5 w-3.5" /> {bundle.chefName}
                          </span>
                          <span className="flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                            <Users className="h-3.5 w-3.5 text-emerald-400" /> {bundle.servings} порц
                          </span>
                        </div>

                        <div className="absolute bottom-4 left-4 right-4 text-white">
                          <h2 className="mb-1 text-lg font-bold leading-tight">{bundle.name}</h2>
                          <p className="line-clamp-1 text-xs text-gray-200">{bundle.description}</p>
                        </div>
                      </div>

                      <div className="border-b border-border p-4">
                        <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-text-muted">
                          <span className="flex items-center gap-1 rounded-lg border border-border bg-surface-hover px-2.5 py-1 font-medium">
                            <Clock className="h-3.5 w-3.5 text-emerald-500" /> {bundle.prepTime}
                          </span>
                          <span className="flex items-center gap-1 rounded-lg border border-border bg-surface-hover px-2.5 py-1 font-medium">
                            <Layers className="h-3.5 w-3.5 text-amber-500" /> {bundle.productItems.length} орц
                          </span>
                        </div>

                        <h3 className="mb-2 text-xs font-extrabold text-text-main">Багцад дагалдах орцууд</h3>
                        <div className="grid grid-cols-1 gap-2 text-xs">
                          {bundle.productItems.map((item) => (
                            <div
                              key={item.productId}
                              className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 ${
                                item.isAvailable === false
                                  ? 'border-dashed border-border bg-surface opacity-60'
                                  : 'border-border bg-surface-hover'
                              }`}
                            >
                              <span className="flex min-w-0 items-center gap-2">
                                {item.isAvailable === false ? (
                                  <Info className="h-4 w-4 shrink-0 text-text-subtle" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                )}
                                <span className="truncate font-semibold text-text-main">
                                  {item.productName}
                                </span>
                              </span>
                              <span
                                className={`shrink-0 font-mono text-[11px] font-bold ${
                                  item.isAvailable === false ? 'text-text-subtle' : 'text-emerald-600'
                                }`}
                              >
                                {item.isAvailable === false
                                  ? 'дэлгүүрт алга'
                                  : `${item.requiredQty} ${item.unit}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <span className="block truncate text-[10px] font-bold text-text-muted">
                          {hasPrice
                            ? `${availableItems.length}/${bundle.productItems.length} орцын үнэ`
                            : 'Багцын үнэ'}
                        </span>
                        {!hasPrice ? (
                          <span className="block break-words text-xs font-bold leading-tight text-text-muted">
                            Үнэ тодорхойгүй
                          </span>
                        ) : bundle.discountPrice ? (
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            <span className="text-xl font-extrabold text-emerald-600">
                              {formatMnt(bundle.discountPrice)}
                            </span>
                            <span className="text-xs text-text-subtle line-through">
                              {formatMnt(bundle.price)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xl font-extrabold text-text-main">
                            {formatMnt(bundle.price)}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleAddBundle(bundle)}
                        disabled={!hasPrice}
                        className={`flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold text-white shadow-md transition-all active:scale-95 disabled:opacity-40 sm:w-auto ${
                          isJustAdded ? 'bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        {isJustAdded ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" /> Нэмэгдлээ
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="h-4 w-4" /> Бүх орцыг сагслах
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
        </div>
      </AppShell>
  );
}
