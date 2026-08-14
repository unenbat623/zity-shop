/**
 * Zity Delguur — Zity Chef ecosystem-ийн албан ёсны дэлгүүр
 * Odoo ERP + Zity Chef + Supabase Auth интеграцтай
 */

import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';

import { HomeScreen } from './screens/HomeScreen';
import { CartScreen } from './screens/CartScreen';
import { CheckoutScreen } from './screens/CheckoutScreen';
import { OrdersScreen } from './screens/OrdersScreen';
import { OrderDetailScreen } from './screens/OrderDetailScreen';
import { RecipeKitsScreen } from './screens/RecipeKitsScreen';
import { FridgeScreen } from './screens/FridgeScreen';
import { OdooAdminScreen } from './screens/OdooAdminScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { LoginScreen } from './screens/LoginScreen';
import { NotFoundScreen } from './screens/NotFoundScreen';

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

      <ToastHost />
    </BrowserRouter>
  );
}
