import { create } from 'zustand';
import { Product, RecipeBundle, CartItem, DeliveryMode, DeliveryAddress } from '../types';

interface CartState {
  items: CartItem[];
  deliveryMode: DeliveryMode;
  pickupTime: string | null;
  couponCode: string;
  discountPercentage: number;
  selectedAddress: DeliveryAddress | null;
  
  // Actions
  addItem: (product: Product, quantity?: number) => void;
  addBundle: (bundle: RecipeBundle) => void;
  removeItem: (productId: string) => void;
  decreaseQuantity: (productId: string) => void;
  setDeliveryMode: (mode: DeliveryMode) => void;
  setPickupTime: (time: string | null) => void;
  setSelectedAddress: (address: DeliveryAddress) => void;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  clearCart: () => void;
  
  // Calculations
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getDeliveryFee: () => number;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  deliveryMode: 'delivery',
  pickupTime: null,
  couponCode: '',
  discountPercentage: 0,
  selectedAddress: {
    district: 'Сүхбаатар дүүрэг',
    khoroo: '1-р хороо',
    streetBuilding: 'Zity Center, 4-р давхар',
    entranceAppt: '1-р орц, 402 тоот',
    phone: '99112233',
    notes: 'Үүдэнд утасдаж мэдэгдэнэ үү',
  },

  addItem: (product, quantity = 1) => {
    set((state) => {
      const existingItem = state.items.find((item) => item.id === product.id);
      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
        };
      }
      return { items: [...state.items, { ...product, quantity }] };
    });
  },

  addBundle: (bundle) => {
    // Add all ingredients inside the recipe bundle
    bundle.productItems.forEach((bundleItem) => {
      // Find full product details or construct item
      set((state) => {
        const existingItem = state.items.find((item) => item.id === bundleItem.productId);
        if (existingItem) {
          return {
            items: state.items.map((item) =>
              item.id === bundleItem.productId
                ? { ...item, quantity: item.quantity + bundleItem.requiredQty }
                : item
            ),
          };
        } else {
          const newCartItem: CartItem = {
            id: bundleItem.productId,
            sku: `ODOO-REC-${bundleItem.productId}`,
            name: bundleItem.productName,
            price: bundleItem.pricePerUnit,
            image: bundle.image,
            category: 'Zity Chef Орц багц',
            categorySlug: 'recipe_bundle',
            description: `${bundle.name} хоолны орц`,
            stock: 50,
            unit: bundleItem.unit,
            quantity: bundleItem.requiredQty,
          };
          return { items: [...state.items, newCartItem] };
        }
      });
    });
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId),
    }));
  },

  decreaseQuantity: (productId) => {
    set((state) => {
      const existingItem = state.items.find((item) => item.id === productId);
      if (existingItem && existingItem.quantity > 1) {
        return {
          items: state.items.map((item) =>
            item.id === productId
              ? { ...item, quantity: item.quantity - 1 }
              : item
          ),
        };
      }
      return {
        items: state.items.filter((item) => item.id !== productId),
      };
    });
  },

  setDeliveryMode: (mode) => set({ deliveryMode: mode }),
  setPickupTime: (time) => set({ pickupTime: time }),
  setSelectedAddress: (address) => set({ selectedAddress: address }),

  applyCoupon: (code) => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode === 'ZITYCHEF2026' || cleanCode === 'ZITY10') {
      set({ couponCode: cleanCode, discountPercentage: 10 });
      return true;
    } else if (cleanCode === 'ODOO15') {
      set({ couponCode: cleanCode, discountPercentage: 15 });
      return true;
    }
    return false;
  },

  removeCoupon: () => set({ couponCode: '', discountPercentage: 0 }),

  clearCart: () => set({ items: [], pickupTime: null, couponCode: '', discountPercentage: 0 }),

  getSubtotal: () => {
    const { items } = get();
    return items.reduce((total, item) => {
      const price = item.discountPrice || item.price;
      return total + price * item.quantity;
    }, 0);
  },

  getDiscountAmount: () => {
    const { getSubtotal, discountPercentage } = get();
    if (discountPercentage <= 0) return 0;
    return Math.round((getSubtotal() * discountPercentage) / 100);
  },

  getDeliveryFee: () => {
    const { deliveryMode, getSubtotal } = get();
    if (deliveryMode === 'pickup') return 0;
    const subtotal = getSubtotal();
    if (subtotal >= 50000) return 0; // Free delivery over 50k
    return 3000;
  },

  getTotalPrice: () => {
    const { getSubtotal, getDiscountAmount, getDeliveryFee } = get();
    return getSubtotal() - getDiscountAmount() + getDeliveryFee();
  },

  getTotalItems: () => {
    const { items } = get();
    return items.reduce((total, item) => total + item.quantity, 0);
  },
}));
