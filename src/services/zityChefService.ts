import { Product, RecipeBundle, Order } from '../types';
import { MOCK_PRODUCTS, RECIPE_BUNDLES } from '../constants/mockData';

const BASE_URL = (import.meta as any).env?.VITE_ZITY_CHEF_API_URL || 'http://localhost:3002';

const IMAGE_MAP: Record<string, string> = {
  'лууван': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&q=80',
  'үхрийн мах': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&q=80',
  'сүү': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&q=80',
  'сонгино': 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&q=80',
  'өндөг': 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=600&q=80',
  'алим': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&q=80',
  'гурил': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80',
  'бяслаг': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&q=80',
};

export class ZityChefService {
  /**
   * Fetch products directly from Zity Chef Store backend endpoint
   */
  static async fetchStoreProducts(): Promise<{ products: Product[]; isLive: boolean }> {
    try {
      const response = await fetch(`${BASE_URL}/api/store/products`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();

      if (data.products && Array.isArray(data.products) && data.products.length > 0) {
        const mappedProducts: Product[] = data.products.map((p: any, idx: number) => {
          const nameLower = (p.name || '').toLowerCase();
          const mappedImg =
            p.imageUrl ||
            Object.keys(IMAGE_MAP).find((key) => nameLower.includes(key))
              ? IMAGE_MAP[Object.keys(IMAGE_MAP).find((key) => nameLower.includes(key))!]
              : MOCK_PRODUCTS.find((mp) => mp.name.toLowerCase().includes(nameLower))?.image ||
                'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';

          return {
            id: p.id || `zity-p-${idx}`,
            name: p.name,
            category: p.category || '🥦 Хүнсний ногоо',
            price: p.pricePerUnit || p.price || 3000,
            unit: p.unit || 'ш',
            image: mappedImg,
            stock: 45 + idx * 5,
            odooId: 101 + idx,
            sku: `SKU-CHEF-${idx + 1}`,
            brand: 'Zity Chef',
            isMongolian: true,
            isOrganic: true,
            description: `Zity Chef дэлгүүрийн шинэхэн ${p.name}.`,
          };
        });

        // Merge with additional mock items if count is small so catalog is always full
        if (mappedProducts.length < 8) {
          const existingIds = new Set(mappedProducts.map((p) => p.name.toLowerCase()));
          const extraMock = MOCK_PRODUCTS.filter((mp) => !existingIds.has(mp.name.toLowerCase()));
          return { products: [...mappedProducts, ...extraMock], isLive: true };
        }

        return { products: mappedProducts, isLive: true };
      }
    } catch (err) {
      console.warn('[ZityChefService] Could not connect to Zity Chef API, using local store data:', err);
    }
    return { products: MOCK_PRODUCTS, isLive: false };
  }

  /**
   * Fetch recipes from Zity Chef backend to generate dynamic meal kits
   */
  static async fetchRecipeKits(): Promise<{ bundles: RecipeBundle[]; isLive: boolean }> {
    try {
      const response = await fetch(`${BASE_URL}/api/recipes`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      if (data.recipes && Array.isArray(data.recipes) && data.recipes.length > 0) {
        const mappedBundles: RecipeBundle[] = data.recipes.map((r: any) => ({
          id: `kit-${r.id}`,
          name: `${r.title} — Орц Багц`,
          description: r.titleEn || 'Zity Chef амттай хоолны шинэхэн орц',
          chefName: 'Chef Zity',
          servings: 2,
          price: 24500,
          discountPrice: 21900,
          image: r.image || 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
          productItems: (r.ingredients || []).map((ing: string, i: number) => ({
            productId: `ing-${i}`,
            productName: ing,
            requiredQty: 1,
            unit: 'порц',
          })),
          instructions: r.steps ? r.steps.map((s: any) => `Алхам ${s.stepNumber}: ${s.title} — ${s.description}`) : undefined,
        }));

        // Merge with existing bundles if any
        const combined = [...mappedBundles];
        RECIPE_BUNDLES.forEach((b) => {
          if (!combined.some((c) => c.name.includes(b.name))) {
            combined.push(b);
          }
        });

        return { bundles: combined, isLive: true };
      }
    } catch (err) {
      console.warn('[ZityChefService] Recipe API unavailable, using local recipes:', err);
    }
    return { bundles: RECIPE_BUNDLES, isLive: false };
  }

  /**
   * Push Order to Zity Chef backend & automatically add purchased ingredients into Zity Chef's Fridge!
   */
  static async syncOrderToZityChef(order: Order): Promise<boolean> {
    try {
      // 1. Post to Zity Chef /api/orders
      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer guest-token`,
        },
        body: JSON.stringify({
          items: order.items.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.discountPrice || item.price,
          })),
          totalAmount: order.totalAmount,
          deliveryAddress: `${order.address.district}, ${order.address.khoroo}, ${order.address.streetBuilding}`,
          paymentMethod: order.paymentMethod,
        }),
      });

      if (!res.ok) console.warn('[ZityChefService] Order sync responded with non-200');

      // 2. Add each item to Zity Chef Fridge /api/inventory
      for (const item of order.items) {
        await fetch(`${BASE_URL}/api/inventory`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer guest-token`,
          },
          body: JSON.stringify({
            name: item.name,
            emoji: '🥩',
            category: '🥦 Ногоо',
            quantity: item.quantity,
            unit: item.unit,
            expiryDays: 7,
            pricePerUnit: item.discountPrice || item.price,
          }),
        }).catch(() => {});
      }

      return true;
    } catch (err) {
      console.warn('[ZityChefService] Failed to push order to Zity Chef backend:', err);
      return false;
    }
  }
}
