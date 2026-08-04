import React, { useRef, useState, useEffect } from 'react';
import { CATEGORIES } from '../constants/mockData';
import { useSearchStore } from '../store/useSearchStore';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export function CategoryList() {
  const { selectedCategory, setSelectedCategory } = useSearchStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, []);

  return (
    <div className="relative mt-2 mb-5">
      {showLeftArrow && (
        <div className="pointer-events-none absolute left-0 top-0 z-10 flex h-full w-12 items-center justify-start bg-gradient-to-r from-background to-transparent pl-1">
          <ChevronLeft className="h-5 w-5 text-text-muted opacity-50 animate-pulse" />
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto px-4 pb-3 pt-2 scrollbar-hide"
      >
        {/* "All" button */}
        <button
          onClick={() => setSelectedCategory(null)}
          className={`flex min-w-max flex-col items-center gap-1.5 px-4 py-2 rounded-2xl border font-bold text-xs transition-all ${
            !selectedCategory
              ? 'bg-gradient-to-br from-indigo-600 to-emerald-600 border-transparent text-white shadow-md shadow-indigo-500/25'
              : 'bg-surface border-border text-text-muted hover:border-indigo-400/40 hover:text-text-main'
          }`}
        >
          🛒 Бүгд
        </button>

        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category.name;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(isSelected ? null : category.name)}
              className="flex min-w-[72px] flex-col items-center gap-1.5"
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition-all text-2xl hover:scale-105 active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-br from-indigo-600 to-emerald-600 border-transparent text-white shadow-md shadow-indigo-500/25 scale-105'
                    : 'bg-surface border-border hover:bg-indigo-500/10 hover:border-indigo-400/30'
                }`}
              >
                {category.icon}
              </div>
              <span
                className={`text-center text-[10px] font-bold line-clamp-2 leading-tight ${
                  isSelected ? 'text-indigo-600' : 'text-text-muted'
                }`}
              >
                {category.name.split(',')[0]}
              </span>
              {category.itemCount && (
                <span className="text-[9px] text-text-muted font-mono">{category.itemCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {showRightArrow && (
        <div className="pointer-events-none absolute right-0 top-0 z-10 flex h-full w-12 items-center justify-end bg-gradient-to-l from-background to-transparent pr-1">
          <ChevronRight className="h-5 w-5 text-text-muted opacity-50 animate-pulse" />
        </div>
      )}
    </div>
  );
}
