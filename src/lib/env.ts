/**
 * Frontend орчны хувьсагчийн нэг цэгийн хандалт.
 *
 * ЧУХАЛ: `VITE_*` хувьсагч browser bundle-д ил орно. Тиймээс энд зөвхөн
 * public утга байна — service role key, DB password, OAuth client secret,
 * SMTP password зэргийг ХЭЗЭЭ Ч энд оруулахгүй (docs/chef-backend-env.md).
 */

function readString(key: keyof ImportMetaEnv, fallback = ''): string {
  const value = import.meta.env[key];
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback;
}

export const IS_DEV = import.meta.env.DEV;

export const env = {
  appName: readString('VITE_APP_NAME', 'Zity Delguur'),
  appEnv: readString('VITE_APP_ENV', IS_DEV ? 'development' : 'production'),

  /** Zity Chef backend-ийн public base URL */
  chefApiUrl: readString('VITE_ZITY_CHEF_API_URL', 'http://localhost:3002').replace(/\/+$/, ''),

  supabaseUrl: readString('VITE_SUPABASE_URL').replace(/\/+$/, ''),
  supabaseAnonKey: readString('VITE_SUPABASE_ANON_KEY'),

  /**
   * OAuth-ийн дараа буцаж ирэх суурь хаяг.
   *
   * Хоосон бол тухайн үеийн `window.location.origin` ашиглана. Гар утаснаас
   * LAN хаягаар (жишээ нь http://10.20.19.58:3005) тестлэх үед энд яг тэр
   * хаягийг бичээд Supabase дээр мөн адил бүртгэнэ.
   */
  authRedirectUrl: readString('VITE_AUTH_REDIRECT_URL').replace(/\/+$/, ''),

  odoo: {
    url: readString('VITE_ODOO_URL', 'https://odoo.zity.mn').replace(/\/+$/, ''),
    db: readString('VITE_ODOO_DB', 'zity_delguur_db'),
    username: readString('VITE_ODOO_USERNAME', 'api_admin@zity.mn'),
  },

  /** Admin dashboard-д нэвтрэх эрхтэй имэйлүүд (таслалаар тусгаарлана) */
  adminEmails: readString('VITE_ADMIN_EMAILS')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
} as const;

/** Supabase Auth ашиглах боломжтой эсэх */
export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

/** Supabase тохиргоо дутуу үед хэрэглэгчид харуулах мессеж */
export function getSupabaseConfigError(): string | null {
  if (isSupabaseConfigured()) return null;
  if (!env.supabaseUrl && !env.supabaseAnonKey) {
    return 'Нэвтрэлт идэвхгүй байна: .env дээр VITE_SUPABASE_URL болон VITE_SUPABASE_ANON_KEY-г тохируулна уу.';
  }
  if (!env.supabaseUrl) return 'Нэвтрэлт идэвхгүй байна: VITE_SUPABASE_URL дутуу байна.';
  return 'Нэвтрэлт идэвхгүй байна: VITE_SUPABASE_ANON_KEY дутуу байна.';
}

/**
 * Zity Chef API-г дуудах base URL.
 *
 * Dev үед Vite proxy (`/api/zity-chef`) ашиглана — ингэснээр Chef backend дээр
 * CORS тохируулаагүй байсан ч ажиллана. Production дээр шууд public URL руу очно.
 */
export function getChefApiBase(): string {
  if (IS_DEV) return '/api/zity-chef';
  return `${env.chefApiUrl}/api`;
}

/**
 * OAuth callback-ийн бүтэн хаяг.
 *
 * Энэ ЯГ хаяг Supabase → Authentication → URL Configuration → Redirect URLs
 * жагсаалтад байх ёстой. Байхгүй бол Supabase нь Site URL руу (Zity Chef рүү)
 * буцаадаг тул хэрэглэгч буруу апп дээр очно.
 */
export function getAuthRedirectUrl(): string {
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  /**
   * `VITE_AUTH_REDIRECT_URL` нь одоогийн origin-оос ЗӨРВӨЛ түүнийг үл тоомсорлоно.
   *
   * Шалтгаан: локал `.env` дээрх `http://localhost:3005` утгыг Vercel рүү хуулж
   * тавихад нэвтрэлт хэрэглэгчийг localhost руу буцаах гэж оролдоод бүтэлгүйтдэг.
   * Одоогийн origin үргэлж зөв байдаг тул түүнийг илүүд үзнэ.
   */
  if (env.authRedirectUrl && currentOrigin && env.authRedirectUrl !== currentOrigin) {
    if (IS_DEV) {
      console.warn(
        `[Zity] VITE_AUTH_REDIRECT_URL (${env.authRedirectUrl}) нь одоогийн хаяг (${currentOrigin})-тай ` +
          'таарахгүй байна. Одоогийн хаягийг ашиглалаа.'
      );
    }
    return `${currentOrigin}/login`;
  }

  return `${env.authRedirectUrl || currentOrigin}/login`;
}

/** `VITE_ADMIN_EMAILS` тохируулагдсан эсэх */
export function isAdminRestrictionConfigured(): boolean {
  return env.adminEmails.length > 0;
}

/**
 * Имэйл admin эрхтэй эсэх.
 *
 * `VITE_ADMIN_EMAILS` тохируулаагүй үед нэвтэрсэн дурын хэрэглэгч admin dashboard-г
 * үзэж чадна (тохиргооны өмнөх үе шат). Энэ тохиолдолд UI дээр анхааруулга гарна —
 * production дээр заавал жагсаалтаа тохируулах ёстой.
 */
export function isAdminEmail(email: string | undefined | null): boolean {
  if (!isAdminRestrictionConfigured()) return true;
  if (!email) return false;
  return env.adminEmails.includes(email.trim().toLowerCase());
}
