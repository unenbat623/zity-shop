import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ChefHat,
  Eye,
  EyeOff,
  Copy,
  Info,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';

import { AppShell } from '../components/AppShell';
import { GoogleIcon } from '../components/ui/GoogleIcon';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { getAuthRedirectUrl, getSupabaseConfigError, isSupabaseConfigured } from '../lib/env';

type Tab = 'signin' | 'signup';

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Монголын гар утасны дугаар: 8 орон, 6/7/8/9-өөр эхэлнэ */
const PHONE_PATTERN = /^[6-9]\d{7}$/;
const MIN_PASSWORD_LENGTH = 6;

export function LoginScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useToastStore((state) => state.show);

  const {
    status,
    authError,
    infoMessage,
    account,
    signInWithGoogle,
    signInWithPassword,
    signUpWithPassword,
    sendPasswordReset,
    clearMessages,
  } = useAuthStore();

  const [tab, setTab] = useState<Tab>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const configError = getSupabaseConfigError();
  const isConfigured = isSupabaseConfigured();
  const redirectUrl = getAuthRedirectUrl();

  const handleCopyRedirect = async () => {
    try {
      await navigator.clipboard.writeText(redirectUrl);
      showToast('Redirect URL хуулагдлаа.', 'success');
    } catch {
      showToast('Хуулж чадсангүй — гараар хуулна уу.', 'warning');
    }
  };
  const isBusy = isSubmitting || status === 'loading';

  /** Нэвтрэхийн өмнө очих гэж байсан хуудас */
  const redirectTo = useMemo(() => {
    const from = (location.state as { from?: string } | null)?.from;
    return from && from !== '/login' ? from : '/profile';
  }, [location.state]);

  // Нэвтэрсэн бол буцаж ирсэн хуудас руугаа шилжинэ
  useEffect(() => {
    if (account) {
      navigate(redirectTo, { replace: true });
    }
  }, [account, navigate, redirectTo]);

  // Store-оос ирсэн мессежийг toast болгож харуулна
  useEffect(() => {
    if (authError) {
      showToast(authError, 'error');
      clearMessages();
    } else if (infoMessage) {
      showToast(infoMessage, 'success');
      clearMessages();
    }
  }, [authError, infoMessage, showToast, clearMessages]);

  const switchTab = (next: Tab) => {
    setTab(next);
    setErrors({});
    setPassword('');
    setConfirmPassword('');
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!EMAIL_PATTERN.test(email.trim())) {
      nextErrors.email = 'Зөв имэйл хаяг оруулна уу.';
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = `Нууц үг хамгийн багадаа ${MIN_PASSWORD_LENGTH} тэмдэгт байна.`;
    }

    if (tab === 'signup') {
      if (name.trim().length < 2) {
        nextErrors.name = 'Нэрээ бүтнээр нь оруулна уу.';
      }
      if (phone.trim() && !PHONE_PATTERN.test(phone.trim())) {
        nextErrors.phone = 'Утасны дугаар 8 оронтой байх ёстой.';
      }
      if (confirmPassword !== password) {
        nextErrors.confirmPassword = 'Нууц үг таарахгүй байна.';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isConfigured || isBusy) return;
    if (!validate()) return;

    setIsSubmitting(true);
    if (tab === 'signin') {
      await signInWithPassword(email, password);
    } else {
      await signUpWithPassword(email, password, name, phone);
    }
    setIsSubmitting(false);
  };

  const handleForgotPassword = async () => {
    if (!EMAIL_PATTERN.test(email.trim())) {
      setErrors({ email: 'Нууц үг сэргээхийн тулд имэйлээ оруулна уу.' });
      return;
    }
    setIsSubmitting(true);
    await sendPasswordReset(email);
    setIsSubmitting(false);
  };

  return (
    <AppShell showSearch={false} title="Нэвтрэх" maxWidth="md">
        <section className="zity-card overflow-hidden">
          {/* Brand header */}
          <div className="zity-brand-surface relative overflow-hidden p-6">
            <div className="relative z-10">
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3 py-1 text-[11px] font-extrabold text-emerald-100">
                <ChefHat className="h-3.5 w-3.5" /> Zity Chef × Delguur
              </span>
              <h1 className="text-xl font-black text-white">
                {tab === 'signin' ? 'Бүртгэлээрээ нэвтрэх' : 'Шинэ бүртгэл үүсгэх'}
              </h1>
              <p className="mt-2 text-xs leading-relaxed text-emerald-100/80">
                Нэг бүртгэлээр Zity Chef жор, Delguur захиалга, хөргөгчийн нөөц, хүргэлтийн хаягаа нэгтгэнэ.
              </p>
            </div>
            <ChefHat className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rotate-12 text-white/10" />
          </div>

          <div className="space-y-4 p-5">
            {/* Тохиргоо дутуу үеийн анхааруулга */}
            {configError && (
              <div className="flex gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] leading-relaxed text-amber-600">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{configError}</span>
              </div>
            )}

            {/* Google */}
            <button
              onClick={signInWithGoogle}
              disabled={!isConfigured || isBusy}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-surface py-3.5 text-sm font-bold text-text-main transition-all hover:bg-surface-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <GoogleIcon className="h-5 w-5" />
              Google-ээр үргэлжлүүлэх
            </button>

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">эсвэл</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            {/* Tab switcher */}
            <div className="flex rounded-2xl border border-border bg-surface-hover p-1">
              {(
                [
                  { id: 'signin', label: 'Нэвтрэх' },
                  { id: 'signup', label: 'Бүртгүүлэх' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => switchTab(item.id)}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-extrabold transition-all ${
                    tab === item.id
                      ? 'bg-surface text-emerald-600 shadow-xs'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              {tab === 'signup' && (
                <Field
                  id="name"
                  label="Нэр"
                  icon={User}
                  error={errors.name}
                  value={name}
                  onChange={setName}
                  placeholder="Батбаатар Үнэнбат"
                  autoComplete="name"
                />
              )}

              <Field
                id="email"
                label="Имэйл"
                icon={Mail}
                type="email"
                error={errors.email}
                value={email}
                onChange={setEmail}
                placeholder="name@example.com"
                autoComplete="email"
              />

              {tab === 'signup' && (
                <Field
                  id="phone"
                  label="Утас (сонголтоор)"
                  icon={Phone}
                  type="tel"
                  error={errors.phone}
                  value={phone}
                  onChange={setPhone}
                  placeholder="99112233"
                  autoComplete="tel"
                  inputMode="numeric"
                />
              )}

              <Field
                id="password"
                label="Нууц үг"
                icon={Lock}
                type={showPassword ? 'text' : 'password'}
                error={errors.password}
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:text-text-main"
                    aria-label={showPassword ? 'Нууц үг нуух' : 'Нууц үг харуулах'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />

              {tab === 'signup' && (
                <Field
                  id="confirmPassword"
                  label="Нууц үг давтах"
                  icon={Lock}
                  type={showPassword ? 'text' : 'password'}
                  error={errors.confirmPassword}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              )}

              {tab === 'signin' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => void handleForgotPassword()}
                    disabled={!isConfigured || isBusy}
                    className="-my-1 px-1 py-2 text-[11px] font-bold text-emerald-600 hover:underline disabled:opacity-50"
                  >
                    Нууц үгээ мартсан уу?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={!isConfigured || isBusy}
                className="zity-btn-primary w-full py-3.5 text-sm"
              >
                {isBusy ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : tab === 'signin' ? (
                  'Нэвтрэх'
                ) : (
                  'Бүртгүүлэх'
                )}
              </button>
            </form>

            {tab === 'signup' && (
              <p className="text-center text-[10px] leading-relaxed text-text-subtle">
                Бүртгүүлснээр Zity Delguur-ийн үйлчилгээний нөхцөл, нууцлалын бодлогыг зөвшөөрч байгаа болно.
              </p>
            )}

            {/* Redirect URL — Supabase дээр бүртгэгдээгүй бол Chef рүү буцаадаг */}
            {isConfigured && (
              <details className="rounded-2xl border border-border bg-surface-hover p-3 text-[11px] leading-relaxed text-text-muted">
                <summary className="cursor-pointer font-bold text-text-main">
                  Google-ээр нэвтрэхэд өөр апп руу очиж байна уу?
                </summary>
                <p className="mt-2">
                  Supabase → Authentication → URL Configuration → <b>Redirect URLs</b> дээр доорх хаяг
                  бүртгэгдсэн байх ёстой. Бүртгэгдээгүй бол Supabase нь Site URL (Zity Chef) руу буцаадаг.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-lg bg-surface px-2 py-1.5 font-mono text-[11px] text-text-main">
                    {redirectUrl}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyRedirect}
                    className="zity-btn-secondary shrink-0 px-3 py-2.5 text-[10px]"
                  >
                    <Copy className="h-3 w-3" /> Хуулах
                  </button>
                </div>
              </details>
            )}

            {/* Тохиргооны заавар — зөвхөн Supabase тохируулаагүй үед хэрэгтэй */}
            {!isConfigured && (
              <div className="rounded-2xl border border-border bg-surface-hover p-3 text-[11px] leading-relaxed text-text-muted">
                <div className="mb-1.5 flex items-center gap-1.5 font-extrabold text-text-main">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" /> Тохиргооны заавар
                </div>
                <ol className="list-inside list-decimal space-y-1">
                  <li>
                    <span className="font-mono">.env</span> дээр{' '}
                    <span className="font-mono">VITE_SUPABASE_URL</span>,{' '}
                    <span className="font-mono">VITE_SUPABASE_ANON_KEY</span> нэмнэ.
                  </li>
                  <li>
                    Supabase → Authentication → URL Configuration дээр{' '}
                    <span className="font-mono">{`${window.location.origin}/login`}</span> redirect URL-г нэмнэ.
                  </li>
                  <li>Google provider дээр Google Console callback-аа холбоно.</li>
                </ol>
                <p className="mt-2 flex items-start gap-1.5 text-text-subtle">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Service role key, DB password, Google client secret зэргийг frontend-д ХЭЗЭЭ Ч оруулахгүй.
                </p>
              </div>
            )}
          </div>
        </section>
      </AppShell>
  );
}

interface FieldProps {
  id: string;
  label: string;
  icon: typeof Mail;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  autoComplete?: string;
  inputMode?: 'text' | 'numeric' | 'email' | 'tel';
  trailing?: React.ReactNode;
}

function Field({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  autoComplete,
  inputMode,
  trailing,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[11px] font-bold text-text-muted">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`zity-input pl-9 ${trailing ? 'pr-10' : ''}`}
        />
        {trailing && <div className="absolute right-3 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-[11px] font-semibold text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
