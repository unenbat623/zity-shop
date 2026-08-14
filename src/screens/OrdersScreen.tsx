import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ChefHat,
  CheckCircle2,
  Clock,
  Database,
  Package,
  PackageCheck,
  ShoppingBag,
  Truck,
  XCircle,
} from 'lucide-react';

import { AppShell } from '../components/AppShell';
import { useOrderStore } from '../store/useOrderStore';
import { useAuthStore } from '../store/useAuthStore';
import { Order, OrderStatus } from '../types';
import { formatMnt, formatRelativeTime } from '../lib/format';

export const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; icon: typeof Clock; step: number }
> = {
  pending: {
    label: 'Хүлээгдэж байна',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10 border-amber-500/20',
    icon: Clock,
    step: 0,
  },
  odoo_synced: {
    label: 'Бүртгэгдлээ',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10 border-blue-500/20',
    icon: Database,
    step: 1,
  },
  packing: {
    label: 'Бэлтгэж байна',
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
    icon: PackageCheck,
    step: 2,
  },
  shipping: {
    label: 'Хүргэгдэж байна',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    icon: Truck,
    step: 3,
  },
  delivered: {
    label: 'Хүргэгдсэн',
    color: 'text-emerald-600',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    icon: CheckCircle2,
    step: 4,
  },
  cancelled: {
    label: 'Цуцлагдсан',
    color: 'text-red-500',
    bg: 'bg-red-500/10 border-red-500/20',
    icon: XCircle,
    step: -1,
  },
};

const STEPS = ['Бүртгэгдсэн', 'Синк', 'Бэлтгэл', 'Хүргэлт', 'Хүлээлгэн өгсөн'];

function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const statusConfig = STATUS_CONFIG[order.status];
  const StatusIcon = statusConfig.icon;
  const hasSyncIssue = order.odooSync.status === 'failed' || order.chefSync.status === 'failed';

  return (
    <button
      onClick={onClick}
      className="w-full overflow-hidden rounded-3xl border border-border bg-surface text-left shadow-xs transition-all hover:border-emerald-500/30"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border bg-surface-hover px-4 py-3">
        <div className="min-w-0">
          <span className="block font-mono text-[10px] text-text-muted">#{order.id}</span>
          <span className="block truncate font-mono text-[10px] font-bold text-emerald-600">
            Odoo: {order.odooOrderRef}
          </span>
        </div>
        <span
          className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusConfig.color} ${statusConfig.bg}`}
        >
          <StatusIcon className="h-3 w-3" />
          {statusConfig.label}
        </span>
      </div>

      {order.status !== 'cancelled' && (
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center gap-1">
            {STEPS.map((step, index) => (
              <React.Fragment key={step}>
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full border transition-all ${
                    statusConfig.step >= index
                      ? 'border-emerald-500 bg-emerald-500'
                      : 'border-border bg-surface-hover'
                  } ${statusConfig.step === index ? 'scale-125 ring-2 ring-emerald-500/30' : ''}`}
                />
                {index < STEPS.length - 1 && (
                  <span
                    className={`h-0.5 flex-1 rounded-full transition-all ${
                      statusConfig.step > index ? 'bg-emerald-500' : 'bg-border'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="mt-1 flex justify-between">
            {STEPS.map((step, index) => (
              <span
                key={step}
                className={`flex-1 text-center text-[8px] font-bold leading-tight ${
                  statusConfig.step >= index ? 'text-emerald-600' : 'text-text-subtle'
                }`}
              >
                {step}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 py-3">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex -space-x-2">
            {order.items.slice(0, 3).map((item) => (
              <img
                key={item.id}
                src={item.image}
                alt=""
                loading="lazy"
                className="h-10 w-10 rounded-xl border-2 border-surface object-cover shadow-xs"
              />
            ))}
            {order.items.length > 3 && (
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-surface bg-surface-hover text-xs font-bold text-text-muted">
                +{order.items.length - 3}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="line-clamp-1 text-xs font-bold text-text-main">
              {order.items.map((item) => item.name).join(', ')}
            </p>
            <p className="text-[10px] font-medium text-text-muted">
              {order.items.reduce((total, item) => total + item.quantity, 0)} ширхэг ·{' '}
              {order.deliveryMode === 'delivery' ? '🚚 Хүргэлт' : '🏪 Очиж авах'} ·{' '}
              {formatRelativeTime(order.createdAt)}
            </p>
          </div>
        </div>

        {hasSyncIssue && (
          <p className="mb-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5 text-[10px] font-bold text-amber-600">
            Синк амжилтгүй — дэлгэрэнгүйгээс дахин илгээнэ үү.
          </p>
        )}

        <div className="flex items-center justify-between border-t border-border pt-2">
          <div>
            <span className="text-[10px] text-text-muted">Нийт</span>
            <span className="block text-sm font-extrabold text-text-main">
              {formatMnt(order.totalAmount)}
            </span>
          </div>
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
            Дэлгэрэнгүй <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </button>
  );
}

export function OrdersScreen() {
  const navigate = useNavigate();
  const account = useAuthStore((state) => state.account);
  const orders = useOrderStore((state) => state.orders);

  const myOrders = orders.filter((order) => order.userId === (account?.id ?? null));
  const activeOrders = myOrders.filter(
    (order) => order.status !== 'delivered' && order.status !== 'cancelled'
  );
  const pastOrders = myOrders.filter(
    (order) => order.status === 'delivered' || order.status === 'cancelled'
  );

  return (
    <AppShell showSearch={false} title="Захиалгууд" maxWidth="md">
        <div className="mb-4">
          <h1 className="flex items-center gap-2 text-xl font-extrabold text-text-main">
            <Package className="h-5 w-5 text-emerald-500" /> Захиалгууд
          </h1>
          <p className="text-xs text-text-muted">Захиалгын явц болон синкийн төлөв</p>
        </div>

        {activeOrders.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-3 flex items-center gap-2 text-xs font-extrabold text-text-main">
              <Truck className="h-4 w-4 text-emerald-500" />
              Идэвхтэй захиалга ({activeOrders.length})
            </h2>
            <div className="space-y-4">
              {activeOrders.map((order) => (
                <OrderCard key={order.id} order={order} onClick={() => navigate(`/orders/${order.id}`)} />
              ))}
            </div>
          </section>
        )}

        {pastOrders.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-3 flex items-center gap-2 text-xs font-extrabold text-text-main">
              <CheckCircle2 className="h-4 w-4 text-text-muted" />
              Өмнөх захиалга ({pastOrders.length})
            </h2>
            <div className="space-y-3">
              {pastOrders.map((order) => (
                <OrderCard key={order.id} order={order} onClick={() => navigate(`/orders/${order.id}`)} />
              ))}
            </div>
          </section>
        )}

        {myOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full border border-border bg-surface">
              <ShoppingBag className="h-10 w-10 text-text-subtle" />
            </div>
            <h2 className="mb-2 text-base font-extrabold text-text-main">Захиалга байхгүй</h2>
            <p className="mb-6 max-w-xs text-xs leading-relaxed text-text-muted">
              Дэлгүүрт зочлоод анхны захиалгаа хийнэ үү. Zity Chef орц багцуудаас ч сонгож болно.
            </p>
            <button onClick={() => navigate('/')} className="zity-btn-primary px-6 py-3 text-xs">
              <ChefHat className="h-4 w-4" /> Дэлгүүр хэсэх
            </button>
          </div>
        )}
      </AppShell>
  );
}
