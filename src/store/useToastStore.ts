import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

const DEFAULT_DURATION_MS = 3200;
const MAX_VISIBLE = 3;

interface ToastState {
  toasts: Toast[];
  show: (message: string, variant?: ToastVariant, durationMs?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
  dismiss: (id: string) => void;
}

/** Component-ээс гадуур (store дотроос) toast харуулах шаардлагатай үед ашиглана */
export const toast = {
  success: (message: string) => useToastStore.getState().success(message),
  error: (message: string) => useToastStore.getState().error(message),
  info: (message: string) => useToastStore.getState().info(message),
  warning: (message: string) => useToastStore.getState().warning(message),
};

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  show: (message, variant = 'info', durationMs = DEFAULT_DURATION_MS) => {
    if (!message.trim()) return;

    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    set((state) => ({
      // Хэт олон toast дэлгэц дүүргэхээс сэргийлж хамгийн хуучныг нь хасна
      toasts: [...state.toasts, { id, message, variant }].slice(-MAX_VISIBLE),
    }));

    setTimeout(() => get().dismiss(id), durationMs);
  },

  success: (message) => get().show(message, 'success'),
  error: (message) => get().show(message, 'error', 4500),
  info: (message) => get().show(message, 'info'),
  warning: (message) => get().show(message, 'warning', 4000),

  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })),
}));
