import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Loader2, QrCode, ShieldCheck } from 'lucide-react';
import { Modal } from './ui/Modal';
import { PaymentMethod } from '../types';
import { formatMnt } from '../lib/format';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  amount: number;
  paymentMethod: PaymentMethod;
}

/** Төлбөрийн QR хүчинтэй байх хугацаа (секунд) */
const COUNTDOWN_SECONDS = 300;

const BANKS = [
  { name: 'Хаан банк', className: 'bg-emerald-600' },
  { name: 'Голомт банк', className: 'bg-blue-600' },
  { name: 'SocialPay', className: 'bg-indigo-600' },
  { name: 'MonPay', className: 'bg-rose-500' },
  { name: 'TDB Online', className: 'bg-amber-600' },
  { name: 'Хас банк', className: 'bg-teal-600' },
];

const METHOD_LABEL: Record<PaymentMethod, string> = {
  qpay: 'QPay QR',
  socialpay: 'SocialPay',
  monpay: 'MonPay',
  card: 'Банкны карт',
  cod: 'Бэлнээр',
};

export function PaymentModal({
  isOpen,
  onClose,
  onPaymentSuccess,
  amount,
  paymentMethod,
}: PaymentModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [isProcessing, setIsProcessing] = useState(false);

  // Цонх нээгдэх бүрт тоолуур шинээр эхэлнэ
  useEffect(() => {
    if (!isOpen) return;

    setSecondsLeft(COUNTDOWN_SECONDS);
    setIsProcessing(false);

    const timer = setInterval(() => {
      setSecondsLeft((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const isExpired = secondsLeft === 0;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const handlePay = () => {
    if (isProcessing || isExpired) return;
    setIsProcessing(true);
    // Банкны баталгаажуулалтыг дуурайлган богино хугацаа хүлээнэ
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess();
    }, 1200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={METHOD_LABEL[paymentMethod]}
      description="Төлбөрөө баталгаажуулна уу"
      icon={<QrCode className="h-5 w-5" />}
      // Төлбөр явж байх үед санамсаргүй хаагдахаас сэргийлнэ
      closeOnBackdrop={!isProcessing}
      showCloseButton={!isProcessing}
      footer={
        <p className="flex items-center justify-center gap-1.5 text-[10px] text-text-subtle">
          <ShieldCheck className="h-3 w-3 text-emerald-500" />
          Демо төлбөрийн симуляц — бодит гүйлгээ хийгдэхгүй.
        </p>
      }
    >
      <div className="mb-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 p-4 text-center text-white shadow-md">
        <span className="block text-xs font-medium text-emerald-100">Төлөх нийт дүн</span>
        <span className="text-3xl font-extrabold tracking-tight">{formatMnt(amount)}</span>
        <div
          className={`mx-auto mt-2 flex w-max items-center gap-1.5 rounded-full px-3 py-1 text-[11px] ${
            isExpired ? 'bg-red-950/50' : 'bg-black/20'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          {isExpired ? (
            'Хугацаа дууслаа'
          ) : (
            <>
              Хугацаа:{' '}
              <span className="font-mono font-bold">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
            </>
          )}
        </div>
      </div>

      {/* QR (симуляц) */}
      <div className="mb-4 flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 shadow-inner">
        <div
          className={`relative flex h-40 w-40 flex-col justify-between rounded-xl border-4 border-slate-900 bg-white p-2 transition-opacity ${
            isExpired ? 'opacity-25' : ''
          }`}
          aria-hidden="true"
        >
          <div className="flex justify-between">
            <QrCorner />
            <QrCorner />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white bg-emerald-500 text-lg font-extrabold text-white shadow-md">
              Z
            </div>
          </div>
          <div className="flex justify-between">
            <QrCorner />
            <div className="h-4 w-4 rounded-sm bg-slate-900" />
          </div>
        </div>
        <p className="mt-2 text-xs font-medium text-slate-500">
          {isExpired ? 'QR хүчингүй боллоо' : 'Банкны аппаар QR кодыг уншуулна уу'}
        </p>
      </div>

      <div className="mb-4">
        <span className="mb-2 block text-xs font-bold text-text-main">Банкны аппаар шууд төлөх:</span>
        <div className="grid grid-cols-3 gap-2">
          {BANKS.map((bank) => (
            <button
              key={bank.name}
              onClick={handlePay}
              disabled={isProcessing || isExpired}
              className={`${bank.className} rounded-xl px-2 py-2 text-center text-[11px] font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40`}
            >
              {bank.name}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handlePay}
        disabled={isProcessing || isExpired}
        className="zity-btn-primary w-full py-3.5 text-sm"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" /> Баталгаажуулж байна...
          </>
        ) : (
          <>
            <CheckCircle2 className="h-5 w-5" /> Төлбөр баталгаажуулах
          </>
        )}
      </button>
    </Modal>
  );
}

function QrCorner() {
  return (
    <div className="h-9 w-9 rounded-sm bg-slate-900 p-1">
      <div className="h-full w-full rounded-xs bg-white p-1">
        <div className="h-full w-full rounded-xs bg-slate-900" />
      </div>
    </div>
  );
}
