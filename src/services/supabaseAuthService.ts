/**
 * Нэвтрэлтийн давхарга — `@supabase/supabase-js` дээр суурилсан.
 *
 * Дэмждэг урсгал:
 *  1. Google OAuth (PKCE) — Zity Chef-тэй ижил механизм
 *  2. Имэйл + нууц үгээр бүртгүүлэх / нэвтрэх / нууц үг сэргээх
 *  3. Session-г автоматаар хадгалж, дуусахад нь сунгах
 *
 * Frontend-д зөвхөн public anon key ашиглана. Service role key энд ХЭЗЭЭ Ч орохгүй.
 */

import type {
  AuthChangeEvent,
  AuthError as SupabaseAuthError,
  Session,
  User,
} from '@supabase/supabase-js';

import { supabase } from '../lib/supabaseClient';
import { getAuthRedirectUrl, getSupabaseConfigError, isSupabaseConfigured } from '../lib/env';
import { AuthAccount } from '../types';

/** OAuth руу явахын өмнө хүлээж буй буцах хаягийг түр тэмдэглэнэ */
const PENDING_OAUTH_KEY = 'zity_pending_oauth_redirect';

/**
 * Хуудас ачаалахад URL дээр байсан OAuth-ийн үр дүнг ЯГ ТЭР АГШИНД барьж авна.
 *
 * `detectSessionInUrl: true` тул supabase-js нь `?code=` болон `?error=`
 * параметрүүдийг уншаад URL-ийг цэвэрлэдэг. Тэр цэвэрлэлт async ажилладаг тул
 * хожуу уншвал алдаа алга болсон байдаг — хэрэглэгчид юу ч харагдахгүй.
 * Тиймээс модуль ачаалах үед (client үүсэхтэй нэг tick дотор) хуулж авна.
 */
const initialRedirect = (() => {
  if (typeof window === 'undefined') {
    return { hadAuthPayload: false, errorCode: null, errorDescription: null };
  }

  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));

  const errorCode = url.searchParams.get('error_code') ?? hashParams.get('error_code');
  const errorDescription =
    url.searchParams.get('error_description') ?? hashParams.get('error_description');

  return {
    hadAuthPayload:
      url.searchParams.has('code') ||
      hashParams.has('access_token') ||
      Boolean(errorDescription) ||
      Boolean(errorCode),
    errorCode,
    errorDescription,
  };
})();

/** Нэг удаа л мэдэгдэхийн тулд уншсаны дараа тэмдэглэнэ */
let redirectErrorConsumed = false;

export class AuthError extends Error {
  readonly code: string;

  constructor(message: string, code = 'auth_error') {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

/** Supabase-ийн англи алдааг хэрэглэгчид ойлгомжтой монгол мессеж болгоно */
function translateAuthError(error: SupabaseAuthError | Error | null): string {
  if (!error) return 'Нэвтрэлтийн үед алдаа гарлаа.';

  const raw = error.message || '';
  const message = raw.toLowerCase();
  const status = 'status' in error ? Number(error.status) : 0;

  if (message.includes('invalid login credentials')) {
    return 'Имэйл эсвэл нууц үг буруу байна.';
  }
  if (message.includes('email not confirmed')) {
    return 'Имэйлээ баталгаажуулаагүй байна. Имэйл дэх холбоосыг дарна уу.';
  }
  if (message.includes('already registered') || message.includes('user already exists')) {
    return 'Энэ имэйл аль хэдийн бүртгэлтэй байна. Нэвтэрнэ үү.';
  }
  if (message.includes('password should be at least')) {
    return 'Нууц үг хэт богино байна (хамгийн багадаа 6 тэмдэгт).';
  }
  if (message.includes('unable to validate email') || message.includes('invalid email')) {
    return 'Имэйл хаяг буруу форматтай байна.';
  }
  if (message.includes('rate limit') || status === 429) {
    return 'Хэт олон удаа оролдлоо. Хэсэг хүлээгээд дахин оролдоно уу.';
  }
  if (message.includes('signups not allowed')) {
    return 'Шинэ бүртгэл түр хаалттай байна.';
  }
  if (message.includes('bad_oauth_state') || message.includes('state not found')) {
    return 'Нэвтрэлтийн session хугацаа дууссан байна. Дахин оролдоно уу.';
  }
  if (message.includes('redirect') && message.includes('not allowed')) {
    return `Буцах хаяг Supabase дээр бүртгэгдээгүй байна: ${getAuthRedirectUrl()}`;
  }
  if (status >= 500) {
    return 'Нэвтрэлтийн сервер түр ажиллахгүй байна. Дараа дахин оролдоно уу.';
  }
  return raw || 'Нэвтрэлтийн үед алдаа гарлаа.';
}

function requireClient(): NonNullable<typeof supabase> {
  if (!supabase) {
    throw new AuthError(getSupabaseConfigError() || 'Supabase тохиргоо дутуу байна.', 'not_configured');
  }
  return supabase;
}

function toAccount(user: User): AuthAccount {
  const metadata = user.user_metadata ?? {};
  const displayName =
    (metadata.full_name as string) ||
    (metadata.name as string) ||
    user.email?.split('@')[0] ||
    'Zity хэрэглэгч';

  return {
    id: user.id,
    email: user.email ?? '',
    name: displayName,
    phone: user.phone || (metadata.phone as string) || '',
    avatarUrl: (metadata.avatar_url as string) || (metadata.picture as string) || '',
    provider: user.app_metadata?.provider === 'google' ? 'google' : 'email',
    isEmailConfirmed: Boolean(user.email_confirmed_at || user.confirmed_at),
    createdAt: user.created_at || new Date().toISOString(),
  };
}

/**
 * Хамгийн сүүлийн access token-ыг санаж байна.
 *
 * `apiClient` нь хүсэлт бүрт token-ыг СИНХРОНООР авах шаардлагатай (fetch
 * wrapper нь async token provider дэмждэггүй). supabase-js нь session-оо
 * async буцаадаг тул `onAuthStateChange`-ээр кэшлэж, синхрон уншина.
 */
let cachedAccessToken: string | null = null;

if (supabase) {
  // Хуудас ачаалахад аль хэдийн хадгалагдсан session байвал шууд авна
  void supabase.auth.getSession().then(({ data }) => {
    cachedAccessToken = data.session?.access_token ?? null;
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    cachedAccessToken = session?.access_token ?? null;
  });
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
}

function toAuthSession(session: Session | null): AuthSession | null {
  if (!session) return null;
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token ?? null,
    expiresAt: (session.expires_at ?? 0) * 1000,
  };
}

export const SupabaseAuthService = {
  isConfigured: isSupabaseConfigured,
  getConfigError: getSupabaseConfigError,

  /** Кэшлэсэн access token (синхрон). apiClient үүнийг ашиглана. */
  getStoredSession(): { accessToken: string } | null {
    return cachedAccessToken ? { accessToken: cachedAccessToken } : null;
  },

  /** Хүчинтэй session. Хугацаа дуусаж байвал supabase-js өөрөө сунгана. */
  async getValidSession(): Promise<AuthSession | null> {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return toAuthSession(data.session);
  },

  async refreshSession(): Promise<AuthSession | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.auth.refreshSession();
    if (error) return null;
    return toAuthSession(data.session);
  },

  /**
   * Google OAuth руу шилжүүлнэ (PKCE).
   *
   * Буцах хаяг нь Supabase-ийн Redirect URLs жагсаалтад байх ёстой. Байхгүй бол
   * Supabase нь Site URL руу буцаадаг — Site URL нь Zity Chef бол хэрэглэгч
   * Delguur-ээс нэвтрээд Chef дээр очно. Тиймээс хүлээж буй хаягаа тэмдэглээд,
   * буцаж ирэхэд таарч байгаа эсэхийг шалгана.
   */
  async signInWithGoogle(): Promise<void> {
    const client = requireClient();
    const redirectTo = getAuthRedirectUrl();

    try {
      sessionStorage.setItem(PENDING_OAUTH_KEY, redirectTo);
    } catch {
      /* sessionStorage хаалттай байж болно */
    }

    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });

    if (error) {
      throw new AuthError(translateAuthError(error), 'oauth_failed');
    }
  },

  /** Google руу явсан боловч session-гүй буцаж ирсэн эсэхийг илрүүлнэ */
  takePendingOAuthRedirect(): string | null {
    try {
      const pending = sessionStorage.getItem(PENDING_OAUTH_KEY);
      sessionStorage.removeItem(PENDING_OAUTH_KEY);
      return pending;
    } catch {
      return null;
    }
  },

  /** Имэйл + нууц үгээр нэвтрэх */
  async signInWithPassword(email: string, password: string): Promise<AuthAccount> {
    const client = requireClient();

    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) throw new AuthError(translateAuthError(error), 'sign_in_failed');
    if (!data.user) throw new AuthError('Хэрэглэгчийн мэдээлэл ирсэнгүй.', 'no_user');

    return toAccount(data.user);
  },

  /**
   * Имэйл + нууц үгээр бүртгүүлэх.
   * Имэйл баталгаажуулалт асаалттай бол session буцахгүй.
   */
  async signUpWithPassword(
    email: string,
    password: string,
    fullName: string,
    phone?: string
  ): Promise<{ account: AuthAccount | null; needsEmailConfirmation: boolean }> {
    const client = requireClient();

    const { data, error } = await client.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
        data: { full_name: fullName.trim(), phone: phone?.trim() || '' },
      },
    });

    if (error) throw new AuthError(translateAuthError(error), 'sign_up_failed');

    if (!data.session) {
      return { account: null, needsEmailConfirmation: true };
    }

    return {
      account: data.user ? toAccount(data.user) : null,
      needsEmailConfirmation: false,
    };
  },

  /** Нууц үг сэргээх имэйл илгээх */
  async sendPasswordReset(email: string): Promise<void> {
    const client = requireClient();

    const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: getAuthRedirectUrl(),
    });

    if (error) throw new AuthError(translateAuthError(error), 'reset_failed');
  },

  /**
   * Шинэ нууц үг тавих.
   *
   * Сэргээх имэйлийн холбоосоор орж ирсэн хэрэглэгч түр session-той болдог —
   * тэр session дээр л нууц үгээ солих боломжтой. Энэ алхмыг гүйцэтгэхгүй бол
   * хэрэглэгч зүгээр нэвтэрчихээд хуучин нууц үгтэйгээ үлддэг.
   */
  async updatePassword(password: string): Promise<AuthAccount | null> {
    const client = requireClient();

    const { data, error } = await client.auth.updateUser({ password });
    if (error) throw new AuthError(translateAuthError(error), 'password_update_failed');

    return data.user ? toAccount(data.user) : null;
  },

  /**
   * OAuth callback-ийн URL дээр auth-ийн мэдээлэл байсан эсэхийг хэлнэ.
   *
   * ⚠️ Энэ функц URL-ийг ӨӨРЧЛӨХГҮЙ. `detectSessionInUrl: true` тул supabase-js
   * өөрөө `?code=` / `#access_token=` -ийг уншиж, session үүсгээд URL-ийг
   * цэвэрлэдэг. Хэрэв бид түүнээс өмнө параметрүүдийг устгавал нэвтрэлт
   * бүтэлгүйтэнэ — тиймээс энд зөвхөн уншина.
   */
  inspectRedirect(): { hadAuthPayload: boolean } {
    return { hadAuthPayload: initialRedirect.hadAuthPayload };
  },

  /**
   * Хуудас ачаалахад URL дээр байсан OAuth алдааг буцаана (нэг удаа).
   * Утгыг модуль ачаалах үед хуулж авсан тул supabase-js цэвэрлэсэн ч алдагдахгүй.
   */
  takeRedirectError(): string | null {
    if (redirectErrorConsumed) return null;
    redirectErrorConsumed = true;

    const { errorCode, errorDescription } = initialRedirect;
    if (!errorDescription && !errorCode) return null;

    // supabase-js цэвэрлээгүй байвал өөрсдөө арилгана — reload дээр дахин гарахгүй
    const url = new URL(window.location.href);
    if (url.searchParams.has('error') || url.searchParams.has('error_code') || url.hash) {
      window.history.replaceState(null, document.title, url.pathname);
    }

    const readable = errorDescription
      ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
      : (errorCode ?? '');

    if (errorCode === 'bad_oauth_state' || readable.toLowerCase().includes('state not found')) {
      return (
        'Нэвтрэлтийн session олдсонгүй эсвэл хугацаа нь дууссан байна. ' +
        'Хуучин таб/холбоосыг хаагаад дахин нэвтэрнэ үү.'
      );
    }

    return readable || 'Нэвтрэлт амжилтгүй боллоо.';
  },

  /** Одоогийн хэрэглэгч */
  async fetchAccount(): Promise<AuthAccount | null> {
    if (!supabase) return null;

    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user) return null;

    return toAccount(data.session.user);
  },

  /** Нэр/утсыг user_metadata дээр шинэчлэх */
  async updateAccount(updates: { name?: string; phone?: string }): Promise<AuthAccount | null> {
    const client = requireClient();

    const { data, error } = await client.auth.updateUser({
      data: {
        ...(updates.name !== undefined ? { full_name: updates.name.trim() } : {}),
        ...(updates.phone !== undefined ? { phone: updates.phone.trim() } : {}),
      },
    });

    if (error) throw new AuthError(translateAuthError(error), 'update_failed');
    return data.user ? toAccount(data.user) : null;
  },

  async signOut(): Promise<void> {
    if (!supabase) return;
    await supabase.auth.signOut().catch(() => undefined);
    cachedAccessToken = null;
  },

  clearSession(): void {
    cachedAccessToken = null;
    void supabase?.auth.signOut().catch(() => undefined);
  },

  /**
   * Session-ы өөрчлөлтийг сонсоно.
   *
   * Юуг барих вэ:
   *   - `SIGNED_OUT` — өөр таб дээр эсвэл Zity Chef дээр гарсан
   *   - `TOKEN_REFRESHED` — token сунгагдсан (account шинэчлэгдэнэ)
   *   - `PASSWORD_RECOVERY` — сэргээх холбоосоор орж ирсэн, шинэ нууц үг тавих ёстой
   *   - `USER_UPDATED` — профайл/нууц үг өөрчлөгдсөн
   */
  onAuthStateChange(
    callback: (account: AuthAccount | null, event: AuthChangeEvent) => void
  ): () => void {
    if (!supabase) return () => undefined;

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ? toAccount(session.user) : null, event);
    });

    return () => data.subscription.unsubscribe();
  },
};
