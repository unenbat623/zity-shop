import { UserProfile } from '../types';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
const ACCESS_TOKEN_KEY = 'zity_supabase_access_token';
const REFRESH_TOKEN_KEY = 'zity_supabase_refresh_token';

interface SupabaseUserResponse {
  id: string;
  email?: string;
  phone?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
  };
}

export class SupabaseAuthService {
  static isConfigured(): boolean {
    return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
  }

  static getConfigError(): string | null {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) return null;
    return 'Supabase Google нэвтрэлт идэвхжүүлэхийн тулд VITE_SUPABASE_URL болон VITE_SUPABASE_ANON_KEY тохируулна уу.';
  }

  static signInWithGoogle(): void {
    if (!this.isConfigured()) {
      throw new Error(this.getConfigError() || 'Supabase тохиргоо дутуу байна.');
    }

    const redirectTo = `${window.location.origin}/login`;
    const authUrl = new URL(`${SUPABASE_URL}/auth/v1/authorize`);
    authUrl.searchParams.set('provider', 'google');
    authUrl.searchParams.set('redirect_to', redirectTo);
    authUrl.searchParams.set('scopes', 'email profile');

    window.location.href = authUrl.toString();
  }

  static async hydrateFromRedirect(): Promise<UserProfile | null> {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const accessToken = hash.get('access_token');
    const refreshToken = hash.get('refresh_token');
    const errorDescription = hash.get('error_description');

    if (errorDescription) {
      throw new Error(decodeURIComponent(errorDescription));
    }

    if (accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
      window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }

    return this.getCurrentUser();
  }

  static async getCurrentUser(): Promise<UserProfile | null> {
    if (!this.isConfigured()) return null;

    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) return null;

    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      this.clearSession();
      return null;
    }

    const data = (await response.json()) as SupabaseUserResponse;
    return {
      name: data.user_metadata?.full_name || data.user_metadata?.name || data.email?.split('@')[0] || 'Zity хэрэглэгч',
      email: data.email || '',
      phone: data.phone || '',
      zityPoints: 0,
      isZityChefConnected: true,
      addresses: [
        {
          district: 'Сүхбаатар дүүрэг',
          khoroo: '1-р хороо',
          streetBuilding: 'Zity Center',
          entranceAppt: '',
          phone: data.phone || '',
          notes: 'Google бүртгэлээр үүссэн хэрэглэгч',
        },
      ],
    };
  }

  static async signOut(): Promise<void> {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (this.isConfigured() && accessToken) {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
      }).catch(() => undefined);
    }

    this.clearSession();
  }

  static clearSession(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}
