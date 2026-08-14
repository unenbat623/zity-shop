import {
  ChefHat,
  LayoutDashboard,
  Package,
  Refrigerator,
  ShoppingCart,
  Store,
  User,
} from 'lucide-react';

export interface NavItem {
  path: string;
  label: string;
  icon: typeof Store;
  /** Нэвтрэлт шаардах эсэх */
  requiresAuth?: boolean;
  /** Admin эрх шаардах эсэх */
  adminOnly?: boolean;
  /** Мобайл доод цэсэнд харагдах эсэх */
  inBottomNav?: boolean;
}

/**
 * Навигацийн нэг эх сурвалж.
 *
 * Header, sidebar, drawer, bottom nav дөрвөл ижил жагсаалт хуваалцана —
 * шинэ хуудас нэмэхэд дөрвөн газар засах шаардлагагүй, зөрөх ч эрсдэлгүй.
 */
export const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Дэлгүүр', icon: Store, inBottomNav: true },
  { path: '/recipe-kits', label: 'Орц багц', icon: ChefHat, inBottomNav: true },
  { path: '/zity-fridge', label: 'Хөргөгч', icon: Refrigerator, requiresAuth: true, inBottomNav: true },
  { path: '/orders', label: 'Захиалга', icon: Package, requiresAuth: true, inBottomNav: true },
  { path: '/cart', label: 'Сагс', icon: ShoppingCart },
  { path: '/profile', label: 'Профайл', icon: User, requiresAuth: true },
  { path: '/odoo-admin', label: 'Admin', icon: LayoutDashboard, requiresAuth: true, adminOnly: true },
];

/** Тухайн хэрэглэгчид харагдах ёстой цэсийн элементүүд */
export function visibleNavItems(options: { isAdmin: boolean }): NavItem[] {
  return NAV_ITEMS.filter((item) => (item.adminOnly ? options.isAdmin : true));
}

/** Одоогийн зам цэсийн элементтэй таарч байгаа эсэх (дэд хуудсыг ч тооцно) */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.path === '/') return pathname === '/';
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
}
