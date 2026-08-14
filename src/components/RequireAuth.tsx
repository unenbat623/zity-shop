import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { AppShell } from './AppShell';

interface RequireAuthProps {
  children: ReactNode;
  /** Admin эрх шаардах эсэх */
  adminOnly?: boolean;
}

/**
 * Нэвтрэлт шаардсан хуудсуудын хамгаалалт.
 * Нэвтрээгүй бол /login руу шилжүүлж, буцаж ирэх хаягийг санана.
 */
export function RequireAuth({ children, adminOnly = false }: RequireAuthProps) {
  const location = useLocation();
  const status = useAuthStore((state) => state.status);
  const account = useAuthStore((state) => state.account);
  const isAdmin = useAuthStore((state) => state.isAdmin());

  // Session сэргээж дуустал шийдвэр гаргахгүй — эс бөгөөс сая нэвтэрсэн
  // хэрэглэгчийг буруугаар login руу шидэх эрсдэлтэй
  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-xs font-bold text-text-muted">Нэвтрэлт шалгаж байна...</p>
        </div>
      </div>
    );
  }

  if (!account) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && !isAdmin) {
    return (
      <AppShell showSearch={false} title="Хандах эрх" maxWidth="md">
        <div className="zity-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10">
            <ShieldAlert className="h-7 w-7 text-amber-500" />
          </div>
          <h1 className="mb-2 text-base font-extrabold text-text-main">Хандах эрх хүрэлцэхгүй</h1>
          <p className="text-xs leading-relaxed text-text-muted">
            Admin dashboard руу зөвхөн эрх олгогдсон хэрэглэгч нэвтэрнэ. Хэрэв танд эрх хэрэгтэй бол
            <span className="font-mono font-bold text-text-main"> VITE_ADMIN_EMAILS </span>
            жагсаалтад {account.email} хаягийг нэмнэ үү.
          </p>
        </div>
      </AppShell>
    );
  }

  return <>{children}</>;
}
