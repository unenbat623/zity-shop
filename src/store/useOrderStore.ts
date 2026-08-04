import { create } from 'zustand';
import { Order, CartItem, DeliveryAddress, DeliveryMode, PaymentMethod } from '../types';
import { odooService } from '../services/odooService';
import { ZityChefService } from '../services/zityChefService';

interface OrderState {
  orders: Order[];
  activeOrder: Order | null;
  createOrder: (
    items: CartItem[],
    deliveryMode: DeliveryMode,
    address: DeliveryAddress,
    pickupTime: string | null,
    paymentMethod: PaymentMethod,
    subtotal: number,
    discountAmount: number,
    deliveryFee: number,
    totalAmount: number
  ) => Promise<Order>;
  getOrderById: (id: string) => Order | undefined;
  updateOrderStatus: (id: string, status: Order['status']) => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [
    {
      id: 'ORD-2026-001',
      odooOrderRef: 'SO-2026-8819',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      items: [
        {
          id: 'p1',
          sku: 'ODOO-MEAT-001',
          name: 'Үхрийн цул мах (1кг)',
          price: 17500,
          image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&q=80',
          category: 'Мах, махан бүтээгдэхүүн',
          categorySlug: 'meat',
          description: 'Шинэхэн монгол үхрийн цул мах.',
          stock: 45,
          unit: 'кг',
          quantity: 1,
        },
        {
          id: 'p4',
          sku: 'ODOO-VEG-001',
          name: 'Монгол төмс (1кг)',
          price: 1500,
          image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&q=80',
          category: 'Хүнсний ногоо',
          categorySlug: 'vegetables',
          description: 'Шинэ ургацын Монгол хөрсний төмс.',
          stock: 200,
          unit: 'кг',
          quantity: 2,
        },
      ],
      deliveryMode: 'delivery',
      address: {
        district: 'Сүхбаатар дүүрэг',
        khoroo: '1-р хороо',
        streetBuilding: 'Zity Center, 402 тоот',
        entranceAppt: '2-р орц',
        phone: '99112233',
        notes: 'Үүдэнд үлдээнэ үү',
      },
      paymentMethod: 'qpay',
      paymentStatus: 'paid',
      subtotal: 20500,
      discountAmount: 0,
      deliveryFee: 3000,
      totalAmount: 23500,
      status: 'delivered',
      estimatedDeliveryTime: 'Хүргэгдсэн',
    },
  ],
  activeOrder: null,

  createOrder: async (
    items,
    deliveryMode,
    address,
    pickupTime,
    paymentMethod,
    subtotal,
    discountAmount,
    deliveryFee,
    totalAmount
  ) => {
    const orderId = `ORD-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newOrder: Order = {
      id: orderId,
      odooOrderRef: 'Бүртгэж байна...',
      createdAt: new Date().toISOString(),
      items,
      deliveryMode,
      address,
      pickupTime: pickupTime || undefined,
      paymentMethod,
      paymentStatus: 'paid',
      subtotal,
      discountAmount,
      deliveryFee,
      totalAmount,
      status: 'pending',
      estimatedDeliveryTime: deliveryMode === 'delivery' ? '30-45 минут' : '15-20 минут',
    };

    set((state) => ({
      orders: [newOrder, ...state.orders],
      activeOrder: newOrder,
    }));

    // 1. Send order to Odoo ERP
    const odooResult = await odooService.pushOrderToOdoo(newOrder);

    // 2. Sync Order & add ingredients into Zity Chef ecosystem / fridge
    await ZityChefService.syncOrderToZityChef(newOrder);

    // Update order with real Odoo Order Ref & change status to odoo_synced
    set((state) => ({
      orders: state.orders.map((ord) =>
        ord.id === orderId
          ? { ...ord, odooOrderRef: odooResult.odooOrderRef, status: 'odoo_synced' }
          : ord
      ),
      activeOrder:
        state.activeOrder?.id === orderId
          ? { ...state.activeOrder, odooOrderRef: odooResult.odooOrderRef, status: 'odoo_synced' }
          : state.activeOrder,
    }));

    // Simulate progression to packing -> shipping
    setTimeout(() => {
      get().updateOrderStatus(orderId, 'packing');
    }, 4000);

    setTimeout(() => {
      get().updateOrderStatus(orderId, 'shipping');
    }, 12000);

    return newOrder;
  },

  getOrderById: (id: string) => {
    return get().orders.find((order) => order.id === id);
  },

  updateOrderStatus: (id: string, status: Order['status']) => {
    set((state) => ({
      orders: state.orders.map((ord) => (ord.id === id ? { ...ord, status } : ord)),
      activeOrder: state.activeOrder?.id === id ? { ...state.activeOrder, status } : state.activeOrder,
    }));
  },
}));
