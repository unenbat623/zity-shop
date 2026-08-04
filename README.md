# 🛒 Zity Shop (Zity Delguur WebApp)

Official e-commerce web application for **Zity Chef Complex**, integrated seamlessly with **Odoo ERP** backend for real-time stock management and order processing.

![Zity Shop](https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80)

## ✨ Key Features

- **🛒 Modern E-Commerce Storefront**: Professional mobile-first UI built with React 19, TypeScript, and Tailwind CSS.
- **🏬 Dual Delivery Modes**: Supports Express Door Delivery (30 mins) and Store Pickup (scheduled time slots).
- **📦 Odoo ERP Real-time Integration**:
  - Live stock level sync (`product.product`, `stock.quant`).
  - Automatic Sale Order creation (`sale.order`) in Odoo upon payment confirmation.
  - Interactive Odoo Sync Status dashboard and live RPC sync logs.
- **👨‍🍳 Zity Chef Ecosystem Sync**:
  - Browse Zity Chef curated Recipe Meal Kits (e.g. "Цуйван багц", "Авокадотой өндөгний тост").
  - One-click import of recipe ingredient bundles into cart.
  - Automatic synchronization of purchased grocery items directly into the user's **Zity Chef Fridge/Inventory** (`/api/inventory`).
- **💳 Multi-payment Gateway Simulator**: Instant QPay QR code generator with simulated bank payments (Khan Bank, Golomt, State Bank, Xac, Trade and Development Bank, SocialPay, MonPay).
- **📋 Real-time Order Tracking**: Visual 5-step order progress timeline (Order Received ➔ Odoo Synced ➔ Packing ➔ Shipping ➔ Delivered).
- **🌙 Dynamic Theme System**: Light and sleek dark mode support.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **State Management**: Zustand
- **Styling**: Tailwind CSS v4, Lucide Icons
- **Backend / Services**:
  - **Odoo ERP Service**: JSON-RPC connection simulation & endpoint handler (`odooService.ts`)
  - **Zity Chef Service**: Direct REST API integration with Zity Chef server on port 3002 (`zityChefService.ts`)

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/unenbat623/zity-shop.git
cd zity-shop
npm install
```

### 2. Configure Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_ODOO_URL=https://odoo.zity.mn
VITE_ODOO_DB=zity_delguur_db
VITE_ODOO_USERNAME=api_admin@zity.mn
VITE_ODOO_API_KEY=your_odoo_api_key

VITE_ZITY_CHEF_API_URL=http://localhost:3002
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) or [http://localhost:3001](http://localhost:3001) in your browser.

---

## 📁 Directory Structure

```
zity-shop/
├── src/
│   ├── components/      # UI components (Header, ProductCard, CategoryList, PaymentModal, BottomNav)
│   ├── constants/       # Mock catalog data, SKUs, and recipe bundles
│   ├── screens/         # Page screens (HomeScreen, CartScreen, CheckoutScreen, RecipeKitsScreen, etc.)
│   ├── services/        # Odoo ERP & Zity Chef API connection handlers
│   ├── store/           # Zustand state stores (Cart, Order, Auth, Odoo, Search, Theme)
│   ├── types/           # Comprehensive TypeScript interfaces
│   └── App.tsx          # Main routing & application wrapper
├── public/              # Static assets & icons
└── vite.config.ts       # Vite build & proxy configuration
```

---

## 📝 License

Distributed under the MIT License.
