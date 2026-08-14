import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthAccount, DeliveryAddress, UserProfile } from '../types';
import { AuthError, SupabaseAuthService } from '../services/supabaseAuthService';
import { setAuthTokenProvider } from '../services/apiClient';
import { isAdminEmail, isSupabaseConfigured } from '../lib/env';

/**
 * Нэвтрэлтийн төлөв.
 *
 * Гол зарчим: нэвтрээгүй хэрэглэгчид ХУДАЛ профайл харуулахгүй.
 * `account === null` бол зочин (guest) — нэр, оноо, хаяг бүгд хоосон.
 * Хаяг/оноо зэрэг апп доторх өгөгдөл нь хэрэглэгчийн ID-аар түлхүүрлэгдэж хадгалагдана.
 */

export const GUEST_PROFILE: UserProfile = {
  name: 'Зочин',
  email: '',
  phone: '',
  avatarUrl: '',
  zityPoints: 0,
  addresses: [],
  isZityChefConnected: false,
};

/** Хэрэглэгч бүрийн локал өгөгдөл (хаяг, оноо, Chef холболт) */
interface LocalUserData {
  addresses: DeliveryAddress[];
  zityPoints: number;
  isZityChefConnected: boolean;
  selectedAddressIndex: number;
}

/** Хоосон массивыг дахин ашиглана — selector бүрт шинэ массив үүсвэл дахин render үүснэ */
const EMPTY_ADDRESSES: DeliveryAddress[] = [];

const EMPTY_USER_DATA: LocalUserData = {
  addresses: EMPTY_ADDRESSES,
  zityPoints: 0,
  isZityChefConnected: true,
  selectedAddressIndex: 0,
};

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'guest';

interface AuthState {
  account: AuthAccount | null;
  status: AuthStatus;
  authError: string | null;
  infoMessage: string | null;
  /** Хэрэглэгч бүрийн локал өгөгдөл: userId → data */
  userData: Record<string, LocalUserData>;

  // Тооцоолсон утгууд
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
  getProfile: () => UserProfile;
  getAddresses: () => DeliveryAddress[];
  getSelectedAddress: () => DeliveryAddress | null;
  getSelectedAddressIndex: () => number;

  // Үйлдлүүд
  initialize: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<boolean>;
  signUpWithPassword: (
    email: string,
    password: string,
    fullName: string,
    phone?: string
  ) => Promise<{ ok: boolean; needsEmailConfirmation: boolean }>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  updateProfile: (updates: { name?: string; phone?: string }) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearMessages: () => void;

  addAddress: (address: Omit<DeliveryAddress, 'id'>) => void;
  updateAddress: (id: string, address: Omit<DeliveryAddress, 'id'>) => void;
  removeAddress: (id: string) => void;
  setSelectedAddressIndex: (index: number) => void;
  toggleZityChefConnection: () => void;
  addPoints: (amount: number) => void;
}

function createAddressId(): string {
  return `addr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * `initialize()`-ийг зөвхөн НЭГ удаа ажиллуулна.
 *
 * React StrictMode нь dev дээр effect-ийг хоёр удаа дуудна. Хамгаалалтгүй бол
 * хоёр дахь дуудлага эхлэхдээ `authError: null` болгож, OAuth-ийн алдааг
 * хэрэглэгч харахаас өмнө арчиж хаядаг байв.
 */
let initializePromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      account: null,
      status: 'idle',
      authError: null,
      infoMessage: null,
      userData: {},

      isAuthenticated: () => get().account !== null,

      isAdmin: () => {
        const { account } = get();
        return account !== null && isAdminEmail(account.email);
      },

      getProfile: () => {
        const { account, userData } = get();
        if (!account) return GUEST_PROFILE;

        const data = userData[account.id] ?? EMPTY_USER_DATA;
        return {
          name: account.name,
          email: account.email,
          phone: account.phone,
          avatarUrl: account.avatarUrl,
          zityPoints: data.zityPoints,
          addresses: data.addresses,
          isZityChefConnected: data.isZityChefConnected,
        };
      },

      getAddresses: () => {
        const { account, userData } = get();
        if (!account) return EMPTY_ADDRESSES;
        return userData[account.id]?.addresses ?? EMPTY_ADDRESSES;
      },

      getSelectedAddressIndex: () => {
        const { account, userData } = get();
        if (!account) return 0;
        const data = userData[account.id];
        if (!data || data.addresses.length === 0) return 0;
        // Хаяг устсан тохиолдолд index хүрээнээс гарахаас сэргийлнэ
        return Math.min(data.selectedAddressIndex, data.addresses.length - 1);
      },

      getSelectedAddress: () => {
        const addresses = get().getAddresses();
        if (addresses.length === 0) return null;
        return addresses[get().getSelectedAddressIndex()] ?? addresses[0];
      },

      /** App эхлэхэд: OAuth redirect уншиж, session сэргээнэ (нэг л удаа) */
      initialize: () => {
        initializePromise ??= (async () => {
          set({ status: 'loading', authError: null });

          if (!isSupabaseConfigured()) {
            set({ account: null, status: 'guest' });
            return;
          }

          const { hadAuthPayload } = SupabaseAuthService.inspectRedirect();
          const pendingRedirect = SupabaseAuthService.takePendingOAuthRedirect();

          try {
            // supabase-js нь URL дээрх code-г session болгож солих хүртэл хүлээнэ.
            // URL-ийг энэ дуудлагаас ӨМНӨ цэвэрлэвэл нэвтрэлт бүтэлгүйтэнэ.
            const account = await SupabaseAuthService.fetchAccount();

            const redirectError = SupabaseAuthService.takeRedirectError();
            if (redirectError) {
              set({ account: null, status: 'guest', authError: redirectError });
              return;
            }

            /**
             * Google руу явсан боловч session-гүй, алдаагүй буцаж ирсэн бол буцах
             * хаяг нь Supabase-д бүртгэгдээгүй байна гэсэн үг. Тэр үед Supabase нь
             * Site URL руу (энд Zity Chef рүү) буцаадаг тул хэрэглэгч "яагаад өөр
             * апп руу орчихов?" гэж эргэлздэг.
             */
            if (pendingRedirect && !hadAuthPayload && !account) {
              set({
                account: null,
                status: 'guest',
                authError:
                  `Нэвтрэлт эргэж ирсэнгүй. Supabase → Authentication → URL Configuration → ` +
                  `Redirect URLs дээр "${pendingRedirect}" хаягийг нэмнэ үү. ` +
                  `Бүртгэгдээгүй үед Supabase нь Site URL (Zity Chef) руу буцаадаг.`,
              });
              return;
            }

            set({
              account,
              status: account ? 'authenticated' : 'guest',
              infoMessage: hadAuthPayload && account ? `Тавтай морил, ${account.name}!` : null,
            });
          } catch (error) {
            set({
              account: null,
              status: 'guest',
              authError: error instanceof Error ? error.message : 'Нэвтрэлтийг сэргээж чадсангүй.',
            });
          }
        })();

        return initializePromise;
      },

      signInWithGoogle: async () => {
        set({ authError: null });
        try {
          // supabase-js нь PKCE-ийн бэлтгэлийг хийгээд browser-ийг шилжүүлнэ
          await SupabaseAuthService.signInWithGoogle();
        } catch (error) {
          set({
            authError:
              error instanceof AuthError ? error.message : 'Google нэвтрэлт эхлүүлэхэд алдаа гарлаа.',
          });
        }
      },

      signInWithPassword: async (email, password) => {
        set({ status: 'loading', authError: null, infoMessage: null });
        try {
          const account = await SupabaseAuthService.signInWithPassword(email, password);
          set({ account, status: 'authenticated', infoMessage: `Тавтай морил, ${account.name}!` });
          return true;
        } catch (error) {
          set({
            status: 'guest',
            authError: error instanceof Error ? error.message : 'Нэвтрэхэд алдаа гарлаа.',
          });
          return false;
        }
      },

      signUpWithPassword: async (email, password, fullName, phone) => {
        set({ status: 'loading', authError: null, infoMessage: null });
        try {
          const result = await SupabaseAuthService.signUpWithPassword(email, password, fullName, phone);

          if (result.needsEmailConfirmation) {
            set({
              status: 'guest',
              infoMessage: 'Бүртгэл үүслээ. Имэйл рүү илгээсэн баталгаажуулах холбоосыг дарна уу.',
            });
            return { ok: true, needsEmailConfirmation: true };
          }

          set({
            account: result.account,
            status: result.account ? 'authenticated' : 'guest',
            infoMessage: result.account ? `Бүртгэл амжилттай! Тавтай морил, ${result.account.name}.` : null,
          });
          return { ok: true, needsEmailConfirmation: false };
        } catch (error) {
          set({
            status: 'guest',
            authError: error instanceof Error ? error.message : 'Бүртгүүлэхэд алдаа гарлаа.',
          });
          return { ok: false, needsEmailConfirmation: false };
        }
      },

      sendPasswordReset: async (email) => {
        set({ authError: null, infoMessage: null });
        try {
          await SupabaseAuthService.sendPasswordReset(email);
          set({ infoMessage: 'Нууц үг сэргээх холбоосыг имэйл рүү илгээлээ.' });
          return true;
        } catch (error) {
          set({ authError: error instanceof Error ? error.message : 'Имэйл илгээхэд алдаа гарлаа.' });
          return false;
        }
      },

      updateProfile: async (updates) => {
        const { account } = get();
        if (!account) return false;

        set({ authError: null });
        try {
          const updated = await SupabaseAuthService.updateAccount(updates);
          if (updated) {
            set({ account: updated, infoMessage: 'Профайл шинэчлэгдлээ.' });
            return true;
          }
          return false;
        } catch (error) {
          set({ authError: error instanceof Error ? error.message : 'Профайл шинэчлэхэд алдаа гарлаа.' });
          return false;
        }
      },

      signOut: async () => {
        await SupabaseAuthService.signOut();
        set({ account: null, status: 'guest', authError: null, infoMessage: 'Системээс гарлаа.' });
      },

      clearMessages: () => set({ authError: null, infoMessage: null }),

      addAddress: (address) => {
        const { account } = get();
        if (!account) return;

        set((state) => {
          const data = state.userData[account.id] ?? EMPTY_USER_DATA;
          const addresses = [...data.addresses, { ...address, id: createAddressId() }];
          return {
            userData: {
              ...state.userData,
              [account.id]: { ...data, addresses, selectedAddressIndex: addresses.length - 1 },
            },
          };
        });
      },

      updateAddress: (id, address) => {
        const { account } = get();
        if (!account) return;

        set((state) => {
          const data = state.userData[account.id] ?? EMPTY_USER_DATA;
          return {
            userData: {
              ...state.userData,
              [account.id]: {
                ...data,
                addresses: data.addresses.map((item) => (item.id === id ? { ...address, id } : item)),
              },
            },
          };
        });
      },

      removeAddress: (id) => {
        const { account } = get();
        if (!account) return;

        set((state) => {
          const data = state.userData[account.id] ?? EMPTY_USER_DATA;
          const addresses = data.addresses.filter((item) => item.id !== id);
          return {
            userData: {
              ...state.userData,
              [account.id]: {
                ...data,
                addresses,
                selectedAddressIndex: Math.min(data.selectedAddressIndex, Math.max(addresses.length - 1, 0)),
              },
            },
          };
        });
      },

      setSelectedAddressIndex: (index) => {
        const { account } = get();
        if (!account) return;

        set((state) => {
          const data = state.userData[account.id] ?? EMPTY_USER_DATA;
          if (index < 0 || index >= data.addresses.length) return state;
          return {
            userData: { ...state.userData, [account.id]: { ...data, selectedAddressIndex: index } },
          };
        });
      },

      toggleZityChefConnection: () => {
        const { account } = get();
        if (!account) return;

        set((state) => {
          const data = state.userData[account.id] ?? EMPTY_USER_DATA;
          return {
            userData: {
              ...state.userData,
              [account.id]: { ...data, isZityChefConnected: !data.isZityChefConnected },
            },
          };
        });
      },

      addPoints: (amount) => {
        const { account } = get();
        if (!account || amount <= 0) return;

        set((state) => {
          const data = state.userData[account.id] ?? EMPTY_USER_DATA;
          return {
            userData: {
              ...state.userData,
              [account.id]: { ...data, zityPoints: data.zityPoints + Math.round(amount) },
            },
          };
        });
      },
    }),
    {
      name: 'zity-auth',
      // Session нь SupabaseAuthService дээр тусад нь хадгалагддаг тул
      // энд зөвхөн хэрэглэгчийн локал өгөгдлийг хадгална.
      partialize: (state) => ({ userData: state.userData }),
    }
  )
);

/**
 * Chef API руу явах хүсэлтэд нэвтэрсэн хэрэглэгчийн token-г автоматаар залгана.
 *
 * Эхлээд кэшлэсэн token-ыг синхроноор шалгаж, байхгүй бол supabase-js-ээс
 * асууна — ингэснээр апп ачаалсны дараах эхний хүсэлт token-гүй явахгүй.
 */
setAuthTokenProvider(async () => {
  const cached = SupabaseAuthService.getStoredSession()?.accessToken;
  if (cached) return cached;

  const session = await SupabaseAuthService.getValidSession();
  return session?.accessToken ?? null;
});

/**
 * Хэрэглэгчийн профайлыг component дотор ашиглах hook.
 *
 * `useAuthStore((s) => s.getProfile())` гэж шууд дуудаж БОЛОХГҮЙ — selector бүр
 * шинэ объект буцаадаг тул React дахин render-ийн давталтад ордог. Энд эх өгөгдөл
 * (account, userData) өөрчлөгдсөн үед л шинэ объект үүснэ.
 */
export function useUserProfile(): UserProfile {
  const account = useAuthStore((state) => state.account);
  const userData = useAuthStore((state) =>
    state.account ? state.userData[state.account.id] : undefined
  );

  return useMemo(() => {
    if (!account) return GUEST_PROFILE;

    const data = userData ?? EMPTY_USER_DATA;
    return {
      name: account.name,
      email: account.email,
      phone: account.phone,
      avatarUrl: account.avatarUrl,
      zityPoints: data.zityPoints,
      addresses: data.addresses,
      isZityChefConnected: data.isZityChefConnected,
    };
  }, [account, userData]);
}
