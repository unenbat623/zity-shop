import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  ShoppingCart,
  Tag,
  ChevronRight,
  Database,
} from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { BottomNav } from '../components/BottomNav';

export function CartScreen() {
  const navigate = useNavigate();
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
  } = useCartStore();

  const { user, selectedAddressIndex } = useAuthStore();
  const currentAddress = user.addresses[selectedAddressIndex] || user.addresses[0];

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponError, setCouponError] = useState('');

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const success = applyCoupon(inputCoupon);
    if (success) {
      setInputCoupon('');
    } else {
      setCouponError('Буруу эсвэл хүчингүй купон код байна.');
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-text-main pb-24">
        <header className="sticky top-0 z-30 flex items-center bg-surface px-4 py-3.5 border-b border-border shadow-xs">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 text-text-muted hover:text-text-main">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="ml-2 text-base font-extrabold text-text-main">Миний Сагс</h1>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <ShoppingCart className="h-10 w-10" />
          </div>
          <h2 className="mb-2 text-lg font-extrabold text-text-main">Сагс хоосон байна</h2>
          <p className="mb-6 text-xs text-text-muted max-w-xs leading-relaxed">
            Zity Chef орц багц болон Odoo ERP бараанаас сагсандаа нэмээд захиалгаа өгөөрэй.
          </p>
          <button
            onClick={() => navigate('/')}
            className="rounded-2xl bg-emerald-600 px-8 py-3.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
          >
            Дэлгүүр Хэсэх
          </button>
        </div>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-36 text-text-main">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-surface px-4 py-3.5 border-b border-border shadow-xs">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-1.5 -ml-1 text-text-muted hover:text-text-main">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="ml-2 text-base font-extrabold text-text-main">Миний Сагс ({getTotalItems()})</h1>
          </div>
          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
            <Database className="h-3.5 w-3.5" /> Odoo Synced
          </span>
        </div>
      </header>

      {/* Main Content Responsive Grid */}
      <main className="p-4 sm:p-6 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Delivery Mode, Address & Items List */}
          <div className="md:col-span-7 space-y-4">
            {/* Dual Mode Switcher */}
            <div className="flex rounded-2xl bg-surface-hover p-1 border border-border">
              <button
                onClick={() => setDeliveryMode('delivery')}
                className={`flex-1 rounded-xl py-2.5 text-xs font-extrabold transition-all ${
                  deliveryMode === 'delivery'
                    ? 'bg-surface text-emerald-600 shadow-xs border border-border'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                Хүргүүлэх (30 мин)
              </button>
              <button
                onClick={() => setDeliveryMode('pickup')}
                className={`flex-1 rounded-xl py-2.5 text-xs font-extrabold transition-all ${
                  deliveryMode === 'pickup'
                    ? 'bg-surface text-emerald-600 shadow-xs border border-border'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                Очиж Авах (Store Pickup)
              </button>
            </div>

            {/* Delivery / Pickup Address Details */}
            <div className="rounded-3xl bg-surface p-4 border border-border shadow-xs">
              {deliveryMode === 'delivery' ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-text-main">
                        {currentAddress.district}, {currentAddress.khoroo}
                      </div>
                      <div className="text-[11px] text-text-muted">{currentAddress.streetBuilding}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/profile')}
                    className="text-xs font-bold text-emerald-600 hover:underline"
                  >
                    Солих
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-text-main">Zity Delguur - Төв Салбар</div>
                      <div className="text-[11px] text-text-muted">Сөүлийн гудамж, 1-р хороо (Zity Center)</div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3">
                    <label className="mb-1.5 block text-xs font-bold text-text-main">Очиж авах цаг сонгох:</label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-emerald-500 shrink-0" />
                      <select
                        value={pickupTime || ''}
                        onChange={(e) => setPickupTime(e.target.value)}
                        className="flex-1 rounded-xl border border-border bg-surface-hover p-2.5 text-xs text-text-main outline-none focus:border-emerald-500"
                      >
                        <option value="" disabled>
                          Цаг сонгоно уу
                        </option>
                        <option value="10:00 - 10:30">10:00 - 10:30</option>
                        <option value="11:00 - 11:30">11:00 - 11:30</option>
                        <option value="12:00 - 12:30">12:00 - 12:30</option>
                        <option value="14:00 - 14:30">14:00 - 14:30</option>
                        <option value="16:00 - 16:30">16:00 - 16:30</option>
                        <option value="18:00 - 18:30">18:00 - 18:30</option>
                        <option value="20:00 - 20:30">20:00 - 20:30</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cart Items List */}
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-3xl bg-surface p-3 sm:p-4 border border-border shadow-xs"
                >
                  <img src={item.image} alt={item.name} className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover bg-surface-hover shrink-0" />

                  <div className="flex flex-1 flex-col py-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-text-main line-clamp-1">{item.name}</h3>
                        {item.sku && <span className="text-[10px] font-mono text-text-muted block">{item.sku}</span>}
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-text-muted hover:text-red-500 p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="font-extrabold text-sm sm:text-base text-text-main">
                        {((item.discountPrice || item.price) * item.quantity).toLocaleString()}₮
                      </div>

                      <div className="flex items-center gap-3 rounded-full bg-surface-hover px-3 py-1 border border-border">
                        <button
                          onClick={() => decreaseQuantity(item.id)}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-text-main shadow-xs hover:bg-border active:scale-95"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-4 text-center text-xs font-bold text-text-main">{item.quantity}</span>
                        <button
                          onClick={() => addItem(item)}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-text-main shadow-xs hover:bg-border active:scale-95"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Coupon & Order Summary */}
          <div className="md:col-span-5 space-y-4">
            {/* Coupon Code Section */}
            <div className="rounded-3xl bg-surface p-4 sm:p-5 border border-border shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-4 w-4 text-emerald-500" />
                <h3 className="text-xs font-bold text-text-main">Промо Код / Купон</h3>
              </div>

              {couponCode ? (
                <div className="flex items-center justify-between bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
                  <div>
                    <span className="font-extrabold text-xs text-emerald-600">{couponCode}</span>
                    <span className="text-[11px] text-emerald-600 block">{discountPercentage}% Хямдрал Идэвхтэй</span>
                  </div>
                  <button onClick={removeCoupon} className="text-xs font-bold text-red-500 hover:underline">
                    Устгах
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={inputCoupon}
                    onChange={(e) => setInputCoupon(e.target.value)}
                    placeholder="Жишээ: ZITYCHEF2026"
                    className="flex-1 rounded-xl bg-surface-hover px-3 py-2 text-xs font-medium text-text-main outline-none border border-border uppercase"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95"
                  >
                    Ашиглах
                  </button>
                </form>
              )}
              {couponError && <p className="mt-1 text-[11px] text-red-500">{couponError}</p>}
            </div>

            {/* Summary Details */}
            <div className="rounded-3xl bg-surface p-4 sm:p-5 border border-border shadow-xs space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between text-text-muted">
                <span>Барааны нийт дүн</span>
                <span className="font-bold text-text-main">{getSubtotal().toLocaleString()}₮</span>
              </div>

              {discountPercentage > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Хямдрал ({discountPercentage}%)</span>
                  <span>-{getDiscountAmount().toLocaleString()}₮</span>
                </div>
              )}

              <div className="flex justify-between text-text-muted">
                <span>Хүргэлтийн төлбөр</span>
                <span>{getDeliveryFee() === 0 ? <span className="text-emerald-600 font-bold">ҮНЭГҮЙ</span> : `${getDeliveryFee().toLocaleString()}₮`}</span>
              </div>

              <div className="border-t border-border pt-3 flex justify-between text-base sm:text-lg font-extrabold text-text-main">
                <span>Нийт Төлөх Дүн</span>
                <span className="text-xl sm:text-2xl text-emerald-600">{getTotalPrice().toLocaleString()}₮</span>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                disabled={deliveryMode === 'pickup' && !pickupTime}
                className="hidden md:flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 mt-4"
              >
                Үргэлжлүүлэх <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Checkout Sticky Bottom Bar */}
      <div className="md:hidden fixed inset-x-0 bottom-16 z-30 bg-surface/95 backdrop-blur-md p-4 border-t border-border shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-text-muted font-bold block">Нийт Дүн</span>
            <span className="text-xl font-extrabold text-emerald-600">{getTotalPrice().toLocaleString()}₮</span>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            disabled={deliveryMode === 'pickup' && !pickupTime}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-98 disabled:opacity-50"
          >
            Үргэлжлүүлэх <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
