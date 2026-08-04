import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { useOrderStore } from '../store/useOrderStore';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Database,
  CheckCircle2,
  Truck,
  PackageCheck,
  Copy,
  QrCode,
  Phone,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: 'Хүлээгдэж байна', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20', icon: Clock },
  odoo_synced: { label: 'Odoo ERP-д Бүртгэгдлээ', color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20', icon: Database },
  packing: { label: 'Бэлтгэж байна', color: 'text-indigo-500', bg: 'bg-indigo-500/10 border-indigo-500/20', icon: PackageCheck },
  shipping: { label: 'Хүргэгдэж байна', color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: Truck },
  delivered: { label: 'Хүргэгдсэн', color: 'text-emerald-600', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  cancelled: { label: 'Цуцлагдсан', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20', icon: Clock },
};

const TIMELINE_STEPS = [
  { status: 'pending', label: 'Захиалга Бүртгэгдсэн', desc: 'Системд хүлээн авлаа' },
  { status: 'odoo_synced', label: 'Odoo ERP Синк', desc: 'Sale Order үүсгэгдлээ' },
  { status: 'packing', label: 'Барааг Бэлтгэж байна', desc: 'Агуулахаас бэлдэж байна' },
  { status: 'shipping', label: 'Хүргэгдэж байна', desc: 'Хүргэлтийн ажилтан авч явна' },
  { status: 'delivered', label: 'Хүргэгдсэн', desc: 'Амжилттай хүлээлцлээ' },
];

const STATUS_STEP: Record<string, number> = {
  pending: 0,
  odoo_synced: 1,
  packing: 2,
  shipping: 3,
  delivered: 4,
  cancelled: -1,
};

export function OrderDetailScreen() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getOrderById } = useOrderStore();
  const order = getOrderById(id || '');

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-lg font-bold text-text-muted mb-4">Захиалга олдсонгүй</p>
          <button
            onClick={() => navigate('/orders')}
            className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white"
          >
            Захиалгууд руу буцах
          </button>
        </div>
      </div>
    );
  }

  const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConf.icon;
  const currentStep = STATUS_STEP[order.status] ?? 0;

  return (
    <div className="min-h-screen bg-background pb-28 text-text-main">
      <header className="sticky top-0 z-30 flex items-center justify-between bg-surface px-4 py-3.5 border-b border-border shadow-xs">
        <button onClick={() => navigate('/orders')} className="p-1 -ml-1">
          <ArrowLeft className="h-5 w-5 text-text-muted" />
        </button>
        <h1 className="text-sm font-extrabold text-text-main">Захиалга #{order.id}</h1>
        <span className={`text-[11px] font-bold ${statusConf.color}`}>{statusConf.label}</span>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Odoo Reference Card */}
        <div className="rounded-3xl bg-gradient-to-r from-emerald-900 to-teal-900 p-4 text-white border border-emerald-500/20 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-extrabold text-emerald-300">Odoo Sales Order</span>
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">{order.odooOrderRef}</p>
          <p className="text-[11px] text-emerald-200 mt-1">
            {new Date(order.createdAt).toLocaleString('mn-MN')}
          </p>

          <div className="mt-3 flex items-center justify-between bg-white/10 rounded-2xl p-2.5 border border-white/10">
            <div className="text-[10px] text-emerald-200 font-bold">Нийт Төлөгдсэн Дүн</div>
            <div className="text-base font-extrabold text-white">{order.totalAmount.toLocaleString()}₮</div>
          </div>
        </div>

        {/* Status Timeline */}
        {order.status !== 'cancelled' && (
          <div className="rounded-3xl bg-surface border border-border shadow-xs p-4">
            <h3 className="text-xs font-extrabold text-text-main mb-4 flex items-center gap-2">
              <Truck className="h-4 w-4 text-emerald-500" /> Захиалгын Явц
            </h3>
            <div className="space-y-0">
              {TIMELINE_STEPS.map((step, idx) => {
                const isCompleted = currentStep >= idx;
                const isCurrent = currentStep === idx;
                return (
                  <div key={step.status} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all ${
                          isCompleted
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-surface-hover border-border text-text-muted'
                        } ${isCurrent ? 'ring-2 ring-emerald-500/30 scale-110' : ''}`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <span className="text-[10px] font-bold">{idx + 1}</span>
                        )}
                      </div>
                      {idx < TIMELINE_STEPS.length - 1 && (
                        <div
                          className={`w-0.5 flex-1 my-1 transition-all ${
                            currentStep > idx ? 'bg-emerald-500' : 'bg-border'
                          }`}
                          style={{ minHeight: '24px' }}
                        />
                      )}
                    </div>
                    <div className="pb-4">
                      <p
                        className={`text-xs font-bold ${
                          isCompleted ? 'text-text-main' : 'text-text-muted'
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-[10px] text-text-muted">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="rounded-3xl bg-surface border border-border shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-text-main">Захиалсан Бараанууд</h3>
            <span className="text-[11px] text-text-muted">{order.items.length} ширхэг</span>
          </div>
          <div className="divide-y divide-border">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3">
                <img src={item.image} alt={item.name} className="h-14 w-14 rounded-2xl object-cover bg-surface-hover" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-text-main line-clamp-1">{item.name}</p>
                  <p className="text-[10px] font-mono text-text-muted">{item.sku}</p>
                  <p className="text-[11px] text-text-muted">× {item.quantity}</p>
                </div>
                <p className="text-xs font-extrabold text-text-main">
                  {((item.discountPrice || item.price) * item.quantity).toLocaleString()}₮
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Address */}
        <div className="rounded-3xl bg-surface border border-border shadow-xs p-4">
          <h3 className="text-xs font-extrabold text-text-main mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-emerald-500" />
            {order.deliveryMode === 'delivery' ? 'Хүргэлтийн Хаяг' : 'Очиж Авах Мэдээлэл'}
          </h3>
          <div className="space-y-1 text-xs text-text-muted">
            <p className="font-bold text-text-main">{order.address.district}, {order.address.khoroo}</p>
            <p>{order.address.streetBuilding}</p>
            <p>{order.address.entranceAppt}</p>
            <div className="flex items-center gap-1.5 mt-2 font-mono font-bold text-emerald-600">
              <Phone className="h-3.5 w-3.5" /> {order.address.phone}
            </div>
            {order.address.notes && <p className="text-emerald-600">📝 {order.address.notes}</p>}
            {order.pickupTime && (
              <p className="flex items-center gap-1 mt-1">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                Очих цаг: <strong className="text-text-main">{order.pickupTime}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Price Summary */}
        <div className="rounded-3xl bg-surface border border-border shadow-xs p-4 space-y-2 text-xs">
          <div className="flex justify-between text-text-muted">
            <span>Бараанууд</span>
            <span className="font-bold text-text-main">{order.subtotal.toLocaleString()}₮</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 font-bold">
              <span>Хямдрал</span>
              <span>-{order.discountAmount.toLocaleString()}₮</span>
            </div>
          )}
          <div className="flex justify-between text-text-muted">
            <span>Хүргэлт</span>
            <span>{order.deliveryFee === 0 ? <span className="text-emerald-600 font-bold">ҮНЭГҮЙ</span> : `${order.deliveryFee.toLocaleString()}₮`}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between font-extrabold text-sm text-text-main">
            <span>Нийт Төлсөн</span>
            <span className="text-emerald-600 text-base">{order.totalAmount.toLocaleString()}₮</span>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
