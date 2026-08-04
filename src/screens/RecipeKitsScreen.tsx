import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { RECIPE_BUNDLES } from '../constants/mockData';
import { RecipeBundle } from '../types';
import { useCartStore } from '../store/useCartStore';
import { ChefHat, Users, CheckCircle2, ShoppingBag, Layers } from 'lucide-react';

export function RecipeKitsScreen() {
  const navigate = useNavigate();
  const { addBundle } = useCartStore();
  const [addedBundleId, setAddedBundleId] = useState<string | null>(null);

  const handleAddBundle = (bundle: RecipeBundle) => {
    addBundle(bundle);
    setAddedBundleId(bundle.id);
    setTimeout(() => setAddedBundleId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background pb-28 text-text-main">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Banner */}
        <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-extrabold text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
              <ChefHat className="h-4 w-4 text-emerald-400" /> Zity Chef Жор & Орц Багцууд
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">Хоолны Орцоо Бэлэн Багцаар Ав</h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed max-w-xl">
            Гэртээ амттай хоол хийхэд хэрэгтэй бүх шинэхэн орцыг яг таг тунгаар нь бэлтгэж нэг дор хүргэж өгнө.
          </p>
        </div>

        {/* Recipe Bundles Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {RECIPE_BUNDLES.map((bundle) => {
            const isJustAdded = addedBundleId === bundle.id;

            return (
              <div
                key={bundle.id}
                className="overflow-hidden rounded-3xl border border-border bg-surface shadow-xs transition-all hover:border-emerald-500/30 flex flex-col justify-between"
              >
                <div>
                  {/* Bundle Header Image */}
                  <div className="relative h-48 w-full bg-surface-hover">
                    <img src={bundle.image} alt={bundle.name} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-extrabold text-white shadow-md">
                        <ChefHat className="h-3.5 w-3.5" /> {bundle.chefName}
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                        <Users className="h-3.5 w-3.5 text-emerald-400" /> {bundle.servings} Хүний Порц
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h2 className="text-lg font-bold text-white mb-1">{bundle.name}</h2>
                      <p className="text-xs text-gray-200 line-clamp-1">{bundle.description}</p>
                    </div>
                  </div>

                  {/* Ingredients List */}
                  <div className="p-4 border-b border-border">
                    <h3 className="text-xs font-extrabold text-text-main mb-3 flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-emerald-500" /> Багцад дагалдах орцууд ({bundle.productItems.length}):
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {bundle.productItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-surface-hover p-2.5 rounded-xl border border-border"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            <span className="font-semibold text-text-main">{item.productName}</span>
                          </div>
                          <span className="text-[11px] font-bold text-emerald-600 font-mono">
                            {item.requiredQty} {item.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-text-muted font-bold block">Багцын Нийт Үнэ</span>
                    {bundle.discountPrice ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-extrabold text-emerald-600">
                          {bundle.discountPrice.toLocaleString()}₮
                        </span>
                        <span className="text-xs text-text-muted line-through">
                          {bundle.price.toLocaleString()}₮
                        </span>
                      </div>
                    ) : (
                      <span className="text-xl font-extrabold text-text-main">
                        {bundle.price.toLocaleString()}₮
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleAddBundle(bundle)}
                    className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold text-white transition-all shadow-md active:scale-95 ${
                      isJustAdded
                        ? 'bg-emerald-700'
                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    }`}
                  >
                    {isJustAdded ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-white" /> Сагсанд Нэмэгдлээ!
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-4 w-4" /> Бүх Орцыг Сагслах
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
