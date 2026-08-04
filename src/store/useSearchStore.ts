import { create } from 'zustand';

interface SearchState {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query, selectedCategory: null }),
  selectedCategory: null,
  setSelectedCategory: (category) => set({ selectedCategory: category, searchQuery: '' }),
}));
