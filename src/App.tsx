/**
 * Zity Delguur - Official Store App
 * Odoo ERP + Zity Chef Integration
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomeScreen } from './screens/HomeScreen';
import { CartScreen } from './screens/CartScreen';
import { CheckoutScreen } from './screens/CheckoutScreen';
import { OrdersScreen } from './screens/OrdersScreen';
import { OrderDetailScreen } from './screens/OrderDetailScreen';
import { RecipeKitsScreen } from './screens/RecipeKitsScreen';
import { FridgeScreen } from './screens/FridgeScreen';
import { OdooAdminScreen } from './screens/OdooAdminScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { useThemeStore } from './store/useThemeStore';
import { useEffect } from 'react';

export default function App() {
  const { isDark } = useThemeStore();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/cart" element={<CartScreen />} />
        <Route path="/checkout" element={<CheckoutScreen />} />
        <Route path="/orders" element={<OrdersScreen />} />
        <Route path="/orders/:id" element={<OrderDetailScreen />} />
        <Route path="/recipe-kits" element={<RecipeKitsScreen />} />
        <Route path="/zity-fridge" element={<FridgeScreen />} />
        <Route path="/odoo-admin" element={<OdooAdminScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
      </Routes>
    </BrowserRouter>
  );
}
