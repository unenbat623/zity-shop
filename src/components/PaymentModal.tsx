import React, { useState, useEffect } from 'react';
import { X, QrCode, CheckCircle2, ShieldCheck, Copy, Clock, ArrowRight } from 'lucide-react';
import { PaymentMethod } from '../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  amount: number;
  paymentMethod: PaymentMethod;
  orderRef: string;
}

export function PaymentModal({
  isOpen,
  onClose,
  onPaymentSuccess,
  amount,
  paymentMethod,
  orderRef,
}: PaymentModalProps) {
  const [timeLeft, setTimeLeft] = useState(300); // 5 mins countdown
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSimulateBankClick = (bankName: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess();
    }, 1500);
  };

  const banks = [
    { name: 'Khan Bank', bg: 'bg-emerald-600', color: 'text-white' },
    { name: 'Golomt Bank', bg: 'bg-blue-600', color: 'text-white' },
    { name: 'SocialPay', bg: 'bg-indigo-600', color: 'text-white' },
    { name: 'MonPay', bg: 'bg-rose-500', color: 'text-white' },
    { name: 'TDB Online', bg: 'bg-amber-600', color: 'text-white' },
    { name: 'XacBank', bg: 'bg-teal-600', color: 'text-white' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-surface p-6 shadow-2xl border border-border overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
              <QrCode className="h-5 w-5 text-emerald-500" /> QPay & Банкны Төлбөр
            </h2>
            <p className="text-xs text-text-muted">Захиалгын дугаар: <span className="font-mono font-bold text-text-main">{orderRef}</span></p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-hover text-text-muted hover:text-text-main"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Total Amount Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 p-4 text-white shadow-md mb-4 text-center">
          <span className="text-xs font-medium text-emerald-100 block">Төлөх нийт дүн</span>
          <span className="text-3xl font-extrabold tracking-tight">{amount.toLocaleString()}₮</span>
          <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] bg-black/20 rounded-full py-1 px-3 w-max mx-auto">
            <Clock className="h-3.5 w-3.5" /> Хугацаа: <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center bg-white p-4 rounded-2xl border border-gray-200 mb-4 text-slate-900 shadow-inner">
          {/* Simulated QR Code matrix */}
          <div className="relative h-44 w-44 bg-white p-2 border-4 border-slate-900 rounded-xl flex flex-col justify-between">
            <div className="flex justify-between">
              <div className="h-10 w-10 bg-slate-900 rounded-sm p-1">
                <div className="h-full w-full bg-white rounded-xs p-1">
                  <div className="h-full w-full bg-slate-900 rounded-2xs" />
                </div>
              </div>
              <div className="h-10 w-10 bg-slate-900 rounded-sm p-1">
                <div className="h-full w-full bg-white rounded-xs p-1">
                  <div className="h-full w-full bg-slate-900 rounded-2xs" />
                </div>
              </div>
            </div>

            {/* Center Logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-md border-2 border-white">
                Z
              </div>
            </div>

            <div className="flex justify-between">
              <div className="h-10 w-10 bg-slate-900 rounded-sm p-1">
                <div className="h-full w-full bg-white rounded-xs p-1">
                  <div className="h-full w-full bg-slate-900 rounded-2xs" />
                </div>
              </div>
              <div className="h-4 w-4 bg-slate-900 rounded-2xs" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">Банкны апп-аар QR кодыг уншуулна уу</p>
        </div>

        {/* Quick Bank App Simulator */}
        <div className="mb-4">
          <label className="text-xs font-bold text-text-main block mb-2">Шууд банкны апп-аар төлөх:</label>
          <div className="grid grid-cols-3 gap-2">
            {banks.map((b) => (
              <button
                key={b.name}
                onClick={() => handleSimulateBankClick(b.name)}
                disabled={isProcessing}
                className={`${b.bg} ${b.color} rounded-xl py-2 px-2 text-[11px] font-bold shadow-xs hover:opacity-90 active:scale-95 transition-all flex items-center justify-center text-center`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>

        {/* Instant Payment Simulator button */}
        <button
          onClick={() => handleSimulateBankClick('Instant')}
          disabled={isProcessing}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-98 transition-all"
        >
          {isProcessing ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5" /> Төлбөр Баталгаажуулах
            </>
          )}
        </button>
      </div>
    </div>
  );
}
