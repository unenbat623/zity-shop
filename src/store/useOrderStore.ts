import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  CartItem,
  DeliveryAddress,
  DeliveryMode,
  Order,
  OrderStatus,
  PaymentMethod,
} from '../types';
import { odooService } from '../services/odooService';
import { ZityChefService } from '../services/zityChefService';
import { useAuthStore } from './useAuthStore';
import { useCatalogStore } from './useCatalogStore';

/**
 * Захиалгын төлөв.
 *
 * Захиалга үүсэх нь гадаад системээс хамаарахгүй: эхлээд локал захиалга үүсээд,
 * дараа нь Odoo болон Zity Chef рүү синк хийгдэнэ. Синк амжилтгүй болбол
 * захиалга алдагдахгүй, зөвхөн `odooSync` / `chefSync` төлөв "failed" болно
 * бөгөөд дахин оролдох боломжтой.
 */

/** Захиалгын явцын симуляц — захиалга үүссэнээс хойших хугацаа (ms) */
const PROGRESS_TIMELINE: { status: OrderStatus; afterMs: number }[] = [
  { status: 'packing', afterMs: 30_000 },
  { status: 'shipping', afterMs: 120_000 },
  { status: 'delivered', afterMs: 420_000 },
];

const STATUS_ORDER: OrderStatus[] = ['pending', 'odoo_synced', 'packing', 'shipping', 'delivered'];

/** Захиалгын дүнгийн 1%-ийг Zity Point болгож олгоно */
const POINTS_RATE = 0.01;

export interface CreateOrderInput {
  items: CartItem[];
  deliveryMode: DeliveryMode;
  address: DeliveryAddress;
  pickupTime: string | null;
  paymentMethod: PaymentMethod;
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  totalAmount: number;
  couponCode?: string;
}

interface OrderState {
  orders: Order[];
  isCreating: boolean;
  isSyncingFromChef: boolean;
  /** Chef DB-ээс сүүлд амжилттай татсан хугацаа */
  chefOrdersFetchedAt: number | null;

  createOrder: (input: CreateOrderInput) => Promise<Order>;
  getOrderById: (id: string) => Order | undefined;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  cancelOrder: (id: string) => { ok: boolean; message: string };
  /** Синк амжилтгүй болсон захиалгыг дахин илгээх */
  retrySync: (id: string) => Promise<void>;
  /** Chef DB-ээс захиалгуудыг татаж локалтай нэгтгэнэ */
  syncFromChef: (options?: { force?: boolean }) => Promise<void>;
  /** Захиалгын явцыг автоматаар ахиулна. Цэвэрлэх функц буцаана. */
  startTracking: () => () => void;
  /** Одоогийн хэрэглэгчийн захиалгууд (зочин үед локал захиалгууд) */
  getVisibleOrders: (userId: string | null) => Order[];
}

function createOrderId(): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const unique = now.getTime().toString(36).slice(-4).toUpperCase();
  return `ORD-${stamp}-${unique}`;
}

function statusRank(status: OrderStatus): number {
  const index = STATUS_ORDER.indexOf(status);
  return index === -1 ? -1 : index;
}

/** Chef-ээс дахин татахгүй байх хугацаа */
const CHEF_ORDERS_FRESH_MS = 30_000;

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      isCreating: false,
      isSyncingFromChef: false,
      chefOrdersFetchedAt: null,

      createOrder: async (input) => {
        set({ isCreating: true });

        const account = useAuthStore.getState().account;
        const orderId = createOrderId();

        const newOrder: Order = {
          id: orderId,
          odooOrderRef: '—',
          createdAt: new Date().toISOString(),
          userId: account?.id ?? null,
          items: input.items,
          deliveryMode: input.deliveryMode,
          address: input.address,
          pickupTime: input.pickupTime || undefined,
          paymentMethod: input.paymentMethod,
          // Бэлнээр төлөх захиалга хүргэгдэх хүртэл төлөгдөөгүй хэвээр
          paymentStatus: input.paymentMethod === 'cod' ? 'unpaid' : 'paid',
          subtotal: input.subtotal,
          discountAmount: input.discountAmount,
          deliveryFee: input.deliveryFee,
          totalAmount: input.totalAmount,
          couponCode: input.couponCode,
          status: 'pending',
          estimatedDeliveryTime: input.deliveryMode === 'delivery' ? '30-45 минут' : '15-20 минут',
          odooSync: { status: 'pending' },
          chefSync: { status: 'pending' },
        };

        set((state) => ({ orders: [newOrder, ...state.orders] }));

        // Odoo болон Chef рүү зэрэг синк — аль нэг нь унасан ч нөгөө нь үргэлжилнэ
        const [odooResult, chefResult] = await Promise.allSettled([
          odooService.pushOrderToOdoo(newOrder),
          ZityChefService.syncOrder(newOrder),
        ]);

        const odooSync: Order['odooSync'] =
          odooResult.status === 'fulfilled' && odooResult.value.success
            ? {
                status: 'success',
                message: `Odoo sale.order үүслээ: ${odooResult.value.odooOrderRef}`,
                syncedAt: new Date().toISOString(),
              }
            : {
                status: 'failed',
                message:
                  odooResult.status === 'rejected'
                    ? 'Odoo ERP рүү илгээж чадсангүй.'
                    : 'Odoo ERP захиалга үүсгэсэнгүй.',
              };

        const chefOrderRef =
          chefResult.status === 'fulfilled' ? chefResult.value.chefOrderRef : undefined;

        const chefSync: Order['chefSync'] =
          chefResult.status === 'fulfilled' && chefResult.value.success
            ? { status: 'success', message: chefResult.value.message, syncedAt: new Date().toISOString() }
            : {
                status: 'failed',
                message:
                  chefResult.status === 'fulfilled'
                    ? chefResult.value.message
                    : 'Zity Chef рүү илгээж чадсангүй.',
              };

        const odooOrderRef =
          odooResult.status === 'fulfilled' && odooResult.value.success
            ? odooResult.value.odooOrderRef
            : 'Синк амжилтгүй';

        set((state) => ({
          isCreating: false,
          orders: state.orders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  odooOrderRef,
                  chefOrderRef,
                  odooSync,
                  chefSync,
                  status: odooSync.status === 'success' ? 'odoo_synced' : 'pending',
                }
              : order
          ),
        }));

        // Zity Point олгоно (зөвхөн нэвтэрсэн хэрэглэгчид)
        if (account) {
          useAuthStore.getState().addPoints(Math.round(input.totalAmount * POINTS_RATE));
        }

        return get().getOrderById(orderId) ?? newOrder;
      },

      getOrderById: (id) => get().orders.find((order) => order.id === id),

      updateOrderStatus: (id, status) => {
        set((state) => ({
          orders: state.orders.map((order) => {
            if (order.id !== id) return order;
            return {
              ...order,
              status,
              // Бэлнээр төлөх захиалга хүргэгдсэн үед төлөгдсөнд тооцогдоно
              paymentStatus:
                status === 'delivered' && order.paymentMethod === 'cod' ? 'paid' : order.paymentStatus,
              estimatedDeliveryTime: status === 'delivered' ? 'Хүргэгдсэн' : order.estimatedDeliveryTime,
            };
          }),
        }));
      },

      cancelOrder: (id) => {
        const order = get().getOrderById(id);
        if (!order) return { ok: false, message: 'Захиалга олдсонгүй.' };

        // Chef дээр үүссэн захиалгыг Delguur-ээс цуцлах API байхгүй —
        // локал төлвийг л өөрчилвөл хоёр систем зөрнө
        if (order.isRemote) {
          return { ok: false, message: 'Энэ захиалгыг Zity Chef аппаас цуцална уу.' };
        }

        if (order.status === 'delivered') {
          return { ok: false, message: 'Хүргэгдсэн захиалгыг цуцлах боломжгүй.' };
        }
        if (order.status === 'cancelled') {
          return { ok: false, message: 'Захиалга аль хэдийн цуцлагдсан байна.' };
        }
        if (order.status === 'shipping') {
          return { ok: false, message: 'Хүргэлтэд гарсан захиалгыг цуцлах боломжгүй. Оператортой холбогдоно уу.' };
        }

        set((state) => ({
          orders: state.orders.map((item) =>
            item.id === id ? { ...item, status: 'cancelled' as OrderStatus } : item
          ),
        }));
        return { ok: true, message: `${id} захиалга цуцлагдлаа.` };
      },

      retrySync: async (id) => {
        const order = get().getOrderById(id);
        if (!order) return;

        const tasks: Promise<void>[] = [];

        if (order.odooSync.status === 'failed') {
          tasks.push(
            odooService
              .pushOrderToOdoo(order)
              .then((result) => {
                set((state) => ({
                  orders: state.orders.map((item) =>
                    item.id === id
                      ? {
                          ...item,
                          odooOrderRef: result.odooOrderRef,
                          odooSync: {
                            status: 'success',
                            message: `Odoo sale.order үүслээ: ${result.odooOrderRef}`,
                            syncedAt: new Date().toISOString(),
                          },
                          status: statusRank(item.status) < 1 ? 'odoo_synced' : item.status,
                        }
                      : item
                  ),
                }));
              })
              .catch(() => undefined)
          );
        }

        if (order.chefSync.status === 'failed') {
          tasks.push(
            ZityChefService.syncOrder(order).then((result) => {
              set((state) => ({
                orders: state.orders.map((item) =>
                  item.id === id
                    ? {
                        ...item,
                        chefSync: {
                          status: result.success ? 'success' : 'failed',
                          message: result.message,
                          syncedAt: result.success ? new Date().toISOString() : undefined,
                        },
                      }
                    : item
                ),
              }));
            })
          );
        }

        await Promise.allSettled(tasks);
      },

      /**
       * Chef DB-ээс захиалгуудыг татаж локалтай нэгтгэнэ.
       *
       * Нэгтгэх дүрэм:
       *  - Локал захиалга нь илүү дэлгэрэнгүй (хаяг, SKU, Odoo ref) тул давуу эрхтэй.
       *    Chef-ээс зөвхөн ТӨЛӨВ-ийг нь авч шинэчилнэ.
       *  - Chef дээр байгаа боловч локалд байхгүй захиалгыг (өөр төхөөрөмж эсвэл
       *    Chef аппаас хийсэн) уншиж нэмнэ.
       */
      syncFromChef: async (options) => {
        const account = useAuthStore.getState().account;
        if (!account) return;

        const state = get();
        if (state.isSyncingFromChef) return;
        if (
          !options?.force &&
          state.chefOrdersFetchedAt &&
          Date.now() - state.chefOrdersFetchedAt < CHEF_ORDERS_FRESH_MS
        ) {
          return;
        }

        set({ isSyncingFromChef: true });

        const result = await ZityChefService.fetchOrders(useCatalogStore.getState().products);

        if (!result.isLive) {
          set({ isSyncingFromChef: false });
          return;
        }

        set((current) => {
          const remoteByRef = new Map(result.data.map((order) => [order.chefOrderRef, order]));

          // 1) Локал захиалгын төлвийг Chef-ийн төлвөөр шинэчилнэ
          const merged = current.orders.map((local) => {
            const remote = local.chefOrderRef ? remoteByRef.get(local.chefOrderRef) : undefined;
            if (!remote) return local;

            remoteByRef.delete(local.chefOrderRef!);

            // Chef дээр цуцлагдсан/хүргэгдсэн бол локал төлвийг дагуулна
            const shouldAdoptStatus =
              remote.status === 'cancelled' || statusRank(remote.status) > statusRank(local.status);

            return shouldAdoptStatus ? { ...local, status: remote.status } : local;
          });

          // 2) Зөвхөн Chef дээр байгаа захиалгуудыг нэмнэ
          const remoteOnly = Array.from(remoteByRef.values()).map((order) => ({
            ...order,
            userId: account.id,
          }));

          const all = [...merged, ...remoteOnly].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          return { orders: all, isSyncingFromChef: false, chefOrdersFetchedAt: Date.now() };
        });
      },

      /**
       * Захиалгын явцыг нэг interval-аар ахиулна.
       *
       * Өмнөх хувилбар захиалга бүрт `setTimeout` үүсгэдэг байсан — хуудас сэргээхэд
       * захиалга "packing" төлөвт царцдаг, timer нь цэвэрлэгддэггүй байв. Одоо явцыг
       * `createdAt`-аас тооцдог тул reload хийсэн ч зөв үргэлжилнэ.
       */
      startTracking: () => {
        const tick = () => {
          const now = Date.now();

          get().orders.forEach((order) => {
            if (order.status === 'cancelled' || order.status === 'delivered') return;
            // Odoo синк амжилтгүй захиалгыг автоматаар урагшлуулахгүй
            if (order.odooSync.status !== 'success') return;

            const elapsed = now - new Date(order.createdAt).getTime();
            const reached = PROGRESS_TIMELINE.filter((step) => elapsed >= step.afterMs);
            if (reached.length === 0) return;

            const target = reached[reached.length - 1].status;
            if (statusRank(target) > statusRank(order.status)) {
              get().updateOrderStatus(order.id, target);
            }
          });
        };

        tick();
        const intervalId = setInterval(tick, 5_000);
        return () => clearInterval(intervalId);
      },

      getVisibleOrders: (userId) =>
        get().orders.filter((order) => order.userId === userId || order.userId === null),
    }),
    {
      name: 'zity-orders',
      partialize: (state) => ({ orders: state.orders }),
    }
  )
);
