import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { useOrderStore } from '../store/useOrderStore';
import { Order } from '../types';
import {
  PackageCheck,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  Database,
  ArrowRight,
  ShoppingBag,
  RefreshCw,
  MapPin,
  ChefHat,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  Order['status'],
  { label: string; color: string; bg: string; icon: any; step: number }
> = {
  pending: { label: 'Хүлээгдэж байна', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20', icon: Clock, step: 0 },
  odoo_synced: { label: 'Odoo ERP-д бүртгэгдлээ', color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20', icon: Database, step: 1 },
  packing: { label: 'Бэлтгэж байна', color: 'text-indigo-500', bg: 'bg-indigo-500/10 border-indigo-500/20', icon: PackageCheck, step: 2 },
  shipping: { label: 'Хүргэгдэж байна', color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: Truck, step: 3 },
  delivered: { label: 'Хүргэгдсэн', color: 'text-emerald-600', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2, step: 4 },
  cancelled: { label: 'Цуцлагдсан', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20', icon: XCircle, step: -1 },
};

const STEPS = ['Бүртгэгдсэн', 'Odoo Синк', 'Бэлтгэж байна', 'Хүргэж байна', 'Хүргэгдсэн'];

function OrderCard({ order, onClick }: { key?: string; order: Order; onClick: () => void }) {
  const statusConf = STATUS_CONFIG[order.status];
  const StatusIcon = statusConf.icon;
  const isActive = order.status !== 'delivered' && order.status !== 'cancelled';

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-3xl bg-surface border border-border shadow-xs hover:border-emerald-500/30 transition-all overflow-hidden"
    >
      {/* Header Row */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface-hover border-b border-border">
        <div>
          <span className="text-[10px] text-text-muted font-mono block">Захиалга #{order.id}</span>
          <span className="text-[10px] text-emerald-600 font-mono font-bold">Odoo: {order.odooOrderRef}</span>
        </div>
        <span
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusConf.color} ${statusConf.bg}`}
        >
          <StatusIcon className="h-3 w-3" />
          {statusConf.label}
        </span>
      </div>

      {/* Progress Tracker */}
      {order.status !== 'cancelled' && (
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-1">
            {STEPS.map((step, idx) => {
              const isCompleted = statusConf.step >= idx;
              const isCurrent = statusConf.step === idx;
              return (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`h-2.5 w-2.5 rounded-full border transition-all ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'bg-surface-hover border-border'
                      } ${isCurrent ? 'ring-2 ring-emerald-500/30 scale-125' : ''}`}
                    />
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 rounded-full transition-all ${
                        statusConf.step > idx ? 'bg-emerald-500' : 'bg-border'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <div className="flex justify-between mt-1">
            {STEPS.map((step, idx) => (
              <span
                key={idx}
                className={`text-[8px] font-bold leading-tight text-center ${
                  statusConf.step >= idx ? 'text-emerald-600' : 'text-text-muted'
                }`}
                style={{ width: `${100 / STEPS.length}%` }}
              >
                {step}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Order Items Preview */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex -space-x-2">
            {order.items.slice(0, 3).map((item) => (
              <img
                key={item.id}
                src={item.image}
                alt={item.name}
                className="h-10 w-10 rounded-xl object-cover border-2 border-surface shadow-xs"
              />
            ))}
            {order.items.length > 3 && (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-hover border-2 border-surface text-xs font-bold text-text-muted">
                +{order.items.length - 3}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-text-main line-clamp-1">
              {order.items.map((i) => i.name).join(', ')}
            </p>
            <p className="text-[10px] text-text-muted font-medium">
              {order.items.reduce((acc, i) => acc + i.quantity, 0)} ширхэг •{' '}
              {order.deliveryMode === 'delivery' ? '🚚 Хүргэлт' : '🏪 Очиж авах'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <span className="text-[10px] text-text-muted">Нийт</span>
            <span className="font-extrabold text-sm text-text-main block">
              {order.totalAmount.toLocaleString()}₮
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
            Дэлгэрэнгүй <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrdersScreen() {
  const navigate = useNavigate();
  const { orders } = useOrderStore();

  const activeOrders = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled');
  const pastOrders = orders.filter((o) => o.status === 'delivered' || o.status === 'cancelled');

  return (
    <div className="min-h-screen bg-background pb-28 text-text-main">
      <Header />

      <main className="max-w-2xl mx-auto px-4 pt-4">
        {/* Title */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-extrabold text-text-main flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-emerald-500" /> Захиалгууд
            </h1>
            <p className="text-xs text-text-muted">Odoo ERP дээр бүх захиалга бүртгэгдсэн</p>
          </div>
        </div>

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-extrabold text-text-main mb-3 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-emerald-500 animate-spin" />
              Идэвхтэй Захиалгууд ({activeOrders.length})
            </h2>
            <div className="space-y-4">
              {activeOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onClick={() => navigate(`/orders/${order.id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Past Orders */}
        {pastOrders.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-extrabold text-text-main mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-text-muted" />
              Өмнөх Захиалгууд ({pastOrders.length})
            </h2>
            <div className="space-y-3">
              {pastOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onClick={() => navigate(`/orders/${order.id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-surface border border-border">
              <ShoppingBag className="h-10 w-10 text-text-muted" />
            </div>
            <h2 className="text-base font-extrabold text-text-main mb-2">Захиалга байхгүй</h2>
            <p className="text-xs text-text-muted mb-6 max-w-xs">
              Дэлгүүрт зочлоод шинэ захиалга хийнэ үү. Зity Chef хоолны орц багцуудаас ч сонгож болно!
            </p>
            <button
              onClick={() => navigate('/')}
              className="rounded-2xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 flex items-center gap-2"
            >
              <ChefHat className="h-4 w-4" /> Дэлгүүр Хэсэх
            </button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
