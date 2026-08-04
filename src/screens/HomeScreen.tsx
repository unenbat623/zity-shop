import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { CategoryList } from '../components/CategoryList';
import { ProductCard } from '../components/ProductCard';
import { BottomSheet } from '../components/ui/BottomSheet';
import { OdooSyncModal } from '../components/OdooSyncModal';
import { BottomNav } from '../components/BottomNav';
import { MOCK_PRODUCTS, RECIPE_BUNDLES } from '../constants/mockData';
import { Product, RecipeBundle } from '../types';
import { useCartStore } from '../store/useCartStore';
import { useSearchStore } from '../store/useSearchStore';
import { useOdooStore } from '../store/useOdooStore';
import { ZityChefService } from '../services/zityChefService';
import { Info, Clock, Flame, Plus, ChefHat, Database, Sparkles, ShieldCheck, ArrowRight, Layers, Wifi } from 'lucide-react';

export function HomeScreen() {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isOdooModalOpen, setIsOdooModalOpen] = useState(false);
  const [productsList, setProductsList] = useState<Product[]>(MOCK_PRODUCTS);
  const [recipeKits, setRecipeKits] = useState<RecipeBundle[]>(RECIPE_BUNDLES);
  const [isChefServerLive, setIsChefServerLive] = useState<boolean>(false);

  const { addItem, addBundle } = useCartStore();
  const { searchQuery, selectedCategory } = useSearchStore();
  const { config } = useOdooStore();

  useEffect(() => {
    let isMounted = true;
    async function loadLiveData() {
      const prodRes = await ZityChefService.fetchStoreProducts();
      const kitRes = await ZityChefService.fetchRecipeKits();
      if (isMounted) {
        if (prodRes.products && prodRes.products.length > 0) {
          setProductsList(prodRes.products);
        }
        if (kitRes.bundles && kitRes.bundles.length > 0) {
          setRecipeKits(kitRes.bundles);
        }
        setIsChefServerLive(prodRes.isLive || kitRes.isLive);
      }
    }
    loadLiveData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleAddBundle = (bundle: RecipeBundle) => {
    addBundle(bundle);
  };

  const filteredProducts = productsList.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.tags && product.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesCategory = selectedCategory ? product.category.includes(selectedCategory) : true;

    return matchesSearch && matchesCategory;
  });

  const isFiltering = searchQuery || selectedCategory;

  return (
    <div className="min-h-screen bg-background pb-28 text-text-main">
      <Header onOpenOdooModal={() => setIsOdooModalOpen(true)} />

      <main className="max-w-4xl mx-auto">
        {/* Category Carousel */}
        <CategoryList />

        {/* Hero Integration Banner */}
        {!isFiltering && (
          <section className="px-4 mb-6">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 p-6 text-white shadow-xl border border-emerald-500/20">
              <div className="relative z-10 max-w-md">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-extrabold text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Zity Chef × Odoo ERP
                  </span>
                  {isChefServerLive && (
                    <span className="rounded-full bg-emerald-500/30 border border-emerald-400/40 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-200 flex items-center gap-1">
                      <Wifi className="h-3 w-3 text-emerald-300 animate-pulse" /> Zity Chef Backend Live
                    </span>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-snug mb-2 text-white">
                  Хоолны шинэхэн орцыг <br />
                  <span className="text-emerald-400">Zity Chef & Odoo</span>-р шууд хүргэнэ
                </h1>
                <p className="text-xs text-emerald-100/80 mb-4 line-clamp-2">
                  Zity Chef-ийн хоолны жорын дагуу бэлтгэсэн орц багцууд болон өдөр тутмын хүнсний барааг 30 минутанд аваарай.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/recipe-kits')}
                    className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition-all hover:bg-emerald-400 active:scale-95 shadow-md shadow-emerald-500/30"
                  >
                    <ChefHat className="h-4 w-4" /> Хоолны Багцууд үзэх
                  </button>
                  <button
                    onClick={() => setIsOdooModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-3 py-2.5 text-xs font-bold text-white backdrop-blur-md hover:bg-white/20 transition-all"
                  >
                    <Database className="h-3.5 w-3.5 text-emerald-300" /> Odoo Төлөв
                  </button>
                </div>
              </div>

              {/* Decorative Background Icons */}
              <ChefHat className="absolute -right-6 -bottom-6 h-48 w-48 text-emerald-500/10 rotate-12 pointer-events-none" />
            </div>
          </section>
        )}

        {/* Featured Section: Zity Chef Recipe Bundles */}
        {!isFiltering && (
          <section className="mb-8 px-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-emerald-500" />
                <h2 className="text-base font-extrabold text-text-main">Zity Chef-ийн Санал (Орц Багц)</h2>
              </div>
              <button
                onClick={() => navigate('/recipe-kits')}
                className="text-xs font-bold text-emerald-600 flex items-center gap-1 hover:underline"
              >
                Бүгдийг харах <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {recipeKits.map((bundle) => (
                <div
                  key={bundle.id}
                  className="min-w-[290px] max-w-[310px] overflow-hidden rounded-3xl border border-border bg-surface shadow-xs hover:border-emerald-500/30 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-36 w-full overflow-hidden bg-surface-hover">
                      <img
                        src={bundle.image}
                        alt={bundle.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                      <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                        <ChefHat className="h-3 w-3" /> {bundle.servings} хүний порц
                      </div>
                      <div className="absolute bottom-3 left-3 text-white pr-3">
                        <h3 className="font-bold text-sm leading-tight text-white">{bundle.name}</h3>
                        <p className="text-[11px] text-gray-300 line-clamp-1">{bundle.description}</p>
                      </div>
                    </div>

                    <div className="p-3">
                      <div className="mb-2 flex items-center gap-2 text-[11px] text-text-muted">
                        <span className="flex items-center gap-1 font-medium bg-surface-hover px-2 py-0.5 rounded-lg border border-border">
                          <Clock className="h-3 w-3 text-emerald-500" /> {bundle.prepTime || '25 мин'}
                        </span>
                        <span className="flex items-center gap-1 font-medium bg-surface-hover px-2 py-0.5 rounded-lg border border-border">
                          <Layers className="h-3 w-3 text-amber-500" /> {bundle.productItems.length} орц
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 pt-0">
                    <div>
                      {bundle.discountPrice ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-extrabold text-base text-emerald-600">
                            {bundle.discountPrice.toLocaleString()}₮
                          </span>
                          <span className="text-xs text-text-muted line-through">
                            {bundle.price.toLocaleString()}₮
                          </span>
                        </div>
                      ) : (
                        <span className="font-extrabold text-base text-text-main">
                          {bundle.price.toLocaleString()}₮
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddBundle(bundle)}
                      className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white transition-all hover:bg-emerald-700 active:scale-95 shadow-md shadow-emerald-600/20"
                    >
                      <Plus className="h-4 w-4" /> Сагслах
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Product Grid Header */}
        <section className="px-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-text-main">
              {searchQuery
                ? `Хайлтын үр дүн (${filteredProducts.length})`
                : selectedCategory
                ? `${selectedCategory} (${filteredProducts.length})`
                : 'Odoo & Zity Chef Дэлгүүрийн Бараанууд'}
            </h2>

            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <ShieldCheck className="h-3.5 w-3.5" /> Нөөц Идэвхтэй
            </div>
          </div>

          {/* Product Cards Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onClick={handleProductClick} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-text-muted bg-surface rounded-3xl border border-border p-6">
              <p className="font-medium text-sm">
                {searchQuery ? `"${searchQuery}" хайлтад тохирох бараа олдсонгүй.` : 'Энэ ангилалд бараа байхгүй байна.'}
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Product Detail Bottom Sheet */}
      <BottomSheet isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)}>
        {selectedProduct && (
          <div className="flex flex-col">
            <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-3xl bg-surface-hover border border-border">
              <img src={selectedProduct.image} alt={selectedProduct.name} className="h-full w-full object-cover" />
              {selectedProduct.sku && (
                <div className="absolute top-3 left-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-mono font-bold text-white backdrop-blur-md">
                  SKU: {selectedProduct.sku}
                </div>
              )}
            </div>

            <div className="mb-2 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-text-main">{selectedProduct.name}</h2>
                <p className="text-xs text-emerald-600 font-bold">{selectedProduct.category}</p>
              </div>
              <div className="text-right">
                {selectedProduct.discountPrice ? (
                  <>
                    <div className="text-xs text-text-muted line-through">
                      {selectedProduct.price.toLocaleString()}₮
                    </div>
                    <div className="text-xl font-extrabold text-emerald-600">
                      {selectedProduct.discountPrice.toLocaleString()}₮
                    </div>
                  </>
                ) : (
                  <div className="text-xl font-extrabold text-text-main">
                    {selectedProduct.price.toLocaleString()}₮
                  </div>
                )}
              </div>
            </div>

            <p className="mb-4 text-xs text-text-muted leading-relaxed">{selectedProduct.description}</p>

            <div className="mb-6 grid grid-cols-2 gap-2 text-xs">
              {selectedProduct.expiration && (
                <div className="col-span-2 flex items-start gap-2 rounded-2xl bg-surface-hover p-3 border border-border">
                  <Clock className="mt-0.5 h-4 w-4 text-emerald-500" />
                  <div>
                    <div className="text-[10px] font-bold text-text-muted">Хугцаа & Хадгалалт</div>
                    <div className="text-xs font-medium text-text-main">{selectedProduct.expiration}</div>
                  </div>
                </div>
              )}
              {selectedProduct.calories && (
                <div className="flex items-start gap-2 rounded-2xl bg-surface-hover p-3 border border-border">
                  <Flame className="mt-0.5 h-4 w-4 text-amber-500" />
                  <div>
                    <div className="text-[10px] font-bold text-text-muted">Илчлэг</div>
                    <div className="text-xs font-medium text-text-main">{selectedProduct.calories}</div>
                  </div>
                </div>
              )}
              {selectedProduct.stock !== undefined && (
                <div className="flex items-start gap-2 rounded-2xl bg-surface-hover p-3 border border-border">
                  <Database className="mt-0.5 h-4 w-4 text-emerald-500" />
                  <div>
                    <div className="text-[10px] font-bold text-text-muted">Odoo / Store Нөөц</div>
                    <div className="text-xs font-semibold text-emerald-600">
                      {selectedProduct.stock} {selectedProduct.unit} бэлэн
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                addItem(selectedProduct);
                setSelectedProduct(null);
              }}
              className="w-full rounded-2xl bg-emerald-600 py-4 text-center font-bold text-white transition-all hover:bg-emerald-700 active:scale-98 shadow-lg shadow-emerald-600/20"
            >
              Сагсанд Нэмэх ({(selectedProduct.discountPrice || selectedProduct.price).toLocaleString()}₮)
            </button>
          </div>
        )}
      </BottomSheet>

      {/* Odoo Sync Status Modal */}
      <OdooSyncModal isOpen={isOdooModalOpen} onClose={() => setIsOdooModalOpen(false)} />

      {/* Bottom Navigation */}
      <BottomNav onOpenOdooModal={() => setIsOdooModalOpen(false)} />
    </div>
  );
}
