export interface Product {
  id: string;
  odooId?: number;
  sku: string;
  name: string;
  price: number;
  discountPrice?: number;
  image: string;
  category: string;
  categorySlug: string;
  description: string;
  ingredients?: string;
  calories?: string;
  expiration?: string;
  stock: number;
  unit: string;
  brand?: string;
  isOrganic?: boolean;
  isMongolian?: boolean;
  tags?: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  itemCount?: number;
}

export interface RecipeIngredientItem {
  productId: string;
  productName: string;
  requiredQty: number;
  unit: string;
  pricePerUnit: number;
}

export interface FridgeItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDays: number;
  lastSyncedAt: string;
  source: 'Zity Chef' | 'Odoo stock';
}

export interface RecipeBundle {
  id: string;
  recipeId: string;
  name: string;
  chefName: string;
  description: string;
  prepTime: string;
  servings: number;
  price: number;
  discountPrice?: number;
  image: string;
  productItems: RecipeIngredientItem[];
  instructions?: string[];
}

export interface CartItem extends Product {
  quantity: number;
}

export type DeliveryMode = 'delivery' | 'pickup';

export interface DeliveryAddress {
  district: string;
  khoroo: string;
  streetBuilding: string;
  entranceAppt: string;
  phone: string;
  notes?: string;
}

export type PaymentMethod = 'qpay' | 'socialpay' | 'monpay' | 'card' | 'cod';

export type OrderStatus = 'pending' | 'odoo_synced' | 'packing' | 'shipping' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  odooOrderRef: string;
  createdAt: string;
  items: CartItem[];
  deliveryMode: DeliveryMode;
  address: DeliveryAddress;
  pickupTime?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: 'unpaid' | 'paid';
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  totalAmount: number;
  status: OrderStatus;
  estimatedDeliveryTime?: string;
}

export interface OdooConfig {
  url: string;
  db: string;
  username: string;
  apiKey: string;
  isConnected: boolean;
  autoSync: boolean;
  lastSyncTime: string | null;
}

export interface OdooSyncLog {
  id: string;
  timestamp: string;
  action: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  zityPoints: number;
  addresses: DeliveryAddress[];
  isZityChefConnected: boolean;
}
