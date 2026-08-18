import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  Database,
  MapPin,
  Minus,
  Plus,
  ShoppingCart,
  Tag,
  Trash2,
} from 'lucide-react';

import { AppShell } from '../components/AppShell';
import {
  FREE_DELIVERY_THRESHOLD,
  useCartStore,
} from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { formatMnt } from '../lib/format';

const PICKUP_SLOTS = [
  '10:00 - 10:30',
  '11:00 - 11:30',
  '12:00 - 12:30',
  '14:00 - 14:30',
  '16:00 - 16:30',
  '18:00 - 18:30',
  '20:00 - 20:30',
];

export function CartScreen() {
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.show);

  const {
    items,
    deliveryMode,
    setDeliveryMode,
    pickupTime,
    setPickupTime,
    addItem,
    decreaseQuantity,
    removeItem,
    couponCode,
    discountPercentage,
    applyCoupon,
    removeCoupon,
    getSubtotal,
    getDiscountAmount,
    getDeliveryFee,
    getTotalPrice,
    getTotalItems,
    getCheckoutIssue,
  } = useCartStore();

  const account = useAuthStore((state) => state.account);
  const selectedAddress = useAuthStore((state) => state.getSelectedAddress());

  const [inputCoupon, setInputCoupon] = useState('');

  const subtotal = getSubtotal();
  const remainingForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const checkoutIssue = getCheckoutIssue();

  const handleApplyCoupon = (event: FormEvent) => {
    event.preventDefault();
    const result = applyCoupon(inputCoupon);
    showToast(result.message, result.ok ? 'success' : 'warning');
    if (result.ok) setInputCoupon('');
  };

  const handleIncrease = (productId: string) => {
    const item = items.find((cartItem) => cartItem.id === productId);
    if (!item) return;
    const result = addItem(item, 1);
    if (!result.ok) showToast(result.message, 'warning');
  };

  const handleCheckout = () => {
    if (checkoutIssue) {
      showToast(checkoutIssue, 'warning');
      return;
    }
    // Нэвтрээгүй бол login руу, дараа нь автоматаар checkout руу буцаана
    navigate(account ? '/checkout' : '/login', account ? undefined : { state: { from: '/checkout' } });
  };

  if (items.length === 0) {
    return (
      <AppShell showSearch={false} title="Миний сагс" maxWidth="md" backTo="/">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
            <ShoppingCart className="h-10 w-10" />
          </div>
          <h2 className="mb-2 text-lg font-extrabold text-text-main">Сагс хоосон байна</h2>
          <p className="mb-6 max-w-xs text-xs leading-relaxed text-text-muted">
            Zity Chef орц багц болон дэлгүүрийн бараанаас сагсандаа нэмээд захиалгаа өгөөрэй.
          </p>
          <button onClick={() => navigate('/')} className="zity-btn-primary px-8 py-3.5 text-xs">
            Дэлгүүр хэсэх
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      showSearch={false}
      title={`Миний сагс (${getTotalItems()})`}
      maxWidth="lg"
      backTo="/"
      headerRight={
        <span className="hidden items-center gap-1 text-xs font-bold text-emerald-600 sm:flex">
          <Database className="h-3.5 w-3.5" /> Нөөцтэй тулгасан
        </span>
      }
      stickyFooterHideFrom="md"
      stickyFooter={
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="block text-[10px] font-bold text-text-muted">Нийт төлөх</span>
            <span className="text-xl font-extrabold text-emerald-600">{formatMnt(getTotalPrice())}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={Boolean(checkoutIssue)}
            className="zity-btn-primary flex-1 py-3.5 text-xs"
          >
            Үргэлжлүүлэх
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="space-y-4 md:col-span-7">
            {/* Хүргэлт / очиж авах */}
            <div className="flex rounded-2xl border border-border bg-surface-hover p-1">
              {(
                [
                  { mode: 'delivery' as const, label: 'Хүргүүлэх (30 мин)' },
                  { mode: 'pickup' as const, label: 'Очиж авах' },
                ]
              ).map((option) => (
                <button
                  key={option.mode}
                  onClick={() => setDeliveryMode(option.mode)}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-extrabold transition-all ${
                    deliveryMode === option.mode
                      ? 'border border-border bg-surface text-emerald-600 shadow-xs'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                  aria-pressed={deliveryMode === option.mode}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Хаяг / очих цаг */}
            <div className="zity-card p-4">
              {deliveryMode === 'delivery' ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
                      <MapPin className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      {selectedAddress ? (
                        <>
                          <p className="truncate text-xs font-bold text-text-main">
                            {selectedAddress.district}, {selectedAddress.khoroo}
                          </p>
                          <p className="truncate text-[11px] text-text-muted">
                            {selectedAddress.streetBuilding}
                          </p>
                        </>
                      ) : (
                        <p className="text-[11px] text-text-muted">
                          {account
                            ? 'Хүргэлтийн хаяг хадгалаагүй байна.'
                            : 'Нэвтрээд хүргэлтийн хаягаа нэмнэ үү.'}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(account ? '/profile' : '/login')}
                    className="-my-2 shrink-0 px-2 py-2 text-xs font-bold text-emerald-600 hover:underline"
                  >
                    {selectedAddress ? 'Солих' : 'Нэмэх'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-500">
                      <MapPin className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-text-main">Zity Delguur — Төв салбар</p>
                      <p className="text-[11px] text-text-muted">Сөүлийн гудамж, 1-р хороо (Zity Center)</p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3">
                    <label htmlFor="pickup-time" className="mb-1.5 block text-xs font-bold text-text-main">
                      Очиж авах цаг сонгох
                    </label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0 text-emerald-500" />
                      <select
                        id="pickup-time"
                        value={pickupTime ?? ''}
                        onChange={(event) => setPickupTime(event.target.value || null)}
                        className="zity-input flex-1"
                      >
                        <option value="">Цаг сонгоно уу</option>
                        {PICKUP_SLOTS.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Барааны жагсаалт */}
            <div className="space-y-3">
              {items.map((item) => {
                const isUnavailable = item.isUnavailable === true;
                const isOverStock = !isUnavailable && item.quantity > item.stock;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 rounded-3xl border bg-surface p-3 shadow-xs sm:p-4 ${
                      isUnavailable
                        ? 'border-red-500/40'
                        : isOverStock
                          ? 'border-amber-500/40'
                          : 'border-border'
                    }`}
                  >
                    <img
                      src={item.image}
                      alt=""
                      loading="lazy"
                      className="h-20 w-20 shrink-0 rounded-2xl bg-surface-hover object-cover sm:h-24 sm:w-24"
                    />

                    <div className="flex min-w-0 flex-1 flex-col py-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="line-clamp-1 text-xs font-bold text-text-main sm:text-sm">
                            {item.name}
                          </h3>
                          <span className="block font-mono text-[10px] text-text-subtle">{item.sku}</span>
                          <span className="text-[10px] text-text-muted">
                            {formatMnt(item.discountPrice ?? item.price)} / {item.unit}
                          </span>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-hover hover:text-red-500"
                          aria-label={`${item.name} хасах`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {isUnavailable ? (
                        <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-red-500">
                          <AlertTriangle className="h-3 w-3 shrink-0" /> Дэлгүүрт байхгүй болсон —
                          сагснаас хасна уу
                        </p>
                      ) : (
                        isOverStock && (
                          <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-amber-500">
                            <AlertTriangle className="h-3 w-3" /> Нөөц {item.stock} {item.unit} л байна
                          </p>
                        )
                      )}

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-extrabold text-text-main sm:text-base">
                          {formatMnt((item.discountPrice ?? item.price) * item.quantity)}
                        </div>

                        <div className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-surface-hover px-2 py-1">
                          <button
                            onClick={() => decreaseQuantity(item.id)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-text-main shadow-xs transition-all hover:bg-border active:scale-95"
                            aria-label="Тоо хасах"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-text-main">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleIncrease(item.id)}
                            disabled={item.quantity >= item.stock}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-text-main shadow-xs transition-all hover:bg-border active:scale-95 disabled:opacity-40"
                            aria-label="Тоо нэмэх"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Дүн */}
          <div className="space-y-4 md:col-span-5">
            <div className="zity-card p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <Tag className="h-4 w-4 text-emerald-500" />
                <h2 className="text-xs font-bold text-text-main">Промо код</h2>
              </div>

              {couponCode ? (
                <div className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                  <div>
                    <span className="text-xs font-extrabold text-emerald-600">{couponCode}</span>
                    <span className="block text-[11px] text-emerald-600">
                      {discountPercentage}% хямдрал идэвхтэй
                    </span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="-my-2 shrink-0 px-2 py-2 text-xs font-bold text-red-500 hover:underline"
                  >
                    Устгах
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={inputCoupon}
                    onChange={(event) => setInputCoupon(event.target.value.toUpperCase())}
                    placeholder="ZITYCHEF2026"
                    aria-label="Промо код"
                    className="zity-input flex-1 uppercase"
                  />
                  <button type="submit" className="zity-btn-primary px-4 py-2 text-xs">
                    Ашиглах
                  </button>
                </form>
              )}
            </div>

            <div className="zity-card space-y-3 p-4 text-xs sm:p-5 sm:text-sm">
              <div className="flex justify-between text-text-muted">
                <span>Барааны дүн</span>
                <span className="font-bold text-text-main">{formatMnt(subtotal)}</span>
              </div>

              {discountPercentage > 0 && (
                <div className="flex justify-between font-bold text-emerald-600">
                  <span>Хямдрал ({discountPercentage}%)</span>
                  <span>-{formatMnt(getDiscountAmount())}</span>
                </div>
              )}

              <div className="flex justify-between text-text-muted">
                <span>Хүргэлтийн төлбөр</span>
                <span>
                  {getDeliveryFee() === 0 ? (
                    <span className="font-bold text-emerald-600">ҮНЭГҮЙ</span>
                  ) : (
                    formatMnt(getDeliveryFee())
                  )}
                </span>
              </div>

              {deliveryMode === 'delivery' && remainingForFreeDelivery > 0 && (
                <p className="rounded-xl border border-border bg-surface-hover p-2.5 text-[11px] text-text-muted">
                  Дахин <span className="font-bold text-emerald-600">{formatMnt(remainingForFreeDelivery)}</span>{' '}
                  нэмбэл хүргэлт үнэгүй болно.
                </p>
              )}

              <div className="flex justify-between border-t border-border pt-3 text-base font-extrabold text-text-main sm:text-lg">
                <span>Нийт</span>
                <span className="text-xl text-emerald-600 sm:text-2xl">{formatMnt(getTotalPrice())}</span>
              </div>

              {checkoutIssue && (
                <p className="flex items-start gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-[11px] font-semibold text-amber-600">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {checkoutIssue}
                </p>
              )}

              <button
                onClick={handleCheckout}
                disabled={Boolean(checkoutIssue)}
                className="zity-btn-primary hidden w-full py-4 text-sm md:flex"
              >
                Захиалга баталгаажуулах
              </button>
            </div>
          </div>
        </div>
    </AppShell>
  );
}
