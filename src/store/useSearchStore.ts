import { create } from 'zustand';

interface SearchState {
  searchQuery: string;
  /** Ангиллын slug (`meat`, `vegetables`, ...). null бол бүх ангилал. */
  selectedCategorySlug: string | null;
  setSearchQuery: (query: string) => void;
  setSelectedCategorySlug: (slug: string | null) => void;
  reset: () => void;
}

/**
 * Хайлт болон ангиллын шүүлтүүр.
 *
 * Өмнө нь ангиллыг нэрээр нь ("Мах, махан бүтээгдэхүүн") шүүдэг байсан тул
 * Zity Chef-ээс өөр нэртэй ирсэн бараа шүүлтэд орохгүй байв. Одоо slug-аар
 * шүүдэг тул эх сурвалж хамаарахгүй зөв ажиллана.
 */
export const useSearchStore = create<SearchState>((set) => ({
  searchQuery: '',
  selectedCategorySlug: null,

  // Хайлт эхлэхэд ангиллын шүүлтийг цэвэрлэнэ — хоёул зэрэг үйлчилбэл
  // хэрэглэгч "юу ч олдохгүй" байдалд ордог
  setSearchQuery: (query) => set({ searchQuery: query }),

  setSelectedCategorySlug: (slug) => set({ selectedCategorySlug: slug, searchQuery: '' }),

  reset: () => set({ searchQuery: '', selectedCategorySlug: null }),
}));
