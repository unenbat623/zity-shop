/**
 * Zity Delguur — Zity Chef ecosystem-ийн албан ёсны дэлгүүр
 * Odoo ERP + Zity Chef + Supabase Auth интеграцтай
 */

import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';

// Нүүр хуудсыг шууд оруулна — хэрэглэгчийн эхний харах зүйл
import { HomeScreen } from './screens/HomeScreen';

/**
 * Бусад хуудсыг хэрэгцээтэй үед нь татна.
 *
 * Ингэснээр эхний ачаалалтад admin dashboard, checkout зэрэг хүнд хуудсууд
 * орохгүй — bundle нэг том хэсэг байхын оронд route бүрээр хуваагдана.
 */
const CartScreen = lazy(() => import('./screens/CartScreen').then((m) => ({ default: m.CartScreen })));
const CheckoutScreen = lazy(() =>
  import('./screens/CheckoutScreen').then((m) => ({ default: m.CheckoutScreen }))
);
const OrdersScreen = lazy(() =>
  import('./screens/OrdersScreen').then((m) => ({ default: m.OrdersScreen }))
);
const OrderDetailScreen = lazy(() =>
  import('./screens/OrderDetailScreen').then((m) => ({ default: m.OrderDetailScreen }))
);
const RecipeKitsScreen = lazy(() =>
  import('./screens/RecipeKitsScreen').then((m) => ({ default: m.RecipeKitsScreen }))
);
const FridgeScreen = lazy(() =>
  import('./screens/FridgeScreen').then((m) => ({ default: m.FridgeScreen }))
);
const OdooAdminScreen = lazy(() =>
  import('./screens/OdooAdminScreen').then((m) => ({ default: m.OdooAdminScreen }))
);
const ProfileScreen = lazy(() =>
  import('./screens/ProfileScreen').then((m) => ({ default: m.ProfileScreen }))
);
const LoginScreen = lazy(() =>
  import('./screens/LoginScreen').then((m) => ({ default: m.LoginScreen }))
);
const NotFoundScreen = lazy(() =>
  import('./screens/NotFoundScreen').then((m) => ({ default: m.NotFoundScreen }))
);

import { RequireAuth } from './components/RequireAuth';
import { ToastHost } from './components/ui/ToastHost';

import { useThemeStore } from './store/useThemeStore';
import { useAuthStore } from './store/useAuthStore';
import { useOrderStore } from './store/useOrderStore';
import { useCatalogStore } from './store/useCatalogStore';

/** Хуудас солигдох бүрт дээшээ гүйлгэнэ */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return null;
}

/** Хуудас татагдаж байх үеийн зөөлөн байдал */
function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
    </div>
  );
}

export default function App() {
  const initTheme = useThemeStore((state) => state.initTheme);
  const initializeAuth = useAuthStore((state) => state.initialize);
  const startTracking = useOrderStore((state) => state.startTracking);
  const loadProducts = useCatalogStore((state) => state.loadProducts);

  // Theme: хадгалсан сонголт + OS-ийн өөрчлөлтийг сонсох
  useEffect(() => initTheme(), [initTheme]);

  // Auth: OAuth redirect уншиж, session сэргээх (нэг л удаа)
  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  // Захиалгын явцын хяналт — нэг interval, unmount дээр цэвэрлэгдэнэ
  useEffect(() => startTracking(), [startTracking]);

  // Каталогийг эхэнд нэг удаа татна. Ингэснээр дэлгүүрийн хуудсаар ороогүй ч
  // (жишээ нь шууд /cart руу орсон) Chef холболтын төлөв зөв харагдана.
  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  return (
    <BrowserRouter>
      <ScrollToTop />

      <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Нээлттэй хуудсууд */}
        <Route path="/" element={<HomeScreen />} />
        <Route path="/recipe-kits" element={<RecipeKitsScreen />} />
        <Route path="/cart" element={<CartScreen />} />
        <Route path="/login" element={<LoginScreen />} />

        {/* Нэвтрэлт шаардсан хуудсууд */}
        <Route
          path="/checkout"
          element={
            <RequireAuth>
              <CheckoutScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/orders"
          element={
            <RequireAuth>
              <OrdersScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <RequireAuth>
              <OrderDetailScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/zity-fridge"
          element={
            <RequireAuth>
              <FridgeScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfileScreen />
            </RequireAuth>
          }
        />

        {/* Зөвхөн admin */}
        <Route
          path="/odoo-admin"
          element={
            <RequireAuth adminOnly>
              <OdooAdminScreen />
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFoundScreen />} />
      </Routes>
      </Suspense>

      <ToastHost />
    </BrowserRouter>
  );
}
