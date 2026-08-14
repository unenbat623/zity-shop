import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ChefHat,
  Clock,
  Copy,
  Database,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Truck,
} from 'lucide-react';

import { AppShell } from '../components/AppShell';
import { useOrderStore } from '../store/useOrderStore';
import { useToastStore } from '../store/useToastStore';
import { IntegrationSyncState } from '../types';
import { formatDateTime, formatMnt } from '../lib/format';
import { STATUS_CONFIG } from './OrdersScreen';

const TIMELINE_STEPS = [
  { label: 'Захиалга бүртгэгдсэн', desc: 'Системд хүлээн авлаа' },
  { label: 'Odoo ERP синк', desc: 'Sale order үүсгэгдлээ' },
  { label: 'Барааг бэлтгэж байна', desc: 'Агуулахаас бэлдэж байна' },
  { label: 'Хүргэгдэж байна', desc: 'Хүргэлтийн ажилтан авч явна' },
  { label: 'Хүргэгдсэн', desc: 'Амжилттай хүлээлцлээ' },
];

const PAYMENT_LABEL: Record<string, string> = {
  qpay: 'QPay',
  socialpay: 'SocialPay',
  monpay: 'MonPay',
  card: 'Банкны карт',
  cod: 'Бэлнээр',
};

export function OrderDetailScreen() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const showToast = useToastStore((state) => state.show);

  const order = useOrderStore((state) => state.orders.find((item) => item.id === id));
  const { retrySync, cancelOrder } = useOrderStore();
  const [isRetrying, setIsRetrying] = useState(false);

  if (!order) {
    return (
      <AppShell showSearch={false} title="Захиалга" maxWidth="md" backTo="/orders">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="mb-4 text-lg font-bold text-text-muted">Захиалга олдсонгүй</p>
          <button onClick={() => navigate('/orders')} className="zity-btn-primary px-6 py-3 text-sm">
            Захиалгууд руу буцах
          </button>
        </div>
      </AppShell>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status];
  const currentStep = statusConfig.step;
  const hasSyncIssue = order.odooSync.status === 'failed' || order.chefSync.status === 'failed';
  const canCancel = order.status === 'pending' || order.status === 'odoo_synced' || order.status === 'packing';

  const handleRetry = async () => {
    setIsRetrying(true);
    await retrySync(order.id);
    setIsRetrying(false);
    showToast('Синк дахин илгээгдлээ.', 'info');
  };

  const handleCancel = () => {
    const result = cancelOrder(order.id);
    showToast(result.message, result.ok ? 'info' : 'warning');
  };

  const handleCopyRef = async () => {
    try {
      await navigator.clipboard.writeText(order.odooOrderRef);
      showToast('Odoo reference хуулагдлаа.', 'success');
    } catch {
      showToast('Хуулж чадсангүй.', 'warning');
    }
  };

  return (
    <AppShell
      showSearch={false}
      title={`#${order.id}`}
      maxWidth="md"
      backTo="/orders"
      headerRight={
        <span className={`text-[11px] font-bold ${statusConfig.color}`}>{statusConfig.label}</span>
      }
    >
      <div className="space-y-4">
        {/* Odoo reference */}
        <section className="zity-brand-surface rounded-3xl p-4 shadow-xl">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-300" />
              <span className="text-xs font-extrabold text-emerald-300">Odoo sale.order</span>
            </span>
            <button
              onClick={() => void handleCopyRef()}
              className="flex shrink-0 items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-bold text-white transition-colors hover:bg-white/20"
            >
              <Copy className="h-3 w-3" /> Хуулах
            </button>
          </div>
          <p className="font-mono text-2xl font-extrabold text-white">{order.odooOrderRef}</p>
          <p className="mt-1 text-[11px] text-emerald-200">{formatDateTime(order.createdAt)}</p>

          <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 p-2.5">
            <span className="text-[10px] font-bold text-emerald-200">
              {order.paymentStatus === 'paid' ? 'Төлөгдсөн дүн' : 'Төлөх дүн'} ·{' '}
              {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
            </span>
            <span className="text-base font-extrabold text-white">{formatMnt(order.totalAmount)}</span>
          </div>
        </section>

        {/* Интеграцийн төлөв */}
        <section className="zity-card space-y-2 p-4">
          <h2 className="mb-1 flex items-center gap-2 text-xs font-extrabold text-text-main">
            <RefreshCw className="h-4 w-4 text-emerald-500" /> Интеграцийн төлөв
          </h2>

          <SyncRow icon={Database} label="Odoo ERP" state={order.odooSync} />
          <SyncRow icon={ChefHat} label="Zity Chef" state={order.chefSync} />

          {hasSyncIssue && (
            <button
              onClick={() => void handleRetry()}
              disabled={isRetrying}
              className="zity-btn-secondary mt-2 w-full py-2.5 text-xs"
            >
              {isRetrying ? (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
              ) : (
                <RefreshCw className="h-4 w-4 text-emerald-500" />
              )}
              Синк дахин илгээх
            </button>
          )}
        </section>

        {/* Явц */}
        {order.status !== 'cancelled' && (
          <section className="zity-card p-4">
            <h2 className="mb-4 flex items-center gap-2 text-xs font-extrabold text-text-main">
              <Truck className="h-4 w-4 text-emerald-500" /> Захиалгын явц
            </h2>
            <div>
              {TIMELINE_STEPS.map((step, index) => {
                const isCompleted = currentStep >= index;
                const isCurrent = currentStep === index;

                return (
                  <div key={step.label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all ${
                          isCompleted
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-border bg-surface-hover text-text-muted'
                        } ${isCurrent ? 'scale-110 ring-2 ring-emerald-500/30' : ''}`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <span className="text-[10px] font-bold">{index + 1}</span>
                        )}
                      </span>
                      {index < TIMELINE_STEPS.length - 1 && (
                        <span
                          className={`my-1 w-0.5 flex-1 transition-all ${
                            currentStep > index ? 'bg-emerald-500' : 'bg-border'
                          }`}
                          style={{ minHeight: '24px' }}
                        />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className={`text-xs font-bold ${isCompleted ? 'text-text-main' : 'text-text-muted'}`}>
                        {step.label}
                      </p>
                      <p className="text-[10px] text-text-muted">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {order.status === 'cancelled' && (
          <section className="flex items-center gap-2 rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-bold text-red-500">
            <Ban className="h-4 w-4 shrink-0" /> Энэ захиалга цуцлагдсан байна.
          </section>
        )}

        {/* Бараанууд */}
        <section className="zity-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-xs font-extrabold text-text-main">Захиалсан бараанууд</h2>
            <span className="text-[11px] text-text-muted">{order.items.length} нэр төрөл</span>
          </div>
          <div className="divide-y divide-border">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3">
                <img
                  src={item.image}
                  alt=""
                  loading="lazy"
                  className="h-14 w-14 shrink-0 rounded-2xl bg-surface-hover object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-xs font-bold text-text-main">{item.name}</p>
                  <p className="font-mono text-[10px] text-text-subtle">{item.sku}</p>
                  <p className="text-[11px] text-text-muted">
                    {formatMnt(item.discountPrice ?? item.price)} × {item.quantity}
                  </p>
                </div>
                <p className="shrink-0 text-xs font-extrabold text-text-main">
                  {formatMnt((item.discountPrice ?? item.price) * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Хаяг */}
        <section className="zity-card p-4">
          <h2 className="mb-3 flex items-center gap-2 text-xs font-extrabold text-text-main">
            <MapPin className="h-4 w-4 text-emerald-500" />
            {order.deliveryMode === 'delivery' ? 'Хүргэлтийн хаяг' : 'Очиж авах мэдээлэл'}
          </h2>
          <div className="space-y-1 text-xs text-text-muted">
            <p className="font-bold text-text-main">
              {order.address.district}, {order.address.khoroo}
            </p>
            <p>{order.address.streetBuilding}</p>
            {order.address.entranceAppt && <p>{order.address.entranceAppt}</p>}
            {order.address.phone && (
              <p className="mt-2 flex items-center gap-1.5 font-mono font-bold text-emerald-600">
                <Phone className="h-3.5 w-3.5" /> {order.address.phone}
              </p>
            )}
            {order.address.notes && <p className="text-emerald-600">📝 {order.address.notes}</p>}
            {order.pickupTime && (
              <p className="mt-1 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                Очих цаг: <strong className="text-text-main">{order.pickupTime}</strong>
              </p>
            )}
          </div>
        </section>

        {/* Дүн */}
        <section className="zity-card space-y-2 p-4 text-xs">
          <div className="flex justify-between text-text-muted">
            <span>Бараанууд</span>
            <span className="font-bold text-text-main">{formatMnt(order.subtotal)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between font-bold text-emerald-600">
              <span>Хямдрал{order.couponCode ? ` (${order.couponCode})` : ''}</span>
              <span>-{formatMnt(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-text-muted">
            <span>Хүргэлт</span>
            <span>
              {order.deliveryFee === 0 ? (
                <span className="font-bold text-emerald-600">ҮНЭГҮЙ</span>
              ) : (
                formatMnt(order.deliveryFee)
              )}
            </span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-sm font-extrabold text-text-main">
            <span>Нийт</span>
            <span className="text-base text-emerald-600">{formatMnt(order.totalAmount)}</span>
          </div>
        </section>

        {canCancel && (
          <button
            onClick={handleCancel}
            className="w-full rounded-2xl border border-red-500/20 bg-red-500/10 py-3 text-xs font-bold text-red-500 transition-colors hover:bg-red-500/20"
          >
            Захиалга цуцлах
          </button>
        )}
      </div>
    </AppShell>
  );
}

function SyncRow({
  icon: Icon,
  label,
  state,
}: {
  icon: typeof Database;
  label: string;
  state: IntegrationSyncState;
}) {
  const config = {
    success: { text: 'Амжилттай', className: 'text-emerald-600', Badge: CheckCircle2 },
    failed: { text: 'Амжилтгүй', className: 'text-red-500', Badge: AlertTriangle },
    pending: { text: 'Хүлээгдэж байна', className: 'text-amber-500', Badge: Clock },
  }[state.status];

  const Badge = config.Badge;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface-hover p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-text-main">{label}</span>
          <span className={`flex shrink-0 items-center gap-1 text-[11px] font-bold ${config.className}`}>
            <Badge className="h-3 w-3" /> {config.text}
          </span>
        </div>
        {state.message && <p className="mt-0.5 text-[10px] leading-relaxed text-text-muted">{state.message}</p>}
      </div>
    </div>
  );
}
