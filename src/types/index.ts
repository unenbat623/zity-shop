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
  /** Zity Chef backend-ээс live татагдсан эсэх */
  isLiveSynced?: boolean;
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
  /**
   * Уг орц дэлгүүрийн каталогт байгаа эсэх.
   *
   * `false` бол үнэ нь мэдэгдэхгүй тул багцын үнэд ОРОХГҮЙ, сагсанд ч
   * нэмэгдэхгүй. Тодорхойлоогүй бол (локал багцууд) байгаад тооцно.
   */
  isAvailable?: boolean;
}

export interface FridgeItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDays: number;
  lastSyncedAt: string;
  source: 'Zity Chef' | 'Odoo stock' | 'Zity Delguur';
  emoji?: string;
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
  isLiveSynced?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  /**
   * Каталогоос хасагдсан / олдохоо больсон бараа.
   *
   * Сагс localStorage-д хадгалагддаг тул хэдэн өдрийн өмнөх бараа дотор нь
   * үлдэж болно. Тэмдэглэгээгүй бол хэрэглэгч байхгүй бараа захиалж, ажилтан
   * биелүүлж чадахгүй захиалга авдаг.
   */
  isUnavailable?: boolean;
}

export type DeliveryMode = 'delivery' | 'pickup';

export interface DeliveryAddress {
  id: string;
  label?: string;
  district: string;
  khoroo: string;
  streetBuilding: string;
  entranceAppt: string;
  phone: string;
  notes?: string;
}

export type PaymentMethod = 'qpay' | 'socialpay' | 'monpay' | 'card' | 'cod';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export type OrderStatus = 'pending' | 'odoo_synced' | 'packing' | 'shipping' | 'delivered' | 'cancelled';

/** Гадаад систем рүү илгээсэн синхрончлолын үр дүн */
export interface IntegrationSyncState {
  status: 'pending' | 'success' | 'failed';
  message?: string;
  syncedAt?: string;
}

export interface Order {
  id: string;
  odooOrderRef: string;
  /** Zity Chef дээрх захиалгын дугаар (ZITY-xxxxxx). Давхардлыг таних түлхүүр. */
  chefOrderRef?: string;
  /** Chef DB-ээс уншсан захиалга эсэх — эдгээрийг локалаас цуцлах боломжгүй */
  isRemote?: boolean;
  createdAt: string;
  userId: string | null;
  items: CartItem[];
  deliveryMode: DeliveryMode;
  address: DeliveryAddress;
  pickupTime?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  totalAmount: number;
  couponCode?: string;
  status: OrderStatus;
  estimatedDeliveryTime?: string;
  odooSync: IntegrationSyncState;
  chefSync: IntegrationSyncState;
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

/** Supabase-аас ирсэн нэвтрэлтийн бүртгэл */
export interface AuthAccount {
  id: string;
  email: string;
  name: string;
  phone: string;
  avatarUrl: string;
  provider: 'google' | 'email';
  isEmailConfirmed: boolean;
  createdAt: string;
}

/** Тухайн хэрэглэгчийн апп доторх профайл (хаяг, оноо) */
export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  zityPoints: number;
  addresses: DeliveryAddress[];
  isZityChefConnected: boolean;
}

/** Admin dashboard-д харагдах нэгдсэн хэрэглэгчийн мөр */
export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: 'Zity Chef' | 'Zity Delguur' | 'Both';
  savedItems: number;
  orders: number;
  lastSeen: string;
}

/** Zity Chef backend холболтын төлөв */
export interface ChefConnectionState {
  status: 'unknown' | 'checking' | 'live' | 'offline';
  lastCheckedAt: string | null;
  message: string;
}
