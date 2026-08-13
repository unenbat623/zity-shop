import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { useAuthStore } from '../store/useAuthStore';
import { SupabaseAuthService } from '../services/supabaseAuthService';
import { CheckCircle2, ChefHat, LogIn, ShieldCheck, AlertTriangle } from 'lucide-react';

export function LoginScreen() {
  const navigate = useNavigate();
  const { isAuthenticated, isAuthLoading, authError, hydrateAuthFromUrl, signInWithGoogle } = useAuthStore();
  const configError = SupabaseAuthService.getConfigError();

  useEffect(() => {
    void hydrateAuthFromUrl();
  }, [hydrateAuthFromUrl]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-background pb-28 text-text-main">
      <Header />

      <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-8">
        <section className="w-full overflow-hidden rounded-3xl border border-border bg-surface shadow-xs">
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 text-white">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3 py-1 text-xs font-extrabold text-emerald-200">
              <ChefHat className="h-4 w-4" /> Zity Chef + Delguur
            </div>
            <h1 className="text-2xl font-black text-white">Google бүртгэлээр нэвтрэх</h1>
            <p className="mt-2 text-sm leading-relaxed text-emerald-100/80">
              Нэг Google бүртгэлээр Zity Chef жор, Delguur захиалга, хадгалсан бараа, хүргэлтийн мэдээллээ холбоно.
            </p>
          </div>

          <div className="space-y-4 p-5">
            {(authError || configError) && (
              <div className="flex gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{authError || configError}</span>
              </div>
            )}

            <button
              onClick={signInWithGoogle}
              disabled={isAuthLoading || Boolean(configError)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-extrabold text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAuthLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <LogIn className="h-5 w-5" /> Google-р нэвтрэх / бүртгүүлэх
                </>
              )}
            </button>

            <div className="grid grid-cols-1 gap-2 text-xs text-text-muted">
              {[
                'Supabase Google OAuth callback URL зөв байх ёстой.',
                'Redirect URL: http://localhost:3000/login',
                'Production redirect URL-г Supabase Authentication URL config дээр нэмнэ.',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-2xl border border-border bg-surface-hover p-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border bg-surface-hover p-3 text-[11px] text-text-muted">
              <div className="mb-1 flex items-center gap-1.5 font-extrabold text-text-main">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Тохиргоо
              </div>
              Delguur `.env` дээр `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` байх шаардлагатай. Service role key,
              database password, Google secret зэрэг нууц түлхүүрүүд frontend-д орохгүй.
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
