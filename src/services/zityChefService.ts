import { Product, RecipeBundle, Order, FridgeItem } from '../types';
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

const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';

function getCategorySlug(category: string): string {
  const categoryLower = category.toLowerCase();

  if (categoryLower.includes('мах')) return 'meat';
  if (categoryLower.includes('ногоо')) return 'vegetables';
  if (categoryLower.includes('сүү') || categoryLower.includes('өндөг')) return 'dairy';
  if (categoryLower.includes('гурил') || categoryLower.includes('талх')) return 'bakery';
  if (categoryLower.includes('жимс')) return 'fruits';
  if (categoryLower.includes('ундаа') || categoryLower.includes('ус')) return 'drinks';
  if (categoryLower.includes('амтлагч') || categoryLower.includes('соус')) return 'spices';

  return 'zity-chef';
}

function getMappedImage(name: string, explicitImage?: string): string {
  if (explicitImage) return explicitImage;

  const nameLower = name.toLowerCase();
  const imageKey = Object.keys(IMAGE_MAP).find((key) => nameLower.includes(key));
  if (imageKey) return IMAGE_MAP[imageKey];

  return (
    MOCK_PRODUCTS.find((mp) => nameLower.includes(mp.name.toLowerCase()) || mp.name.toLowerCase().includes(nameLower))
      ?.image || DEFAULT_PRODUCT_IMAGE
  );
}

function getNumericValue(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export class ZityChefService {
  private static readonly fallbackFridgeItems: FridgeItem[] = [
    { id: 'fridge-1', name: 'Шинэхэн лууван', category: 'Хүнсний ногоо', quantity: 8, unit: 'кг', expiryDays: 9, lastSyncedAt: new Date().toISOString(), source: 'Zity Chef' },
    { id: 'fridge-2', name: 'Өндөг', category: 'Сүүн бүтээгдэхүүн', quantity: 12, unit: 'ш', expiryDays: 14, lastSyncedAt: new Date().toISOString(), source: 'Zity Chef' },
    { id: 'fridge-3', name: 'Улаан лооль', category: 'Хүнсний ногоо', quantity: 4, unit: 'кг', expiryDays: 5, lastSyncedAt: new Date().toISOString(), source: 'Zity Chef' },
    { id: 'fridge-4', name: 'Сүү', category: 'Сүүн бүтээгдэхүүн', quantity: 3, unit: 'л', expiryDays: 7, lastSyncedAt: new Date().toISOString(), source: 'Odoo stock' },
  ];

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
          const name = p.name || p.title || `Zity Chef бараа ${idx + 1}`;
          const category = p.category || 'Хүнсний ногоо';
          const price = getNumericValue(p.pricePerUnit ?? p.price, 3000);

          return {
            id: p.id || `zity-p-${idx}`,
            name,
            category,
            categorySlug: p.categorySlug || getCategorySlug(category),
            price,
            unit: p.unit || 'ш',
            image: getMappedImage(name, p.imageUrl || p.image),
            stock: getNumericValue(p.stock ?? p.quantity, 45 + idx * 5),
            odooId: getNumericValue(p.odooId, 101 + idx),
            sku: p.sku || `SKU-CHEF-${idx + 1}`,
            brand: 'Zity Chef',
            isMongolian: true,
            isOrganic: true,
            description: p.description || `Zity Chef дэлгүүрийн шинэхэн ${name}.`,
            tags: ['Zity Chef', 'Live sync'],
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
        const mappedBundles: RecipeBundle[] = data.recipes.map((r: any, recipeIndex: number) => {
          const recipeId = String(r.id || `chef-recipe-${recipeIndex + 1}`);
          const title = r.title || r.name || `Zity Chef жор ${recipeIndex + 1}`;
          const ingredients = Array.isArray(r.ingredients) ? r.ingredients : [];

          return {
            id: `kit-${recipeId}`,
            recipeId,
            name: `${title} - Орц Багц`,
            description: r.titleEn || r.description || 'Zity Chef амттай хоолны шинэхэн орц',
            chefName: r.chefName || 'Chef Zity',
            prepTime: r.prepTime || r.cookTime || '25 мин',
            servings: getNumericValue(r.servings, 2),
            price: getNumericValue(r.price ?? r.totalPrice, 24500),
            discountPrice: getNumericValue(r.discountPrice ?? r.salePrice, 21900),
            image:
              r.image ||
              r.imageUrl ||
              'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
            productItems: ingredients.map((ing: any, i: number) => {
              const ingredientName = typeof ing === 'string' ? ing : ing.name || ing.productName || `Орц ${i + 1}`;

              return {
                productId: String((typeof ing === 'object' && (ing.productId || ing.id)) || `${recipeId}-ing-${i + 1}`),
                productName: ingredientName,
                requiredQty: getNumericValue(typeof ing === 'object' ? ing.requiredQty ?? ing.quantity : 1, 1),
                unit: (typeof ing === 'object' && ing.unit) || 'порц',
                pricePerUnit: getNumericValue(typeof ing === 'object' ? ing.pricePerUnit ?? ing.price : undefined, 3500),
              };
            }),
            instructions: r.steps
              ? r.steps.map((s: any, i: number) =>
                  typeof s === 'string'
                    ? s
                    : `Алхам ${s.stepNumber || i + 1}: ${s.title || ''}${s.description ? ` - ${s.description}` : ''}`
                )
              : undefined,
          };
        });

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

  static async fetchFridgeItems(): Promise<{ items: FridgeItem[]; isLive: boolean }> {
    try {
      const response = await fetch(`${BASE_URL}/api/inventory`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      const items = Array.isArray(data.inventory)
        ? data.inventory.map((item: any, idx: number) => ({
            id: item.id || `fridge-${idx + 1}`,
            name: item.name || 'Орц',
            category: item.category || 'Хүнсний ногоо',
            quantity: Number(item.quantity || 1),
            unit: item.unit || 'ш',
            expiryDays: Number(item.expiryDays || 7),
            lastSyncedAt: item.lastUpdated || new Date().toISOString(),
            source: item.source || 'Zity Chef',
          }))
        : [];

      if (items.length > 0) {
        return { items, isLive: true };
      }
    } catch (err) {
      console.warn('[ZityChefService] Inventory API unavailable, using local fridge data:', err);
    }

    return { items: this.fallbackFridgeItems, isLive: false };
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
            sku: item.sku,
            imageUrl: item.image,
            emoji: item.categorySlug === 'meat' ? '🥩' : '🥬',
            category: item.category,
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
