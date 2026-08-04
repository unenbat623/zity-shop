import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  QrCode,
  Smartphone,
  Banknote,
  CheckCircle2,
  Database,
  Truck,
  ShieldCheck,
  Building
} from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useOrderStore } from '../store/useOrderStore';
import { PaymentMethod } from '../types';
import { PaymentModal } from '../components/PaymentModal';

export function CheckoutScreen() {
  const navigate = useNavigate();
  const {
    items,
    deliveryMode,
    pickupTime,
    selectedAddress,
    setSelectedAddress,
    getSubtotal,
    getDiscountAmount,
    getDeliveryFee,
    getTotalPrice,
    clearCart,
  } = useCartStore();

  const { user } = useAuthStore();
  const { createOrder } = useOrderStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qpay');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Address State
  const [district, setDistrict] = useState(selectedAddress?.district || 'Сүхбаатар дүүрэг');
  const [khoroo, setKhoroo] = useState(selectedAddress?.khoroo || '1-р хороо');
  const [streetBuilding, setStreetBuilding] = useState(selectedAddress?.streetBuilding || 'Zity Center, 4-р давхар');
  const [entranceAppt, setEntranceAppt] = useState(selectedAddress?.entranceAppt || '1-р орц, 402 тоот');
  const [phone, setPhone] = useState(selectedAddress?.phone || '99112233');
  const [notes, setNotes] = useState(selectedAddress?.notes || 'Үүдэнд утасдаж мэдэгдэнэ үү');

  const handlePlaceOrderClick = () => {
    if (paymentMethod === 'qpay' || paymentMethod === 'socialpay' || paymentMethod === 'monpay') {
      setIsPaymentModalOpen(true);
    } else {
      processOrderCreation();
    }
  };

  const processOrderCreation = async () => {
    setIsSubmitting(true);
    const finalAddress = {
      district,
      khoroo,
      streetBuilding,
      entranceAppt,
      phone,
      notes,
    };

    const newOrder = await createOrder(
      items,
      deliveryMode,
      finalAddress,
      pickupTime,
      paymentMethod,
      getSubtotal(),
      getDiscountAmount(),
      getDeliveryFee(),
      getTotalPrice()
    );

    clearCart();
    setIsSubmitting(false);
    setIsPaymentModalOpen(false);

    navigate('/orders');
  };

  if (items.length === 0) {
    navigate('/');
    return null;
  }

  const paymentOptions: { id: PaymentMethod; label: string; icon: any; desc: string }[] = [
    { id: 'qpay', label: 'QPay QR', icon: QrCode, desc: 'Бүх банкны апп-аар' },
    { id: 'socialpay', label: 'SocialPay', icon: Smartphone, desc: 'Голомт банкны апп' },
    { id: 'monpay', label: 'MonPay', icon: Smartphone, desc: 'Мобиком түрийвч' },
    { id: 'card', label: 'Банкны Карт', icon: CreditCard, desc: 'Visa, MasterCard, ₮' },
    { id: 'cod', label: 'Хүргэлтээр / Бэлнээр', icon: Banknote, desc: 'Хүлээн авахдаа' },
  ];

  return (
    <div className="min-h-screen bg-background pb-32 text-text-main">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-surface px-4 py-3.5 border-b border-border shadow-xs">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="p-1.5 -ml-1 text-text-muted hover:text-text-main">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="ml-2 text-base font-extrabold text-text-main">Захиалга Баталгаажуулах</h1>
        </div>
        <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
          <Database className="h-3.5 w-3.5" /> Odoo Sales Integration
        </span>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Address Form (If Delivery Mode) */}
        {deliveryMode === 'delivery' && (
          <div className="rounded-3xl bg-surface p-4 border border-border shadow-xs space-y-3">
            <h2 className="text-xs font-extrabold text-text-main flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-500" /> Хүргэлтийн Хаяг
            </h2>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-text-muted block mb-1">Дүүрэг</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-hover p-2 text-xs font-semibold outline-none focus:border-emerald-500"
                >
                  <option value="Сүхбаатар дүүрэг">Сүхбаатар дүүрэг</option>
                  <option value="Хан-Уул дүүрэг">Хан-Уул дүүрэг</option>
                  <option value="Баянгол дүүрэг">Баянгол дүүрэг</option>
                  <option value="Баянзүрх дүүрэг">Баянзүрх дүүрэг</option>
                  <option value="Чингэлтэй дүүрэг">Чингэлтэй дүүрэг</option>
                  <option value="Сонгинохайрхан дүүрэг">Сонгинохайрхан дүүрэг</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-muted block mb-1">Хороо</label>
                <input
                  type="text"
                  value={khoroo}
                  onChange={(e) => setKhoroo(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-hover p-2 text-xs font-semibold outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-muted block mb-1">Байр, Гудамжны нэр</label>
              <input
                type="text"
                value={streetBuilding}
                onChange={(e) => setStreetBuilding(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-hover p-2 text-xs font-semibold outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-text-muted block mb-1">Орц, Тоот</label>
                <input
                  type="text"
                  value={entranceAppt}
                  onChange={(e) => setEntranceAppt(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-hover p-2 text-xs font-semibold outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-muted block mb-1">Холбогдох Утас</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-hover p-2 text-xs font-semibold outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-muted block mb-1">Хаягийн нэмэлт тэмдэглэл</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Жишээ: 1-р орц, код: 1234"
                className="w-full rounded-xl border border-border bg-surface-hover p-2 text-xs font-medium outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        {/* Payment Methods */}
        <div className="rounded-3xl bg-surface p-4 border border-border shadow-xs space-y-3">
          <h2 className="text-xs font-extrabold text-text-main flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-emerald-500" /> Төлбөрийн Хэлбэр Сонгох
          </h2>

          <div className="space-y-2">
            {paymentOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = paymentMethod === opt.id;

              return (
                <button
                  key={opt.id}
                  onClick={() => setPaymentMethod(opt.id)}
                  className={`flex w-full items-center justify-between p-3 rounded-2xl border text-xs transition-all ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 font-bold shadow-xs'
                      : 'bg-surface border-border text-text-main hover:bg-surface-hover font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-surface-hover text-text-muted'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-xs">{opt.label}</div>
                      <div className="text-[10px] text-text-muted">{opt.desc}</div>
                    </div>
                  </div>

                  <div
                    className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-text-muted'
                    }`}
                  >
                    {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Total Price Summary Box */}
        <div className="rounded-3xl bg-surface p-4 border border-border shadow-xs space-y-2 text-xs">
          <div className="flex justify-between text-text-muted">
            <span>Бараануудын дүн ({items.length})</span>
            <span className="font-bold text-text-main">{getSubtotal().toLocaleString()}₮</span>
          </div>

          <div className="flex justify-between text-text-muted">
            <span>Хүргэлтийн төлбөр</span>
            <span>
              {getDeliveryFee() === 0 ? (
                <span className="text-emerald-600 font-bold">ҮНЭГҮЙ</span>
              ) : (
                `${getDeliveryFee().toLocaleString()}₮`
              )}
            </span>
          </div>

          {getDiscountAmount() > 0 && (
            <div className="flex justify-between text-emerald-600 font-bold">
              <span>Хямдралын хөнгөлөлт</span>
              <span>-{getDiscountAmount().toLocaleString()}₮</span>
            </div>
          )}

          <div className="border-t border-border pt-2 flex justify-between text-base font-extrabold text-text-main">
            <span>Нийт Төлөх Дүн</span>
            <span className="text-xl text-emerald-600">{getTotalPrice().toLocaleString()}₮</span>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Action */}
      <div className="fixed inset-x-0 bottom-0 z-40 bg-surface p-4 border-t border-border shadow-2xl pb-safe">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-text-muted font-bold block">Нийт Төлөх</span>
            <span className="text-xl font-extrabold text-emerald-600">{getTotalPrice().toLocaleString()}₮</span>
          </div>

          <button
            onClick={handlePlaceOrderClick}
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-xs font-extrabold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-98 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" /> Odoo ERP-д Захиалга Илгээх
              </>
            )}
          </button>
        </div>
      </div>

      {/* QPay Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={processOrderCreation}
        amount={getTotalPrice()}
        paymentMethod={paymentMethod}
        orderRef="SO-2026-TEMP"
      />
    </div>
  );
}
