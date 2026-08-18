import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  Database,
  Loader2,
  MapPin,
  QrCode,
  Smartphone,
} from 'lucide-react';

import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useOrderStore } from '../store/useOrderStore';
import { useToastStore } from '../store/useToastStore';
import { AppShell } from '../components/AppShell';
import { PaymentModal } from '../components/PaymentModal';
import { DeliveryAddress, PaymentMethod } from '../types';
import { formatMnt } from '../lib/format';
import { isDemoMode } from '../lib/env';

/**
 * `requiresGateway` — бодит төлбөрийн үйлчилгээ (QPay merchant, банкны эквайринг)
 * шаардана. Тэр интеграц хийгдтэл эдгээр нь ЗӨВХӨН демо горимд ажиллана.
 */
const PAYMENT_OPTIONS: {
  id: PaymentMethod;
  label: string;
  icon: typeof QrCode;
  desc: string;
  requiresGateway: boolean;
}[] = [
  { id: 'qpay', label: 'QPay QR', icon: QrCode, desc: 'Бүх банкны аппаар', requiresGateway: true },
  { id: 'socialpay', label: 'SocialPay', icon: Smartphone, desc: 'Голомт банкны апп', requiresGateway: true },
  { id: 'monpay', label: 'MonPay', icon: Smartphone, desc: 'Мобиком түрийвч', requiresGateway: true },
  { id: 'card', label: 'Банкны карт', icon: CreditCard, desc: 'Visa, MasterCard', requiresGateway: true },
  {
    id: 'cod',
    label: 'Хүргэлтээр бэлнээр',
    icon: Banknote,
    desc: 'Хүлээн авахдаа төлнө',
    requiresGateway: false,
  },
];

/** Онлайн төлбөрийн цонх нээх шаардлагатай хэлбэрүүд */
const ONLINE_METHODS: PaymentMethod[] = ['qpay', 'socialpay', 'monpay'];

export function CheckoutScreen() {
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.show);

  const {
    items,
    deliveryMode,
    pickupTime,
    couponCode,
    getSubtotal,
    getDiscountAmount,
    getDeliveryFee,
    getTotalPrice,
    getCheckoutIssue,
    clearCart,
  } = useCartStore();

  const account = useAuthStore((state) => state.account);
  const addresses = useAuthStore((state) => state.getAddresses());
  const selectedAddressIndex = useAuthStore((state) => state.getSelectedAddressIndex());
  const setSelectedAddressIndex = useAuthStore((state) => state.setSelectedAddressIndex);

  const { createOrder, isCreating } = useOrderStore();

  /**
   * Демо унтарсан үед онлайн төлбөр боломжгүй тул бэлнээр төлөхийг үндсэн
   * сонголт болгоно — хэрэглэгч дарж чадахгүй товч ширтэж суухгүй.
   */
  const isPaymentSimulated = isDemoMode();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    isPaymentSimulated ? 'qpay' : 'cod'
  );
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const totalPrice = getTotalPrice();
  const checkoutIssue = getCheckoutIssue();
  const selectedAddress = addresses[selectedAddressIndex] ?? null;

  /** Очиж авах үед хаяг шаардлагагүй — салбарын хаягийг ашиглана */
  const pickupAddress = useMemo<DeliveryAddress>(
    () => ({
      id: 'pickup-store',
      label: 'Zity Delguur төв салбар',
      district: 'Сүхбаатар дүүрэг',
      khoroo: '1-р хороо',
      streetBuilding: 'Zity Center, Сөүлийн гудамж',
      entranceAppt: 'Үндсэн орц',
      phone: account?.phone || '',
      notes: 'Очиж авах захиалга',
    }),
    [account?.phone]
  );

  /**
   * Захиалга амжилттай үүсэхэд сагс цэвэрлэгддэг.
   *
   * Тэр агшинд "сагс хоосон" гэсэн эффект ажиллаж хэрэглэгчийг `/cart` руу
   * шидвэл шинэ захиалгын хуудас руу орж чадахгүй. Тиймээс захиалга үүссэн
   * эсэхийг тэмдэглээд, тэр үед шилжүүлэлтийг хийхгүй.
   */
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);

  // Сагс хоосон бол буцаана — render дундуур биш, effect дотор
  useEffect(() => {
    if (items.length === 0 && !isCreating && !isOrderPlaced) {
      navigate('/cart', { replace: true });
    }
  }, [items.length, isCreating, isOrderPlaced, navigate]);

  if (items.length === 0) return null;

  const requiresAddress = deliveryMode === 'delivery';
  const missingAddress = requiresAddress && !selectedAddress;

  /**
   * Очиж авах захиалгад ч холбоо барих утас зайлшгүй.
   * Утасгүй захиалга бэлэн болоход хэрэглэгчид мэдэгдэх арга байхгүй болно.
   */
  const missingPickupPhone = !requiresAddress && !pickupAddress.phone.trim();

  const blockingIssue =
    checkoutIssue ??
    (missingAddress
      ? 'Хүргэлтийн хаягаа сонгоно уу.'
      : missingPickupPhone
        ? 'Холбоо барих утсаа профайл дээрээ нэмнэ үү.'
        : null);

  const handlePlaceOrderClick = () => {
    if (blockingIssue) {
      showToast(blockingIssue, 'warning');
      return;
    }

    // Демо унтарсан үед онлайн төлбөр боломжгүй — сонголт ямар нэг байдлаар
    // тэнд хүрсэн ч захиалгыг "төлөгдсөн" гэж бүртгэхгүй
    const selectedOption = PAYMENT_OPTIONS.find((option) => option.id === paymentMethod);
    if (selectedOption?.requiresGateway && !isPaymentSimulated) {
      showToast('Энэ төлбөрийн хэлбэр одоогоор боломжгүй байна.', 'warning');
      return;
    }

    if (ONLINE_METHODS.includes(paymentMethod)) {
      setIsPaymentModalOpen(true);
    } else {
      void processOrder();
    }
  };

  const processOrder = async () => {
    const address = requiresAddress ? selectedAddress : pickupAddress;
    if (!address) {
      showToast('Хүргэлтийн хаяг олдсонгүй.', 'error');
      return;
    }

    setIsPaymentModalOpen(false);

    const order = await createOrder({
      items,
      deliveryMode,
      address,
      pickupTime,
      paymentMethod,
      subtotal: getSubtotal(),
      discountAmount: getDiscountAmount(),
      deliveryFee: getDeliveryFee(),
      totalAmount: totalPrice,
      couponCode: couponCode || undefined,
    });

    setIsOrderPlaced(true);
    clearCart();

    if (order.odooSync.status === 'failed' || order.chefSync.status === 'failed') {
      showToast('Захиалга үүслээ. Зарим синк амжилтгүй — дэлгэрэнгүйгээс дахин илгээж болно.', 'warning');
    } else {
      showToast(`${order.id} захиалга амжилттай баталгаажлаа.`, 'success');
    }

    navigate(`/orders/${order.id}`, { replace: true });
  };

  return (
    <AppShell
      showSearch={false}
      title="Захиалга баталгаажуулах"
      maxWidth="lg"
      backTo="/cart"
      // Төлбөрийн урсгалд анхаарал сарниулахгүйн тулд доод цэсийг нууна
      hideBottomNav
      headerRight={
        <span className="hidden items-center gap-1 text-xs font-bold text-emerald-600 sm:flex">
          <Database className="h-3.5 w-3.5" /> Odoo sale.order
        </span>
      }
      stickyFooterHideFrom="md"
      stickyFooter={
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="block text-[10px] font-bold text-text-muted">Нийт төлөх</span>
            <span className="text-xl font-extrabold text-emerald-600">{formatMnt(totalPrice)}</span>
          </div>
          <button
            onClick={handlePlaceOrderClick}
            disabled={isCreating || Boolean(blockingIssue)}
            className="zity-btn-primary flex-1 py-3.5 text-xs"
          >
            {isCreating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" /> Баталгаажуулах
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="space-y-4 md:col-span-7">
            {/* Хаяг */}
            {requiresAddress ? (
              <section className="zity-card space-y-3 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 text-xs font-extrabold text-text-main sm:text-sm">
                    <MapPin className="h-4 w-4 text-emerald-500" /> Хүргэлтийн хаяг
                  </h2>
                  <button
                    onClick={() => navigate('/profile')}
                    className="-my-2 shrink-0 px-2 py-2 text-[11px] font-bold text-emerald-600 hover:underline"
                  >
                    Хаяг удирдах
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-center">
                    <AlertTriangle className="mx-auto mb-2 h-5 w-5 text-amber-500" />
                    <p className="mb-3 text-xs font-semibold text-amber-600">
                      Хүргэлтийн хаяг хадгалаагүй байна.
                    </p>
                    <button
                      onClick={() => navigate('/profile')}
                      className="zity-btn-primary px-4 py-2 text-xs"
                    >
                      Хаяг нэмэх
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2" role="radiogroup" aria-label="Хүргэлтийн хаяг">
                    {addresses.map((address, index) => {
                      const isSelected = index === selectedAddressIndex;
                      return (
                        <button
                          key={address.id}
                          type="button"
                          role="radio"
                          onClick={() => setSelectedAddressIndex(index)}
                          className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-all ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-border bg-surface-hover hover:border-emerald-500/30'
                          }`}
                          aria-checked={isSelected}
                        >
                          <span
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                              isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-text-subtle'
                            }`}
                            aria-hidden="true"
                          >
                            {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-xs font-bold text-text-main">
                              {address.district}, {address.khoroo}
                            </span>
                            <span className="block text-[11px] text-text-muted">
                              {address.streetBuilding}
                              {address.entranceAppt ? `, ${address.entranceAppt}` : ''}
                            </span>
                            <span className="block font-mono text-[10px] text-text-muted">{address.phone}</span>
                            {address.notes && (
                              <span className="block text-[10px] text-emerald-600">📝 {address.notes}</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            ) : (
              <section className="zity-card p-4 sm:p-5">
                <h2 className="mb-3 flex items-center gap-2 text-xs font-extrabold text-text-main sm:text-sm">
                  <MapPin className="h-4 w-4 text-amber-500" /> Очиж авах
                </h2>
                <p className="text-xs font-bold text-text-main">{pickupAddress.label}</p>
                <p className="text-[11px] text-text-muted">{pickupAddress.streetBuilding}</p>
                <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                  <Clock className="h-3.5 w-3.5" /> Очих цаг: {pickupTime || 'сонгоогүй'}
                </p>

                {missingPickupPhone && (
                  <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
                    <p className="mb-2 flex items-start gap-1.5 text-[11px] font-semibold text-amber-600">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Захиалга бэлэн болоход холбогдох утас алга байна.
                    </p>
                    <button
                      onClick={() => navigate('/profile')}
                      className="zity-btn-primary px-4 py-2 text-xs"
                    >
                      Утас нэмэх
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* Төлбөрийн хэлбэр */}
            <section className="zity-card space-y-3 p-4 sm:p-5">
              <h2 className="flex items-center gap-2 text-xs font-extrabold text-text-main sm:text-sm">
                <CreditCard className="h-4 w-4 text-emerald-500" /> Төлбөрийн хэлбэр
              </h2>

              {!isPaymentSimulated && (
                <p className="flex items-start gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-[11px] font-semibold leading-relaxed text-amber-600">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Онлайн төлбөрийн систем хараахан холбогдоогүй байна. Одоогоор зөвхөн хүргэлтээр
                  бэлнээр төлөх боломжтой.
                </p>
              )}

              <div className="space-y-2" role="radiogroup" aria-label="Төлбөрийн хэлбэр">
                {PAYMENT_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = paymentMethod === option.id;
                  const isDisabled = option.requiresGateway && !isPaymentSimulated;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      onClick={() => !isDisabled && setPaymentMethod(option.id)}
                      disabled={isDisabled}
                      className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3.5 text-xs transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 font-bold text-emerald-600'
                          : 'border-border bg-surface font-medium text-text-main hover:bg-surface-hover'
                      } ${isDisabled ? 'cursor-not-allowed opacity-45 hover:bg-surface' : ''}`}
                      aria-checked={isSelected}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            isSelected ? 'bg-emerald-600 text-white' : 'bg-surface-hover text-text-muted'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 text-left">
                          <span className="block truncate text-xs font-bold sm:text-sm">{option.label}</span>
                          <span className="block truncate text-[11px] text-text-muted">
                            {isDisabled ? 'Тун удахгүй' : option.desc}
                          </span>
                        </span>
                      </span>

                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                          isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-text-subtle'
                        }`}
                        aria-hidden="true"
                      >
                        {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                    </button>
                  );
                })}
              </div>

              {paymentMethod === 'cod' && (
                <p className="rounded-xl border border-border bg-surface-hover p-2.5 text-[11px] text-text-muted">
                  Бэлнээр төлөх захиалга хүргэгдэх үед төлөгдсөнд тооцогдоно.
                </p>
              )}

              {isPaymentSimulated && paymentMethod !== 'cod' && (
                <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-[11px] font-semibold text-amber-600">
                  ⚠️ Демо горим — бодит гүйлгээ хийгдэхгүй.
                </p>
              )}
            </section>
          </div>

          {/* Дүн */}
          <div className="space-y-4 md:col-span-5">
            <section className="zity-card space-y-3 p-5 text-xs sm:text-sm">
              <h2 className="border-b border-border pb-2 text-sm font-extrabold text-text-main">
                Захиалгын дүн
              </h2>

              <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="min-w-0 truncate text-text-muted">
                      {item.name} <span className="font-bold text-text-main">× {item.quantity}</span>
                    </span>
                    <span className="shrink-0 font-bold text-text-main">
                      {formatMnt((item.discountPrice ?? item.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between border-t border-border pt-3 text-text-muted">
                <span>Бараануудын дүн ({items.length})</span>
                <span className="font-bold text-text-main">{formatMnt(getSubtotal())}</span>
              </div>

              {getDiscountAmount() > 0 && (
                <div className="flex justify-between font-bold text-emerald-600">
                  <span>Хямдрал{couponCode ? ` (${couponCode})` : ''}</span>
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

              <div className="flex justify-between border-t border-border pt-3 text-base font-extrabold text-text-main sm:text-lg">
                <span>Нийт төлөх</span>
                <span className="text-xl text-emerald-600 sm:text-2xl">{formatMnt(totalPrice)}</span>
              </div>

              {blockingIssue && (
                <p className="flex items-start gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-[11px] font-semibold text-amber-600">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {blockingIssue}
                </p>
              )}

              <button
                onClick={handlePlaceOrderClick}
                disabled={isCreating || Boolean(blockingIssue)}
                className="zity-btn-primary mt-2 hidden w-full py-4 text-sm md:flex"
              >
                {isCreating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" /> Захиалга баталгаажуулах
                  </>
                )}
              </button>
            </section>
          </div>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={() => void processOrder()}
        amount={totalPrice}
        paymentMethod={paymentMethod}
      />
    </AppShell>
  );
}
