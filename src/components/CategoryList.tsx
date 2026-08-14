import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORIES } from '../constants/mockData';
import { useSearchStore } from '../store/useSearchStore';
import { useCatalogStore } from '../store/useCatalogStore';

export function CategoryList() {
  const { selectedCategorySlug, setSelectedCategorySlug } = useSearchStore();
  const products = useCatalogStore((state) => state.products);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const updateArrows = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    setShowLeftArrow(element.scrollLeft > 4);
    setShowRightArrow(Math.ceil(element.scrollLeft + element.clientWidth) < element.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    window.addEventListener('resize', updateArrows);
    return () => window.removeEventListener('resize', updateArrows);
  }, [updateArrows]);

  const scrollBy = (offset: number) => {
    scrollRef.current?.scrollBy({ left: offset, behavior: 'smooth' });
  };

  /** Ангилал тус бүрийн бодит барааны тоо — статик тоо биш */
  const countBySlug = products.reduce<Record<string, number>>((acc, product) => {
    acc[product.categorySlug] = (acc[product.categorySlug] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="relative mb-5 mt-2 sm:px-11">
      {showLeftArrow && (
        <button
          onClick={() => scrollBy(-240)}
          className="absolute left-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface shadow-md transition-colors hover:bg-surface-hover sm:flex"
          aria-label="Зүүн тийш гүйлгэх"
        >
          <ChevronLeft className="h-4 w-4 text-text-muted" />
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={updateArrows}
        className="scrollbar-hide flex gap-3 overflow-x-auto px-1 pb-3 pt-2"
      >
        <button
          onClick={() => setSelectedCategorySlug(null)}
          className={`flex min-w-max flex-col items-center justify-center rounded-2xl border px-4 py-2 text-xs font-bold transition-all ${
            !selectedCategorySlug
              ? 'border-transparent bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
              : 'border-border bg-surface text-text-muted hover:border-emerald-500/30 hover:text-text-main'
          }`}
          aria-pressed={!selectedCategorySlug}
        >
          🛒 Бүгд
        </button>

        {CATEGORIES.map((category) => {
          const isSelected = selectedCategorySlug === category.slug;
          const count = countBySlug[category.slug] ?? 0;

          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategorySlug(isSelected ? null : category.slug)}
              className="flex min-w-[72px] flex-col items-center gap-1.5"
              aria-pressed={isSelected}
            >
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-2xl border text-2xl transition-all hover:scale-105 active:scale-95 ${
                  isSelected
                    ? 'scale-105 border-transparent bg-emerald-600 shadow-md shadow-emerald-600/25'
                    : 'border-border bg-surface hover:border-emerald-500/30'
                }`}
              >
                {category.icon}
              </span>
              <span
                className={`line-clamp-2 text-center text-[10px] font-bold leading-tight ${
                  isSelected ? 'text-emerald-600' : 'text-text-muted'
                }`}
              >
                {category.name.split(',')[0]}
              </span>
              {count > 0 && <span className="font-mono text-[9px] text-text-subtle">{count}</span>}
            </button>
          );
        })}
      </div>

      {showRightArrow && (
        <button
          onClick={() => scrollBy(240)}
          className="absolute right-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface shadow-md transition-colors hover:bg-surface-hover sm:flex"
          aria-label="Баруун тийш гүйлгэх"
        >
          <ChevronRight className="h-4 w-4 text-text-muted" />
        </button>
      )}
    </div>
  );
}
