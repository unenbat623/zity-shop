import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ChefHat,
  Clock,
  Database,
  Flame,
  Layers,
  Plus,
  SearchX,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';

import { AppShell } from '../components/AppShell';
import { CategoryList } from '../components/CategoryList';
import { ProductCard } from '../components/ProductCard';
import { BottomSheet } from '../components/ui/BottomSheet';
import { OdooSyncModal } from '../components/OdooSyncModal';
import { Skeleton } from '../components/ui/Skeleton';

import { CATEGORIES } from '../constants/mockData';
import { Product, RecipeBundle } from '../types';
import { useCartStore } from '../store/useCartStore';
import { useSearchStore } from '../store/useSearchStore';
import { useCatalogStore } from '../store/useCatalogStore';
import { useToastStore } from '../store/useToastStore';
import { formatMnt } from '../lib/format';

export function HomeScreen() {
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.show);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isOdooModalOpen, setIsOdooModalOpen] = useState(false);

  const { addItem, addBundle } = useCartStore();
  const { searchQuery, selectedCategorySlug } = useSearchStore();
  const { products, recipeKits, connection, isLoadingProducts, loadStorefront } = useCatalogStore();

  useEffect(() => {
    void loadStorefront();
  }, [loadStorefront]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory = selectedCategorySlug
        ? product.categorySlug === selectedCategorySlug
        : true;

      if (!query) return matchesCategory;

      const matchesSearch =
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        (product.brand?.toLowerCase().includes(query) ?? false) ||
        (product.tags?.some((tag) => tag.toLowerCase().includes(query)) ?? false);

      return matchesCategory && matchesSearch;
    });
  }, [products, searchQuery, selectedCategorySlug]);

  const isFiltering = Boolean(searchQuery.trim() || selectedCategorySlug);
  const selectedCategoryName = CATEGORIES.find((item) => item.slug === selectedCategorySlug)?.name;
  const isChefLive = connection.status === 'live';
  /** Нүүрэн дээр эхний 3 багц — үлдсэнийг тусдаа хуудсанд */
  const featuredKits = recipeKits.slice(0, 3);

  const handleAddBundle = (bundle: RecipeBundle) => {
    const result = addBundle(bundle);
    showToast(result.message, result.ok ? 'success' : 'warning');
  };

  const handleAddSelectedProduct = () => {
    if (!selectedProduct) return;
    const result = addItem(selectedProduct);
    showToast(result.message, result.ok ? 'success' : 'warning');
    if (result.ok) setSelectedProduct(null);
  };

  return (
    <AppShell>
      <>
        <CategoryList />

        {/* Hero */}
        {!isFiltering && (
          <section className="mb-8">
            <div className="zity-brand-surface relative overflow-hidden rounded-3xl p-6 shadow-xl sm:p-8">
              <div className="relative z-10 max-w-xl">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3 py-1 text-xs font-extrabold text-emerald-200">
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Zity Chef × Odoo ERP
                  </span>
                  <span
                    className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${
                      isChefLive
                        ? 'border-emerald-400/40 bg-emerald-500/25 text-emerald-100'
                        : 'border-amber-400/30 bg-amber-500/20 text-amber-100'
                    }`}
                    title={connection.message}
                  >
                    {isChefLive ? (
                      <>
                        <Wifi className="h-3 w-3 animate-pulse" /> Chef backend live
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3 w-3" /> Локал каталог
                      </>
                    )}
                  </span>
                </div>

                <h1 className="mb-3 text-2xl font-black leading-snug tracking-tight text-white sm:text-3xl lg:text-4xl">
                  Хоолны шинэхэн орцыг <br />
                  <span className="text-emerald-400">Zity Chef & Odoo</span>-р шууд хүргэнэ
                </h1>
                <p className="mb-5 max-w-lg text-xs leading-relaxed text-emerald-100/80 sm:text-sm">
                  Zity Chef-ийн жорын дагуу бэлтгэсэн орц багцууд болон өдөр тутмын хүнсийг 30 минутад аваарай.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => navigate('/recipe-kits')}
                    className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-xs font-extrabold text-slate-950 shadow-md shadow-emerald-500/30 transition-all hover:bg-emerald-400 active:scale-95"
                  >
                    <ChefHat className="h-4 w-4" /> Орц багцууд үзэх
                  </button>
                  <button
                    onClick={() => setIsOdooModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-4 py-3 text-xs font-bold text-white backdrop-blur-md transition-all hover:bg-white/20"
                  >
                    <Database className="h-3.5 w-3.5 text-emerald-300" /> Холболтын төлөв
                  </button>
                </div>
              </div>

              <ChefHat className="pointer-events-none absolute -bottom-6 -right-6 hidden h-56 w-56 rotate-12 text-white/10 sm:block" />
            </div>
          </section>
        )}

        {/* Онцлох орц багцууд */}
        {!isFiltering && featuredKits.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-extrabold text-text-main sm:text-lg">
                <ChefHat className="h-5 w-5 text-emerald-500" /> Zity Chef-ийн санал
              </h2>
              <button
                onClick={() => navigate('/recipe-kits')}
                className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline sm:text-sm"
              >
                Бүгдийг харах <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredKits.map((bundle) => (
                <article
                  key={bundle.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-surface shadow-xs transition-all hover:border-emerald-500/30"
                >
                  <div>
                    <div className="relative h-44 w-full overflow-hidden bg-surface-hover">
                      <img
                        src={bundle.image}
                        alt={bundle.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                      <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-[10px] font-bold text-white">
                        <ChefHat className="h-3 w-3" /> {bundle.servings} хүний порц
                      </span>
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <h3 className="text-sm font-bold leading-tight sm:text-base">{bundle.name}</h3>
                        <p className="line-clamp-1 text-[11px] text-gray-300">{bundle.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-4 pb-0 text-[11px] text-text-muted">
                      <span className="flex items-center gap-1 rounded-lg border border-border bg-surface-hover px-2.5 py-1 font-medium">
                        <Clock className="h-3.5 w-3.5 text-emerald-500" /> {bundle.prepTime}
                      </span>
                      <span className="flex items-center gap-1 rounded-lg border border-border bg-surface-hover px-2.5 py-1 font-medium">
                        <Layers className="h-3.5 w-3.5 text-amber-500" /> {bundle.productItems.length} орц
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 p-4">
                    <div className="min-w-0">
                      {bundle.price <= 0 ? (
                        <span className="text-sm font-bold text-text-muted">Үнэ тодорхойгүй</span>
                      ) : bundle.discountPrice ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-extrabold text-emerald-600">
                            {formatMnt(bundle.discountPrice)}
                          </span>
                          <span className="text-xs text-text-subtle line-through">
                            {formatMnt(bundle.price)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-extrabold text-text-main">{formatMnt(bundle.price)}</span>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddBundle(bundle)}
                      disabled={bundle.price <= 0}
                      className="zity-btn-primary shrink-0 px-4 py-2.5 text-xs"
                    >
                      <Plus className="h-4 w-4" /> Сагслах
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Барааны жагсаалт */}
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-extrabold text-text-main sm:text-lg">
              {searchQuery.trim()
                ? `Хайлтын үр дүн (${filteredProducts.length})`
                : selectedCategoryName
                ? `${selectedCategoryName} (${filteredProducts.length})`
                : 'Дэлгүүрийн бараанууд'}
            </h2>

            <span
              className={`flex shrink-0 items-center gap-1 text-xs font-bold ${
                isChefLive ? 'text-emerald-600' : 'text-amber-500'
              }`}
              title={connection.message}
            >
              {isChefLive ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              {isChefLive ? 'Live нөөц' : 'Локал'}
            </span>
          </div>

          {isLoadingProducts && products.length === 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-3xl border border-border bg-surface">
                  <Skeleton className="aspect-square w-full" />
                  <div className="space-y-2 p-3.5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onClick={setSelectedProduct} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-surface p-10 text-center">
              <SearchX className="mx-auto mb-3 h-8 w-8 text-text-subtle" />
              <p className="text-sm font-bold text-text-main">
                {searchQuery.trim()
                  ? `"${searchQuery}" хайлтад тохирох бараа олдсонгүй.`
                  : 'Энэ ангилалд бараа байхгүй байна.'}
              </p>
              <p className="mt-1 text-xs text-text-muted">Өөр түлхүүр үг эсвэл ангилал сонгоод үзнэ үү.</p>
            </div>
          )}
        </section>

        {/* Барааны дэлгэрэнгүй */}
        <BottomSheet isOpen={Boolean(selectedProduct)} onClose={() => setSelectedProduct(null)}>
        {selectedProduct && (
          <div className="mx-auto flex max-w-lg flex-col">
            <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-3xl border border-border bg-surface-hover">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="h-full w-full object-cover"
              />
              {selectedProduct.sku && (
                <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 font-mono text-[11px] font-bold text-white backdrop-blur-md">
                  SKU: {selectedProduct.sku}
                </span>
              )}
            </div>

            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-extrabold text-text-main">{selectedProduct.name}</h2>
                <p className="text-xs font-bold text-emerald-600">{selectedProduct.category}</p>
              </div>
              <div className="shrink-0 text-right">
                {selectedProduct.discountPrice ? (
                  <>
                    <div className="text-xs text-text-subtle line-through">
                      {formatMnt(selectedProduct.price)}
                    </div>
                    <div className="text-xl font-extrabold text-emerald-600">
                      {formatMnt(selectedProduct.discountPrice)}
                    </div>
                  </>
                ) : (
                  <div className="text-xl font-extrabold text-text-main">
                    {formatMnt(selectedProduct.price)}
                  </div>
                )}
              </div>
            </div>

            <p className="mb-4 text-xs leading-relaxed text-text-muted">{selectedProduct.description}</p>

            <div className="mb-6 grid grid-cols-2 gap-2 text-xs">
              {selectedProduct.expiration && (
                <div className="col-span-2 flex items-start gap-2 rounded-2xl border border-border bg-surface-hover p-3">
                  <Clock className="mt-0.5 h-4 w-4 text-emerald-500" />
                  <div>
                    <div className="text-[10px] font-bold text-text-muted">Хугацаа & хадгалалт</div>
                    <div className="text-xs font-medium text-text-main">{selectedProduct.expiration}</div>
                  </div>
                </div>
              )}
              {selectedProduct.calories && (
                <div className="flex items-start gap-2 rounded-2xl border border-border bg-surface-hover p-3">
                  <Flame className="mt-0.5 h-4 w-4 text-amber-500" />
                  <div>
                    <div className="text-[10px] font-bold text-text-muted">Илчлэг</div>
                    <div className="text-xs font-medium text-text-main">{selectedProduct.calories}</div>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2 rounded-2xl border border-border bg-surface-hover p-3">
                <Database className="mt-0.5 h-4 w-4 text-emerald-500" />
                <div>
                  <div className="text-[10px] font-bold text-text-muted">Бэлэн нөөц</div>
                  <div
                    className={`text-xs font-semibold ${
                      selectedProduct.stock > 0 ? 'text-emerald-600' : 'text-red-500'
                    }`}
                  >
                    {selectedProduct.stock > 0
                      ? `${selectedProduct.stock} ${selectedProduct.unit} бэлэн`
                      : 'Нөөц дууссан'}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleAddSelectedProduct}
              disabled={selectedProduct.stock <= 0}
              className="zity-btn-primary w-full py-4 text-sm"
            >
              {selectedProduct.stock <= 0
                ? 'Нөөц дууссан'
                : `Сагсанд нэмэх (${formatMnt(selectedProduct.discountPrice ?? selectedProduct.price)})`}
            </button>
          </div>
        )}
        </BottomSheet>

        <OdooSyncModal isOpen={isOdooModalOpen} onClose={() => setIsOdooModalOpen(false)} />
      </>
    </AppShell>
  );
}
