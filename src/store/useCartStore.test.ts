import { beforeEach, describe, expect, it } from 'vitest';
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, MIN_ORDER_AMOUNT, useCartStore } from './useCartStore';
import { Product } from '../types';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    sku: 'TEST-001',
    name: 'Туршилтын бараа',
    price: 10_000,
    image: '',
    category: 'Хүнсний ногоо',
    categorySlug: 'vegetables',
    description: '',
    stock: 5,
    unit: 'кг',
    ...overrides,
  };
}

beforeEach(() => {
  useCartStore.getState().clearCart();
  useCartStore.setState({ deliveryMode: 'delivery' });
});

describe('нөөцийн хязгаар', () => {
  it('нөөцөөс илүү нэмэхийг зөвшөөрөхгүй', () => {
    const product = makeProduct({ stock: 3 });
    const store = useCartStore.getState();

    expect(store.addItem(product, 3).ok).toBe(true);
    expect(useCartStore.getState().getItemQuantity('p1')).toBe(3);

    // Нөөц дүүрсэн — дахин нэмэх боломжгүй
    const result = useCartStore.getState().addItem(product, 1);
    expect(result.ok).toBe(false);
    expect(useCartStore.getState().getItemQuantity('p1')).toBe(3);
  });

  it('нөөцөөс хэтэрсэн хүсэлтийг нөөцөөр хязгаарлана', () => {
    const product = makeProduct({ stock: 4 });
    const result = useCartStore.getState().addItem(product, 10);

    expect(result.ok).toBe(true);
    expect(useCartStore.getState().getItemQuantity('p1')).toBe(4);
  });

  it('нөөцгүй барааг огт нэмэхгүй', () => {
    const result = useCartStore.getState().addItem(makeProduct({ stock: 0 }));

    expect(result.ok).toBe(false);
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});

describe('дүнгийн тооцоо', () => {
  it('хямдралтай үнийг ашиглана', () => {
    useCartStore.getState().addItem(makeProduct({ price: 10_000, discountPrice: 8_000 }), 2);
    expect(useCartStore.getState().getSubtotal()).toBe(16_000);
  });

  it('купон хувиар хямдруулна', () => {
    useCartStore.getState().addItem(makeProduct({ price: 10_000, stock: 10 }), 3);
    useCartStore.getState().applyCoupon('zity10');

    expect(useCartStore.getState().getSubtotal()).toBe(30_000);
    expect(useCartStore.getState().getDiscountAmount()).toBe(3_000);
  });

  it('буруу купоныг хүлээж авахгүй', () => {
    const result = useCartStore.getState().applyCoupon('BURUU');
    expect(result.ok).toBe(false);
    expect(useCartStore.getState().discountPercentage).toBe(0);
  });

  it('босгоос доош дүнд хүргэлтийн төлбөр авна', () => {
    useCartStore.getState().addItem(makeProduct({ price: 12_000, stock: 10 }), 1);
    expect(useCartStore.getState().getDeliveryFee()).toBe(DELIVERY_FEE);
  });

  it('босго давсан үед хүргэлт үнэгүй', () => {
    useCartStore.getState().addItem(makeProduct({ price: FREE_DELIVERY_THRESHOLD, stock: 10 }), 1);
    expect(useCartStore.getState().getDeliveryFee()).toBe(0);
  });

  it('очиж авах үед хүргэлтийн төлбөргүй', () => {
    useCartStore.getState().addItem(makeProduct({ price: 12_000, stock: 10 }), 1);
    useCartStore.getState().setDeliveryMode('pickup');
    expect(useCartStore.getState().getDeliveryFee()).toBe(0);
  });

  it('нийт дүн = дүн - хямдрал + хүргэлт', () => {
    useCartStore.getState().addItem(makeProduct({ price: 20_000, stock: 10 }), 1);
    useCartStore.getState().applyCoupon('ZITY10');

    const store = useCartStore.getState();
    expect(store.getTotalPrice()).toBe(20_000 - 2_000 + DELIVERY_FEE);
  });

  it('нийт дүн сөрөг болохгүй', () => {
    useCartStore.getState().addItem(makeProduct({ price: 100, stock: 10 }), 1);
    useCartStore.setState({ discountPercentage: 100 });
    expect(useCartStore.getState().getTotalPrice()).toBeGreaterThanOrEqual(0);
  });
});

describe('checkout шалгалт', () => {
  it('хоосон сагсыг зогсооно', () => {
    expect(useCartStore.getState().getCheckoutIssue()).toBe('Сагс хоосон байна.');
  });

  it('хүргэлтийн доод дүнг шалгана', () => {
    useCartStore.getState().addItem(makeProduct({ price: MIN_ORDER_AMOUNT - 1_000, stock: 10 }), 1);
    expect(useCartStore.getState().getCheckoutIssue()).toContain('доод дүн');
  });

  it('очиж авах цаг сонгоогүйг илрүүлнэ', () => {
    useCartStore.getState().addItem(makeProduct({ price: 30_000, stock: 10 }), 1);
    useCartStore.getState().setDeliveryMode('pickup');
    expect(useCartStore.getState().getCheckoutIssue()).toBe('Очиж авах цагаа сонгоно уу.');
  });

  it('бүх нөхцөл хангагдсан үед асуудалгүй', () => {
    useCartStore.getState().addItem(makeProduct({ price: 30_000, stock: 10 }), 1);
    expect(useCartStore.getState().getCheckoutIssue()).toBeNull();
  });
});

describe('тоо ширхэг өөрчлөх', () => {
  it('1-ээс бууруулбал сагснаас хасагдана', () => {
    useCartStore.getState().addItem(makeProduct(), 1);
    useCartStore.getState().decreaseQuantity('p1');
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('setQuantity нөөцөөр хязгаарлагдана', () => {
    useCartStore.getState().addItem(makeProduct({ stock: 5 }), 1);
    const result = useCartStore.getState().setQuantity('p1', 99);

    expect(result.ok).toBe(false);
    expect(useCartStore.getState().getItemQuantity('p1')).toBe(5);
  });

  it('0 болговол хасагдана', () => {
    useCartStore.getState().addItem(makeProduct(), 2);
    useCartStore.getState().setQuantity('p1', 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
