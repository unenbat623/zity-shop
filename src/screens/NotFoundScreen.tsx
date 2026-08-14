import { useNavigate } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { AppShell } from '../components/AppShell';

export function NotFoundScreen() {
  const navigate = useNavigate();

  return (
    <AppShell showSearch={false} maxWidth="md">
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-border bg-surface">
          <Compass className="h-9 w-9 text-emerald-500" />
        </div>
        <h1 className="mb-2 text-2xl font-black text-text-main">Хуудас олдсонгүй</h1>
        <p className="mb-6 max-w-xs text-xs leading-relaxed text-text-muted">
          Таны хайж буй хуудас байхгүй эсвэл хаяг нь өөрчлөгдсөн байна.
        </p>
        <button onClick={() => navigate('/')} className="zity-btn-primary px-6 py-3 text-xs">
          <Home className="h-4 w-4" /> Нүүр хуудас руу
        </button>
      </div>
    </AppShell>
  );
}
