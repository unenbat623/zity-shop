import { describe, expect, it } from 'vitest';
import { createOrderId, trimOrders } from './useOrderStore';
import { Order, OrderStatus } from '../types';

function makeOrder(id: string, status: OrderStatus, createdAt: string): Order {
  return {
    id,
    odooOrderRef: '—',
    createdAt,
    userId: 'u1',
    items: [],
    deliveryMode: 'delivery',
    address: {
      id: 'a1',
      district: 'Сүхбаатар дүүрэг',
      khoroo: '1-р хороо',
      streetBuilding: 'Zity Center',
      entranceAppt: '',
      phone: '99112233',
    },
    paymentMethod: 'cod',
    paymentStatus: 'unpaid',
    subtotal: 0,
    discountAmount: 0,
    deliveryFee: 0,
    totalAmount: 0,
    status,
    odooSync: { status: 'pending' },
    chefSync: { status: 'pending' },
  };
}

describe('захиалгын дугаар', () => {
  it('дараалан үүсгэсэн дугаарууд давхцахгүй', () => {
    // Өмнөх хувилбар нь цагийн тамгаас 4 тэмдэгт авдаг байсан тул ~28 минут тутам
    // давтагддаг байв. Нэг агшинд үүсгэсэн дугаарууд ч ижил гарч болно.
    const ids = new Set(Array.from({ length: 10_000 }, () => createOrderId()));
    expect(ids.size).toBe(10_000);
  });

  it('ORD-ГГГГССӨӨ- хэлбэрийг хадгална', () => {
    expect(createOrderId()).toMatch(/^ORD-\d{8}-[0-9A-Z]+$/);
  });
});

describe('түүхийг хязгаарлах', () => {
  it('50-аас доош бол юу ч хасахгүй', () => {
    const orders = Array.from({ length: 10 }, (_, index) =>
      makeOrder(`o${index}`, 'delivered', new Date(2026, 0, index + 1).toISOString())
    );
    expect(trimOrders(orders)).toHaveLength(10);
  });

  it('хязгаараас хэтрэхэд хаагдсан хуучин захиалгыг л хасна', () => {
    const active = Array.from({ length: 5 }, (_, index) =>
      makeOrder(`active-${index}`, 'shipping', new Date(2026, 5, index + 1).toISOString())
    );
    const closed = Array.from({ length: 60 }, (_, index) =>
      makeOrder(`closed-${index}`, 'delivered', new Date(2026, 0, 1, 0, index).toISOString())
    );

    const trimmed = trimOrders([...active, ...closed]);

    expect(trimmed).toHaveLength(50);
    // Идэвхтэй захиалга бүгд үлдсэн байх ёстой — хэрэглэгч хүлээж байгаа захиалга
    active.forEach((order) => {
      expect(trimmed.some((item) => item.id === order.id)).toBe(true);
    });
  });

  it('идэвхтэй захиалга хязгаараас их байсан ч алдагдахгүй', () => {
    const active = Array.from({ length: 60 }, (_, index) =>
      makeOrder(`active-${index}`, 'pending', new Date(2026, 5, 1, 0, index).toISOString())
    );

    expect(trimOrders(active)).toHaveLength(60);
  });
});
