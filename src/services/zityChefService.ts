/**
 * Zity Chef backend-тэй холбогдох давхарга.
 *
 * Endpoint-ууд нь Chef Complex-ийн `server/routes/*` дээрх бодит гэрээтэй тулгагдсан:
 *   GET  /api/health            → { status }
 *   GET  /api/store/products    → { products: [{ id, name, nameEn, emoji, category, unit, pricePerUnit, imageUrl, expiryDays }] }
 *   GET  /api/recipes           → { recipes:  [{ id, title, titleEn, image, tags, time, difficulty, ingredients: string[], steps }] }
 *   GET  /api/inventory         → { items:    [{ id, name, emoji, category, quantity, unit, expiryDays, pricePerUnit }] }  (auth)
 *   POST /api/inventory         → нэг орц нэмнэ (auth)
 *   POST /api/orders            → { items, totalAmount, deliveryAddress, paymentMethod }  (auth)
 *   GET  /api/chef/dashboard    → { stats, recentOrders, recentCustomers, adminEnabled }  (auth + CHEF_ADMIN_EMAILS)
 *
 * Backend унтарсан үед апп ажиллахаа болихгүй — локал каталог руу шилжиж,
 * `isLive: false` гэж илэн далангүй мэдэгдэнэ.
 */

import { ApiError, chefRequest } from './apiClient';
import {
  AdminUserRow,
  CartItem,
  FridgeItem,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  RecipeBundle,
} from '../types';
import { MOCK_PRODUCTS, RECIPE_BUNDLES } from '../constants/mockData';

const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';

const DEFAULT_RECIPE_IMAGE =
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80';

/**
 * Chef-ийн каталог нь `in_stock = true` бараанууд л буцаадаг бөгөөд нөөцийн ТОО
 * агуулдаггүй. Тиймээс live бараанд нөөцийн бодит хязгаар байхгүй — 0 гэж
 * тооцвол бүх бараа "дууссан" болж харагдана.
 */
const LIVE_STOCK_DEFAULT = 99;

/** Chef-ийн `inventory_items.category` CHECK constraint дээрх зөвшөөрөгдсөн утгууд */
const CHEF_CATEGORIES = ['🥦 Ногоо', '🥩 Мах', '🥛 Сүү, өндөг', '🧂 Амтлагч', '🍎 Жимс'] as const;
type ChefCategory = (typeof CHEF_CATEGORIES)[number];

/** Chef-ийн `inventory_items.unit` CHECK constraint дээрх зөвшөөрөгдсөн утгууд */
const CHEF_UNITS = ['гр', 'л', 'ш', 'g', 'l', 'pcs'] as const;
type ChefUnit = (typeof CHEF_UNITS)[number];

/**
 * Chef-ийн `orders.payment_method` CHECK constraint нь зөвхөн эдгээрийг зөвшөөрнө.
 * Delguur дээр `monpay`, `cod` бас байдаг тул хамгийн ойрыг нь сонгож илгээнэ —
 * эс бөгөөс insert 502 өгч, захиалга Chef дээр огт бүртгэгдэхгүй.
 * (Delguur өөрийн бичлэг дээрээ жинхэнэ утгыг хэвээр хадгална.)
 */
const CHEF_PAYMENT_METHODS = ['qpay', 'socialpay', 'card'] as const;
type ChefPaymentMethod = (typeof CHEF_PAYMENT_METHODS)[number];

export function toChefPaymentMethod(method: PaymentMethod): ChefPaymentMethod {
  if (CHEF_PAYMENT_METHODS.includes(method as ChefPaymentMethod)) {
    return method as ChefPaymentMethod;
  }
  // MonPay нь QR түрийвч тул qpay-д хамгийн ойр; бэлэн мөнгө Chef-д байхгүй
  return method === 'monpay' ? 'qpay' : 'card';
}

/** Chef-ийн захиалгын төлвийг Delguur-ийн төлөв рүү буулгана */
const CHEF_STATUS_MAP: Record<string, OrderStatus> = {
  pending: 'pending',
  paid: 'odoo_synced',
  delivering: 'shipping',
  completed: 'delivered',
  cancelled: 'cancelled',
};

export interface SyncResult<T> {
  data: T;
  isLive: boolean;
  /** Live татаж чадаагүй бол шалтгаан */
  error: string | null;
}

// ── Хөрвүүлэлтийн туслахууд ─────────────────────────────────────────────────

function toNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function toText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback;
}

function describeError(error: unknown): string {
  if (error instanceof ApiError) return error.userMessage;
  return error instanceof Error ? error.message : 'Тодорхойгүй алдаа.';
}

/** Chef-ийн ангиллын нэрийг Delguur-ийн ангиллын slug руу буулгана */
export function toCategorySlug(category: string): string {
  const value = category.toLowerCase();

  if (value.includes('мах')) return 'meat';
  if (value.includes('ногоо')) return 'vegetables';
  if (value.includes('сүү') || value.includes('өндөг')) return 'dairy';
  if (value.includes('гурил') || value.includes('талх')) return 'bakery';
  if (value.includes('жимс')) return 'fruits';
  if (value.includes('ундаа') || value.includes('ус')) return 'drinks';
  if (value.includes('амтлагч') || value.includes('соус')) return 'spices';
  if (value.includes('амттан') || value.includes('чипс')) return 'snacks';

  return 'zity-chef';
}

/**
 * Delguur-ийн ангиллыг Chef-ийн CHECK constraint-д тохирох утга болгоно.
 * Таарахгүй утга илгээвэл Supabase insert 502 өгнө.
 */
export function toChefCategory(category: string, slug: string): ChefCategory {
  if (CHEF_CATEGORIES.includes(category as ChefCategory)) return category as ChefCategory;

  switch (slug) {
    case 'meat':
      return '🥩 Мах';
    case 'dairy':
      return '🥛 Сүү, өндөг';
    case 'fruits':
      return '🍎 Жимс';
    case 'spices':
      return '🧂 Амтлагч';
    default:
      return '🥦 Ногоо';
  }
}

/**
 * Delguur-ийн нэгжийг Chef-ийн зөвшөөрсөн нэгж рүү хөрвүүлнэ.
 * `кг` → `гр` (×1000), `мл` → `л`, бусад → `ш`.
 */
export function toChefUnit(unit: string, quantity: number): { unit: ChefUnit; quantity: number } {
  const value = unit.trim().toLowerCase();

  if (CHEF_UNITS.includes(value as ChefUnit)) {
    return { unit: value as ChefUnit, quantity };
  }
  if (value === 'кг' || value === 'kg') {
    return { unit: 'гр', quantity: quantity * 1000 };
  }
  if (value === 'мл' || value === 'ml') {
    return { unit: 'л', quantity: quantity / 1000 };
  }
  if (value === 'литр' || value === 'l') {
    return { unit: 'л', quantity };
  }
  return { unit: 'ш', quantity };
}

/** Emoji-г зурган орлуулагч болгож ашиглах SVG data URI */
function emojiImage(emoji: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50" y="54" font-size="58" text-anchor="middle" dominant-baseline="middle">${emoji}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// ── Chef API-ийн хариуны төрлүүд ────────────────────────────────────────────

interface ChefProductPayload {
  id?: string;
  name?: string;
  nameEn?: string | null;
  emoji?: string;
  category?: string | null;
  unit?: string;
  pricePerUnit?: number;
  imageUrl?: string | null;
  expiryDays?: number;
}

interface ChefRecipePayload {
  id?: string;
  title?: string;
  titleEn?: string;
  image?: string | null;
  tags?: string[];
  time?: string;
  difficulty?: string;
  category?: string;
  cuisine?: string;
  ingredients?: string[];
  steps?: unknown;
}

interface ChefInventoryPayload {
  id?: string;
  name?: string;
  emoji?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  expiryDays?: number;
  pricePerUnit?: number;
}

interface ChefOrderPayload {
  id?: string;
  items?: unknown[];
  totalAmount?: number;
  address?: string;
  status?: string;
  paymentMethod?: string;
  createdAt?: string;
}

interface ChefDashboardPayload {
  adminEnabled?: boolean;
  realtime?: boolean;
  message?: string;
  stats?: {
    customers?: number;
    orders?: number;
    revenue?: number;
    products?: number;
    pendingOrders?: number;
  };
  recentOrders?: {
    id?: string;
    customerName?: string;
    customerEmail?: string;
    totalAmount?: number;
    status?: string;
    createdAt?: string;
    address?: string;
  }[];
  recentCustomers?: {
    id?: string;
    name?: string;
    email?: string;
    createdAt?: string;
    subscriptionTier?: string;
  }[];
}

/** Chef dashboard-ын нэгтгэсэн үзүүлэлт */
export interface ChefDashboard {
  adminEnabled: boolean;
  message: string;
  stats: {
    customers: number;
    orders: number;
    revenue: number;
    products: number;
    pendingOrders: number;
  };
  users: AdminUserRow[];
}

// ── Mapper-ууд ──────────────────────────────────────────────────────────────

function mapProduct(payload: ChefProductPayload, index: number): Product {
  const name = toText(payload.name, `Zity Chef бараа ${index + 1}`);
  const category = toText(payload.category, 'Хүнсний ногоо');
  const slug = toCategorySlug(category);
  const price = toNumber(payload.pricePerUnit, 0);
  const emoji = toText(payload.emoji, '');
  const expiryDays = Math.floor(toNumber(payload.expiryDays, 7));

  return {
    id: toText(payload.id, `zity-chef-${index}`),
    name,
    category,
    categorySlug: slug,
    price,
    unit: toText(payload.unit, 'ш'),
    // Зураг байхгүй бол emoji-г зурган болгож харуулна (хоосон дөрвөлжин гарахгүй)
    image: toText(payload.imageUrl, emoji ? emojiImage(emoji) : DEFAULT_PRODUCT_IMAGE),
    // Chef каталог зөвхөн in_stock бараа буцаадаг тул нөөцтэй гэж үзнэ
    stock: LIVE_STOCK_DEFAULT,
    // Chef ID нь UUID тул эхний тэмдэгтүүд нь бүх бараанд ижил байдаг —
    // ялгаатай байх сүүлийн хэсгээс SKU үүсгэнэ
    sku: `CHEF-${toText(payload.id, String(index + 1)).split('-').pop()!.toUpperCase().slice(-8)}`,
    brand: 'Zity Chef',
    isMongolian: true,
    isOrganic: true,
    description: payload.nameEn
      ? `${name} (${payload.nameEn}) — Zity Chef дэлгүүрийн шинэхэн бүтээгдэхүүн.`
      : `Zity Chef дэлгүүрийн шинэхэн ${name}.`,
    expiration: `Хадгалах хугацаа: ${expiryDays} хоног`,
    tags: ['Zity Chef'],
    isLiveSynced: true,
  };
}

/**
 * Жорыг орц багц болгоно.
 *
 * Chef-ийн жор нь үнэ агуулдаггүй (`recipes` хүснэгтэд price багана байхгүй).
 * Тиймээс багцын үнийг орц бүрийг каталогийн бараатай нэрээр тааруулж
 * бодитоор тооцно — таарахгүй орцод дундаж үнэ ашиглана.
 */
function mapRecipeBundle(
  payload: ChefRecipePayload,
  index: number,
  catalog: Product[]
): RecipeBundle {
  const recipeId = toText(payload.id, `chef-recipe-${index + 1}`);
  const title = toText(payload.title, `Zity Chef жор ${index + 1}`);
  const ingredients = Array.isArray(payload.ingredients) ? payload.ingredients : [];

  /**
   * Орцуудыг каталогийн бараатай тааруулна.
   *
   * Chef-ийн жор нь орцоо зөвхөн нэрээр (`string[]`) хадгалдаг ба үнэ агуулдаггүй.
   * Каталогт байхгүй орцод (жишээ нь "Давс", "Хар перец") зохиомол үнэ оноовол
   * багцын нийт үнэ нарийн тооцоолсон мэт харагдаад бодитоор худал болно.
   * Тиймээс тааралгүй орцыг `isAvailable: false`, үнэ 0 гэж тэмдэглэж, багцын
   * үнэд оруулахгүй.
   *
   * Нэг жорын хоёр орц ижил бараа руу таарч болно — тэр тохиолдолд нэгтгэж
   * тоо ширхгийг нэмнэ (эс бөгөөс сагсанд давхардаж React key давхцана).
   */
  const itemsById = new Map<string, RecipeBundle['productItems'][number]>();

  ingredients.forEach((ingredient, ingredientIndex) => {
    const ingredientName = toText(ingredient, `Орц ${ingredientIndex + 1}`);
    const lower = ingredientName.toLowerCase();

    const matched = catalog.find(
      (product) =>
        product.name.toLowerCase() === lower ||
        lower.includes(product.name.toLowerCase()) ||
        product.name.toLowerCase().includes(lower)
    );

    const productId = matched?.id ?? `${recipeId}-ing-${ingredientIndex + 1}`;
    const existing = itemsById.get(productId);

    if (existing) {
      existing.requiredQty += 1;
      return;
    }

    itemsById.set(productId, {
      productId,
      productName: matched?.name ?? ingredientName,
      requiredQty: 1,
      unit: matched?.unit ?? 'порц',
      pricePerUnit: matched?.discountPrice ?? matched?.price ?? 0,
      isAvailable: Boolean(matched),
    });
  });

  const productItems = Array.from(itemsById.values());

  // Зөвхөн дэлгүүрт байгаа орцын үнийг нийлүүлнэ
  const price = productItems
    .filter((item) => item.isAvailable)
    .reduce((sum, item) => sum + item.pricePerUnit * item.requiredQty, 0);

  // Багцаар авахад 10% хямдрал
  const discountPrice = price > 0 ? Math.round((price * 0.9) / 100) * 100 : undefined;

  const steps = Array.isArray(payload.steps) ? payload.steps : [];

  return {
    id: `kit-${recipeId}`,
    recipeId,
    name: `${title} — Орц багц`,
    description: toText(payload.titleEn ?? payload.tags?.join(', '), 'Zity Chef жорын шинэхэн орц'),
    chefName: 'Chef Zity',
    prepTime: toText(payload.time, '25 мин'),
    // Chef жорд порцын тоо байхгүй — орцын тооноос ойролцоогоор тооцно
    servings: Math.max(2, Math.min(6, Math.ceil(ingredients.length / 2))),
    // Нэг ч орц каталогт таараагүй бол үнэ 0 — UI нь "үнэ тодорхойгүй" гэж
    // харуулна. Зохиомол тоо гаргаж хэрэглэгчийг төөрөгдүүлэхгүй.
    price,
    discountPrice,
    image: toText(payload.image, DEFAULT_RECIPE_IMAGE),
    productItems,
    instructions: steps.length
      ? steps.map((step, stepIndex) => {
          if (typeof step === 'string') return step;
          const value = (step ?? {}) as Record<string, unknown>;
          const stepTitle = toText(value.title, '');
          const description = toText(value.description ?? value.text, '');
          return `Алхам ${stepIndex + 1}: ${stepTitle}${description ? ` — ${description}` : ''}`.trim();
        })
      : undefined,
    isLiveSynced: true,
  };
}

/**
 * Chef DB-ийн захиалгыг Delguur-ийн бүтэц рүү хөрвүүлнэ.
 *
 * Chef нь захиалгын дэлгэрэнгүйг Delguur шиг бүрэн хадгалдаггүй (хаяг нь нэг мөр
 * текст, бараа нь зөвхөн id/нэр/тоо/үнэ). Тиймээс байгаа мэдээллийг нь ашиглаж,
 * дутууг каталогоос нөхнө. Эдгээр захиалгыг `isRemote` гэж тэмдэглэнэ.
 */
function mapChefOrder(payload: ChefOrderPayload, catalog: Product[]): Order {
  const chefRef = toText(payload.id, 'ZITY');
  const rawItems = Array.isArray(payload.items) ? payload.items : [];

  const items: CartItem[] = rawItems.map((raw, index) => {
    const item = (raw ?? {}) as Record<string, unknown>;
    const id = toText(item.id, `chef-item-${index}`);
    const matched = catalog.find((product) => product.id === id);
    const name = toText(item.name, matched?.name ?? `Бараа ${index + 1}`);

    return {
      id,
      sku: matched?.sku ?? '—',
      name,
      price: toNumber(item.price, matched?.price ?? 0),
      image: matched?.image ?? DEFAULT_PRODUCT_IMAGE,
      category: matched?.category ?? 'Zity Chef',
      categorySlug: matched?.categorySlug ?? 'zity-chef',
      description: matched?.description ?? '',
      stock: matched?.stock ?? 0,
      unit: matched?.unit ?? 'ш',
      quantity: Math.max(1, Math.floor(toNumber(item.quantity, 1))),
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalAmount = toNumber(payload.totalAmount, subtotal);

  // Chef нь огноог `toLocaleDateString('mn-MN')` («2026.08.14») хэлбэрээр буцаадаг
  const parsedDate = new Date(toText(payload.createdAt, ''));
  const createdAt = Number.isNaN(parsedDate.getTime())
    ? new Date().toISOString()
    : parsedDate.toISOString();

  const status = CHEF_STATUS_MAP[toText(payload.status, 'paid')] ?? 'odoo_synced';

  return {
    id: chefRef,
    chefOrderRef: chefRef,
    isRemote: true,
    odooOrderRef: '—',
    createdAt,
    userId: null,
    items,
    deliveryMode: 'delivery',
    address: {
      id: `chef-addr-${chefRef}`,
      district: toText(payload.address, 'Хаяг тэмдэглэгдээгүй'),
      khoroo: '',
      streetBuilding: '',
      entranceAppt: '',
      phone: '',
    },
    paymentMethod: (toText(payload.paymentMethod, 'qpay') as PaymentMethod) ?? 'qpay',
    paymentStatus: status === 'pending' ? 'unpaid' : 'paid',
    subtotal,
    discountAmount: Math.max(0, subtotal - totalAmount),
    deliveryFee: 0,
    totalAmount,
    status,
    odooSync: { status: 'pending', message: 'Zity Chef дээр үүссэн захиалга.' },
    chefSync: { status: 'success', message: 'Zity Chef дээр бүртгэлтэй.' },
  };
}

function mapFridgeItem(payload: ChefInventoryPayload, index: number): FridgeItem {
  return {
    id: toText(payload.id, `fridge-${index + 1}`),
    name: toText(payload.name, 'Орц'),
    category: toText(payload.category, '🥦 Ногоо'),
    quantity: toNumber(payload.quantity, 1),
    unit: toText(payload.unit, 'ш'),
    expiryDays: Math.floor(toNumber(payload.expiryDays, 7)),
    lastSyncedAt: new Date().toISOString(),
    source: 'Zity Chef',
    emoji: payload.emoji,
  };
}

// ── Service ─────────────────────────────────────────────────────────────────

export const ZityChefService = {
  /** Backend амьд эсэхийг шалгах хөнгөн хүсэлт */
  async ping(signal?: AbortSignal): Promise<{ isLive: boolean; message: string }> {
    try {
      await chefRequest('/health', { timeoutMs: 4000, signal });
      return { isLive: true, message: 'Zity Chef backend холбогдсон.' };
    } catch (error) {
      return { isLive: false, message: describeError(error) };
    }
  },

  /** Дэлгүүрийн барааны каталог (нээлттэй) */
  async fetchStoreProducts(signal?: AbortSignal): Promise<SyncResult<Product[]>> {
    try {
      const response = await chefRequest<{ products?: ChefProductPayload[] }>('/store/products', {
        signal,
      });
      const payload = Array.isArray(response?.products) ? response.products : [];

      if (payload.length === 0) {
        return { data: MOCK_PRODUCTS, isLive: false, error: 'Zity Chef каталог хоосон байна.' };
      }

      return { data: payload.map(mapProduct), isLive: true, error: null };
    } catch (error) {
      return { data: MOCK_PRODUCTS, isLive: false, error: describeError(error) };
    }
  },

  /**
   * Жорын орц багцууд.
   * @param catalog Багцын үнийг бодитоор тооцоход ашиглах барааны каталог
   */
  async fetchRecipeKits(catalog: Product[], signal?: AbortSignal): Promise<SyncResult<RecipeBundle[]>> {
    try {
      const response = await chefRequest<{ recipes?: ChefRecipePayload[] }>('/recipes', { signal });
      const payload = Array.isArray(response?.recipes) ? response.recipes : [];

      if (payload.length === 0) {
        return { data: RECIPE_BUNDLES, isLive: false, error: 'Zity Chef жор олдсонгүй.' };
      }

      return {
        data: payload.map((recipe, index) => mapRecipeBundle(recipe, index, catalog)),
        isLive: true,
        error: null,
      };
    } catch (error) {
      return { data: RECIPE_BUNDLES, isLive: false, error: describeError(error) };
    }
  },

  /**
   * Zity Chef хөргөгчний нөөц. Нэвтрэлт шаардлагатай —
   * нэвтрээгүй үед хоосон жагсаалт буцаана (хуурамч өгөгдөл харуулахгүй).
   */
  async fetchFridgeItems(signal?: AbortSignal): Promise<SyncResult<FridgeItem[]>> {
    try {
      const response = await chefRequest<{ items?: ChefInventoryPayload[] }>('/inventory', {
        signal,
        requireAuth: true,
      });
      const payload = Array.isArray(response?.items) ? response.items : [];

      return { data: payload.map(mapFridgeItem), isLive: true, error: null };
    } catch (error) {
      return { data: [], isLive: false, error: describeError(error) };
    }
  },

  /** Chef admin dashboard (CHEF_ADMIN_EMAILS-д багтсан хэрэглэгчид) */
  async fetchDashboard(signal?: AbortSignal): Promise<SyncResult<ChefDashboard>> {
    const empty: ChefDashboard = {
      adminEnabled: false,
      message: '',
      stats: { customers: 0, orders: 0, revenue: 0, products: 0, pendingOrders: 0 },
      users: [],
    };

    try {
      const response = await chefRequest<ChefDashboardPayload>('/chef/dashboard', {
        signal,
        requireAuth: true,
        timeoutMs: 10_000,
      });

      const users: AdminUserRow[] = (response.recentCustomers ?? []).map((customer, index) => ({
        id: toText(customer.id, `chef-user-${index}`),
        name: toText(customer.name, 'Нэргүй хэрэглэгч'),
        email: toText(customer.email, '—'),
        phone: '—',
        source: 'Zity Chef',
        savedItems: 0,
        orders: 0,
        lastSeen: toText(customer.createdAt, '—'),
      }));

      return {
        data: {
          adminEnabled: response.adminEnabled === true,
          message: toText(response.message, ''),
          stats: {
            customers: toNumber(response.stats?.customers, 0),
            orders: toNumber(response.stats?.orders, 0),
            revenue: toNumber(response.stats?.revenue, 0),
            products: toNumber(response.stats?.products, 0),
            pendingOrders: toNumber(response.stats?.pendingOrders, 0),
          },
          users,
        },
        isLive: true,
        error: null,
      };
    } catch (error) {
      return { data: empty, isLive: false, error: describeError(error) };
    }
  },

  /**
   * Хэрэглэгчийн захиалгуудыг Chef DB-ээс уншина.
   *
   * Chef болон Delguur нэг Supabase төсөл хуваалцдаг тул хоёр аппын аль нэгээс
   * хийсэн захиалга хоёуланд нь харагдана. Локал хуулбар байхгүй ч (өөр
   * төхөөрөмжөөс нэвтэрсэн) захиалгын түүх алдагдахгүй.
   *
   * @param catalog Барааны нэр/зураг сэргээхэд ашиглана — Chef зөвхөн
   *                `{ id, name, quantity, price }` хадгалдаг.
   */
  async fetchOrders(catalog: Product[], signal?: AbortSignal): Promise<SyncResult<Order[]>> {
    try {
      const response = await chefRequest<{ orders?: ChefOrderPayload[] }>('/orders', {
        signal,
        requireAuth: true,
        timeoutMs: 10_000,
      });
      const payload = Array.isArray(response?.orders) ? response.orders : [];

      return {
        data: payload.map((order) => mapChefOrder(order, catalog)),
        isLive: true,
        error: null,
      };
    } catch (error) {
      return { data: [], isLive: false, error: describeError(error) };
    }
  },

  /**
   * Захиалгыг Zity Chef рүү илгээж, худалдаж авсан орцыг хөргөгчид нэмнэ.
   *
   * Хоёулаа нэвтрэлт шаарддаг. Захиалга үүсэх нь Chef backend-ээс хамаарахгүй —
   * амжилтгүй болбол зөвхөн синкийн төлөв "failed" болно.
   *
   * @returns `chefOrderRef` — Chef дээр үүссэн дугаар. Дараа нь захиалгуудыг
   *          нэгтгэхэд давхардлыг таних түлхүүр болно.
   */
  async syncOrder(
    order: Order
  ): Promise<{ success: boolean; message: string; chefOrderRef?: string }> {
    let chefOrderRef: string | undefined;

    try {
      const response = await chefRequest<{ order?: { id?: string } }>('/orders', {
        method: 'POST',
        requireAuth: true,
        timeoutMs: 12_000,
        body: {
          items: order.items.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.discountPrice ?? item.price,
          })),
          totalAmount: order.totalAmount,
          deliveryAddress: [
            order.address.district,
            order.address.khoroo,
            order.address.streetBuilding,
            order.address.entranceAppt,
          ]
            .filter(Boolean)
            .join(', '),
          paymentMethod: toChefPaymentMethod(order.paymentMethod),
        },
      });

      chefOrderRef = response?.order?.id;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return { success: false, message: 'Zity Chef рүү илгээхийн тулд нэвтэрсэн байх шаардлагатай.' };
      }
      return { success: false, message: describeError(error) };
    }

    // Орцуудыг хөргөгчид зэрэг нэмнэ — нэг нь алдаа өгсөн ч бусад нь үргэлжилнэ.
    // Нэгж болон ангиллыг Chef-ийн DB constraint-д тохируулж хөрвүүлнэ.
    const inventoryResults = await Promise.allSettled(
      order.items.map((item) => {
        const { unit, quantity } = toChefUnit(item.unit, item.quantity);

        return chefRequest('/inventory', {
          method: 'POST',
          requireAuth: true,
          timeoutMs: 12_000,
          body: {
            name: item.name,
            emoji: item.categorySlug === 'meat' ? '🥩' : '🥬',
            category: toChefCategory(item.category, item.categorySlug),
            quantity: Math.round(quantity * 100) / 100,
            unit,
            expiryDays: 7,
            pricePerUnit: item.discountPrice ?? item.price,
          },
        });
      })
    );

    const failedCount = inventoryResults.filter((result) => result.status === 'rejected').length;

    if (failedCount === 0) {
      return {
        success: true,
        chefOrderRef,
        message: `Захиалга илгээгдэж, ${order.items.length} орц Zity Chef хөргөгчид нэмэгдлээ.`,
      };
    }

    return {
      success: true,
      chefOrderRef,
      message: `Захиалга илгээгдлээ. ${failedCount}/${order.items.length} орц хөргөгчид нэмэгдсэнгүй.`,
    };
  },

  /** Хөргөгчийн орцын тоо ширхгийг өөрчилнө */
  async updateFridgeItem(
    id: string,
    updates: { quantity?: number; expiryDays?: number }
  ): Promise<{ success: boolean; message: string }> {
    try {
      await chefRequest(`/inventory/${encodeURIComponent(id)}`, {
        method: 'PUT',
        requireAuth: true,
        body: updates,
      });
      return { success: true, message: 'Хөргөгчийн бүртгэл шинэчлэгдлээ.' };
    } catch (error) {
      return { success: false, message: describeError(error) };
    }
  },

  /** Хөргөгчөөс орц устгана */
  async removeFridgeItem(id: string): Promise<{ success: boolean; message: string }> {
    try {
      await chefRequest(`/inventory/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        requireAuth: true,
      });
      return { success: true, message: 'Орц хөргөгчөөс хасагдлаа.' };
    } catch (error) {
      return { success: false, message: describeError(error) };
    }
  },
};
