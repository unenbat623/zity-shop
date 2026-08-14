import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from './env';

/**
 * Supabase browser client.
 *
 * Zity Chef Complex-тэй ЯГ ижил тохиргоо (`@supabase/supabase-js`, PKCE) —
 * ингэснээр хоёр апп нэг Supabase төсөл дээр ижилхэн ажиллана.
 *
 * Яагаад номын сан ашиглаж байна вэ: өмнө нь GoTrue REST рүү гараар хандаж,
 * implicit flow (`#access_token=...`) ашигладаг байсан. Тэр нь OAuth-ийн
 * `state`-ийг зөв удирддаггүй тул `bad_oauth_state` («OAuth state not found or
 * expired») алдаа өгдөг байв. supabase-js нь PKCE-ийн code verifier, state,
 * session refresh, callback боловсруулалтыг бүгдийг нь өөрөө хийнэ.
 *
 * anon key нь browser-т зориулсан public түлхүүр — өгөгдлийг RLS хамгаална.
 * service_role key энд ХЭЗЭЭ Ч орохгүй.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // OAuth-аас буцаж ирсэн URL-ийг автоматаар уншиж session үүсгэнэ
        detectSessionInUrl: true,
        flowType: 'pkce',
        // Chef-тэй ижил origin дээр ажиллах тохиолдолд түлхүүр давхцахгүй байх
        storageKey: 'zity-delguur-auth',
      },
    })
  : null;
