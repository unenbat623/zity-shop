import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, DeliveryMode, Product, RecipeBundle } from '../types';
import { useCatalogStore } from './useCatalogStore';

/**
 * Сагсны төлөв.
 *
 * Гол дүрмүүд:
 *  - Барааны нөөцөөс илүү тоо ширхэг нэмэхийг зөвшөөрөхгүй
 *  - Үйлдэл бүр амжилттай эсэхээ буцаана — UI үүнийг toast болгож харуулна
 *  - Сагс localStorage-д хадгалагдана (хуудас сэргээхэд алдагдахгүй)
 */

export const FREE_DELIVERY_THRESHOLD = 50_000;
export const DELIVERY_FEE = 3_000;
/** Хүргэлтийн хамгийн бага захиалгын дүн */
export const MIN_ORDER_AMOUNT = 10_000;

const COUPONS: Record<string, number> = {
  ZITYCHEF2026: 10,
  ZITY10: 10,
  ODOO15: 15,
};

export interface CartActionResult {
  ok: boolean;
  message: string;
}

interface CartState {
  items: CartItem[];
  deliveryMode: DeliveryMode;
  pickupTime: string | null;
  couponCode: string;
  discountPercentage: number;

  addItem: (product: Product, quantity?: number) => CartActionResult;
  addBundle: (bundle: RecipeBundle) => CartActionResult;
  setQuantity: (productId: string, quantity: number) => CartActionResult;
  decreaseQuantity: (productId: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;

  setDeliveryMode: (mode: DeliveryMode) => void;
  setPickupTime: (time: string | null) => void;
  applyCoupon: (code: string) => CartActionResult;
  removeCoupon: () => void;

  getItemQuantity: (productId: string) => number;
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getDeliveryFee: () => number;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  /** Захиалга үүсгэх боломжтой эсэх — checkout дээр шалгана */
  getCheckoutIssue: () => string | null;
}

function unitPrice(item: { price: number; discountPrice?: number }): number {
  return item.discountPrice ?? item.price;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      deliveryMode: 'delivery',
      pickupTime: null,
      couponCode: '',
      discountPercentage: 0,

      addItem: (product, quantity = 1) => {
        if (quantity <= 0) return { ok: false, message: 'Тоо ширхэг буруу байна.' };

        const existing = get().items.find((item) => item.id === product.id);
        const currentQuantity = existing?.quantity ?? 0;
        const requested = currentQuantity + quantity;

        // Нөөц 0 бол огт нэмэхгүй
        if (product.stock <= 0) {
          return { ok: false, message: `"${product.name}" нөөцгүй байна.` };
        }

        if (requested > product.stock) {
          // Боломжтой хэмжээгээр нь тааруулж нэмнэ
          if (currentQuantity >= product.stock) {
            return {
              ok: false,
              message: `"${product.name}" барааны нөөц ${product.stock} ${product.unit} л байна.`,
            };
          }
          set((state) => ({
            items: state.items.map((item) =>
              item.id === product.id ? { ...item, quantity: product.stock } : item
            ),
          }));
          return {
            ok: true,
            message: `Нөөцөөр хязгаарлагдаж ${product.stock} ${product.unit} нэмэгдлээ.`,
          };
        }

        set((state) => {
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.id === product.id ? { ...item, quantity: requested } : item
              ),
            };
          }
          return { items: [...state.items, { ...product, quantity }] };
        });

        return { ok: true, message: `"${product.name}" сагсанд нэмэгдлээ.` };
      },

      /**
       * Жорын багцын бүх орцыг сагсанд нэмнэ.
       * Каталогт байгаа бараатай тааруулж, жинхэнэ SKU/нөөцтэй нь холбоно.
       */
      addBundle: (bundle) => {
        const catalog = useCatalogStore.getState().products;
        let addedCount = 0;
        const skipped: string[] = [];

        bundle.productItems.forEach((bundleItem) => {
          const matched =
            catalog.find((product) => product.id === bundleItem.productId) ??
            catalog.find(
              (product) => product.name.toLowerCase() === bundleItem.productName.toLowerCase()
            );

          const product: Product = matched ?? {
            id: bundleItem.productId,
            sku: `CHEF-KIT-${bundleItem.productId}`,
            name: bundleItem.productName,
            price: bundleItem.pricePerUnit,
            image: bundle.image,
            category: 'Zity Chef орц багц',
            categorySlug: 'recipe_bundle',
            description: `${bundle.name} хоолны орц`,
            // Багцын орц нь Chef талаас бэлтгэгддэг тул нөөцийг хязгаарлахгүй
            stock: 999,
            unit: bundleItem.unit,
          };

          const result = get().addItem(product, bundleItem.requiredQty);
          if (result.ok) {
            addedCount += 1;
          } else {
            skipped.push(bundleItem.productName);
          }
        });

        if (addedCount === 0) {
          return { ok: false, message: 'Багцын орцууд одоогоор нөөцгүй байна.' };
        }
        if (skipped.length > 0) {
          return {
            ok: true,
            message: `${addedCount} орц нэмэгдлээ. Нөөцгүй: ${skipped.join(', ')}.`,
          };
        }
        return { ok: true, message: `"${bundle.name}" багцын ${addedCount} орц сагсанд нэмэгдлээ.` };
      },

      setQuantity: (productId, quantity) => {
        const item = get().items.find((cartItem) => cartItem.id === productId);
        if (!item) return { ok: false, message: 'Бараа сагсанд алга.' };

        if (quantity <= 0) {
          get().removeItem(productId);
          return { ok: true, message: `"${item.name}" сагснаас хасагдлаа.` };
        }

        if (quantity > item.stock) {
          set((state) => ({
            items: state.items.map((cartItem) =>
              cartItem.id === productId ? { ...cartItem, quantity: item.stock } : cartItem
            ),
          }));
          return { ok: false, message: `Нөөц ${item.stock} ${item.unit} л байна.` };
        }

        set((state) => ({
          items: state.items.map((cartItem) =>
            cartItem.id === productId ? { ...cartItem, quantity } : cartItem
          ),
        }));
        return { ok: true, message: '' };
      },

      decreaseQuantity: (productId) => {
        set((state) => {
          const existing = state.items.find((item) => item.id === productId);
          if (!existing) return state;

          if (existing.quantity > 1) {
            return {
              items: state.items.map((item) =>
                item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
              ),
            };
          }
          return { items: state.items.filter((item) => item.id !== productId) };
        });
      },

      removeItem: (productId) => {
        set((state) => ({ items: state.items.filter((item) => item.id !== productId) }));
      },

      clearCart: () =>
        set({ items: [], pickupTime: null, couponCode: '', discountPercentage: 0 }),

      setDeliveryMode: (mode) =>
        set({ deliveryMode: mode, pickupTime: mode === 'delivery' ? null : get().pickupTime }),

      setPickupTime: (time) => set({ pickupTime: time }),

      applyCoupon: (code) => {
        const cleanCode = code.trim().toUpperCase();
        if (!cleanCode) return { ok: false, message: 'Купон код оруулна уу.' };

        const percentage = COUPONS[cleanCode];
        if (!percentage) {
          return { ok: false, message: 'Буруу эсвэл хүчингүй купон код байна.' };
        }

        set({ couponCode: cleanCode, discountPercentage: percentage });
        return { ok: true, message: `${cleanCode} — ${percentage}% хямдрал идэвхжлээ.` };
      },

      removeCoupon: () => set({ couponCode: '', discountPercentage: 0 }),

      getItemQuantity: (productId) =>
        get().items.find((item) => item.id === productId)?.quantity ?? 0,

      getSubtotal: () =>
        get().items.reduce((total, item) => total + unitPrice(item) * item.quantity, 0),

      getDiscountAmount: () => {
        const { discountPercentage } = get();
        if (discountPercentage <= 0) return 0;
        return Math.round((get().getSubtotal() * discountPercentage) / 100);
      },

      getDeliveryFee: () => {
        const { deliveryMode } = get();
        if (deliveryMode === 'pickup') return 0;
        if (get().items.length === 0) return 0;
        return get().getSubtotal() >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
      },

      getTotalPrice: () => {
        const total = get().getSubtotal() - get().getDiscountAmount() + get().getDeliveryFee();
        return Math.max(0, total);
      },

      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),

      getCheckoutIssue: () => {
        const { items, deliveryMode, pickupTime } = get();

        if (items.length === 0) return 'Сагс хоосон байна.';

        const overStock = items.find((item) => item.quantity > item.stock);
        if (overStock) {
          return `"${overStock.name}" барааны нөөц хүрэлцэхгүй байна (${overStock.stock} ${overStock.unit}).`;
        }

        if (deliveryMode === 'pickup' && !pickupTime) {
          return 'Очиж авах цагаа сонгоно уу.';
        }

        if (deliveryMode === 'delivery' && get().getSubtotal() < MIN_ORDER_AMOUNT) {
          return `Хүргэлтийн доод дүн ${MIN_ORDER_AMOUNT.toLocaleString('mn-MN')}₮ байна.`;
        }

        return null;
      },
    }),
    {
      name: 'zity-cart',
      partialize: (state) => ({
        items: state.items,
        deliveryMode: state.deliveryMode,
        pickupTime: state.pickupTime,
        couponCode: state.couponCode,
        discountPercentage: state.discountPercentage,
      }),
    }
  )
);
