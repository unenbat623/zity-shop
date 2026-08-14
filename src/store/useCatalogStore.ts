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

  /** Хөргөгчийн орцын тоог өөрчилнө (Chef DB руу бичнэ) */
  updateFridgeQuantity: (id: string, quantity: number) => Promise<{ ok: boolean; message: string }>;
  /** Хөргөгчөөс орц устгана */
  removeFridgeItem: (id: string) => Promise<{ ok: boolean; message: string }>;
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

  /**
   * Тоог өөрчилнө. UI шууд шинэчлэгдэж (optimistic), сервер алдаа өгвөл
   * хуучин утга руу буцаана — хэрэглэгч буруу тоо харах эрсдэлгүй.
   */
  updateFridgeQuantity: async (id, quantity) => {
    const previous = get().fridgeItems;
    const target = previous.find((item) => item.id === id);
    if (!target) return { ok: false, message: 'Орц олдсонгүй.' };

    if (quantity <= 0) return get().removeFridgeItem(id);

    set({
      fridgeItems: previous.map((item) => (item.id === id ? { ...item, quantity } : item)),
    });

    const result = await ZityChefService.updateFridgeItem(id, { quantity });
    if (!result.success) {
      set({ fridgeItems: previous });
      return { ok: false, message: result.message };
    }

    return { ok: true, message: result.message };
  },

  removeFridgeItem: async (id) => {
    const previous = get().fridgeItems;
    const target = previous.find((item) => item.id === id);
    if (!target) return { ok: false, message: 'Орц олдсонгүй.' };

    set({ fridgeItems: previous.filter((item) => item.id !== id) });

    const result = await ZityChefService.removeFridgeItem(id);
    if (!result.success) {
      set({ fridgeItems: previous });
      return { ok: false, message: result.message };
    }

    return { ok: true, message: `"${target.name}" хөргөгчөөс хасагдлаа.` };
  },
}));
