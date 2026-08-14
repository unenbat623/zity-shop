import { create } from 'zustand';
import { ChefConnectionState, FridgeItem, Product, RecipeBundle } from '../types';
import { ZityChefService } from '../services/zityChefService';
import { MOCK_PRODUCTS, RECIPE_BUNDLES } from '../constants/mockData';

/**
 * Zity Chef каталогийн нэгдсэн store.
 *
 * Өмнө нь Home, RecipeKits, Fridge, Admin дэлгэц тус бүр өөрсдөө fetch хийдэг байсан —
 * ижил өгөгдлийг 4 удаа татаж, дэлгэц хооронд зөрөх эрсдэлтэй байв. Одоо нэг эх сурвалж
 * бөгөөд шинэ мэдээлэл хэрэгтэй үед л дахин татна.
 */

/** Ижил өгөгдлийг энэ хугацаанд дахин татахгүй */
const FRESH_WINDOW_MS = 60_000;

interface CatalogState {
  products: Product[];
  recipeKits: RecipeBundle[];
  fridgeItems: FridgeItem[];

  isLoadingProducts: boolean;
  isLoadingKits: boolean;
  isLoadingFridge: boolean;

  productsFetchedAt: number | null;
  kitsFetchedAt: number | null;
  fridgeFetchedAt: number | null;

  connection: ChefConnectionState;
  lastError: string | null;

  loadProducts: (options?: { force?: boolean }) => Promise<void>;
  loadRecipeKits: (options?: { force?: boolean }) => Promise<void>;
  loadFridge: (options?: { force?: boolean }) => Promise<void>;
  /** Дэлгүүрийн нүүр хуудсанд хэрэгтэй өгөгдлийг зэрэг татна */
  loadStorefront: (options?: { force?: boolean }) => Promise<void>;
  refreshAll: () => Promise<void>;
  getProductById: (id: string) => Product | undefined;
}

function isFresh(fetchedAt: number | null, force: boolean | undefined): boolean {
  if (force) return false;
  return fetchedAt !== null && Date.now() - fetchedAt < FRESH_WINDOW_MS;
}

function connectionFrom(isLive: boolean, error: string | null): ChefConnectionState {
  return {
    status: isLive ? 'live' : 'offline',
    lastCheckedAt: new Date().toISOString(),
    message: isLive
      ? 'Zity Chef backend-тэй холбогдсон, өгөгдөл live синк хийгдэж байна.'
      : error || 'Zity Chef backend-тэй холбогдож чадсангүй. Локал каталог ашиглаж байна.',
  };
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  products: MOCK_PRODUCTS,
  recipeKits: RECIPE_BUNDLES,
  fridgeItems: [],

  isLoadingProducts: false,
  isLoadingKits: false,
  isLoadingFridge: false,

  productsFetchedAt: null,
  kitsFetchedAt: null,
  fridgeFetchedAt: null,

  connection: {
    status: 'unknown',
    lastCheckedAt: null,
    message: 'Zity Chef холболтыг шалгаагүй байна.',
  },
  lastError: null,

  loadProducts: async (options) => {
    const state = get();
    if (state.isLoadingProducts || isFresh(state.productsFetchedAt, options?.force)) return;

    set({ isLoadingProducts: true, connection: { ...state.connection, status: 'checking' } });
    const result = await ZityChefService.fetchStoreProducts();

    set({
      products: result.data,
      isLoadingProducts: false,
      productsFetchedAt: Date.now(),
      connection: connectionFrom(result.isLive, result.error),
      lastError: result.error,
    });
  },

  loadRecipeKits: async (options) => {
    const state = get();
    if (state.isLoadingKits || isFresh(state.kitsFetchedAt, options?.force)) return;

    set({ isLoadingKits: true });

    // Chef-ийн жор үнэ агуулдаггүй тул багцын үнийг каталогийн бараагаар тооцно.
    // Каталог хараахан ачаалагдаагүй бол эхлээд түүнийг татна.
    if (!get().productsFetchedAt) {
      await get().loadProducts();
    }

    const result = await ZityChefService.fetchRecipeKits(get().products);

    set((current) => ({
      recipeKits: result.data,
      isLoadingKits: false,
      kitsFetchedAt: Date.now(),
      // Аль нэг эндпойнт амьд бол холболтыг live гэж үзнэ
      connection: result.isLive ? connectionFrom(true, null) : current.connection,
    }));
  },

  loadFridge: async (options) => {
    const state = get();
    if (state.isLoadingFridge || isFresh(state.fridgeFetchedAt, options?.force)) return;

    set({ isLoadingFridge: true });
    const result = await ZityChefService.fetchFridgeItems();

    set((current) => ({
      fridgeItems: result.data,
      isLoadingFridge: false,
      fridgeFetchedAt: Date.now(),
      connection: result.isLive ? connectionFrom(true, null) : current.connection,
    }));
  },

  /**
   * Нүүр хуудасны өгөгдөл. Жорын багцын үнэ каталогоос хамаардаг тул
   * бараа эхэлж, дараа нь жор ачаалагдана.
   */
  loadStorefront: async (options) => {
    await get().loadProducts(options);
    await get().loadRecipeKits(options);
  },

  refreshAll: async () => {
    await Promise.all([
      get().loadProducts({ force: true }),
      get().loadRecipeKits({ force: true }),
      get().loadFridge({ force: true }),
    ]);
  },

  getProductById: (id) => get().products.find((product) => product.id === id),
}));
