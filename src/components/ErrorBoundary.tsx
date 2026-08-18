import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

import { IS_DEV } from '../lib/env';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Аппыг цагаан дэлгэц болохоос хамгаална.
 *
 * React дээр render дундуур гарсан алдаа нь бүх модыг (tree) салгаж хаядаг —
 * хамгаалалтгүй бол хэрэглэгч зүгээр хоосон дэлгэц хараад юу болсныг мэдэхгүй,
 * буцаад орох ч арга байхгүй. Энд алдааг барьж, дахин ачаалах гарц өгнө.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Production дээр энд алдаа хянах систем рүү (Sentry гэх мэт) илгээнэ.
    // Одоохондоо консолд бичнэ — чимээгүй алга болохоос сэргийлнэ.
    console.error('[Zity] Аппад алдаа гарлаа:', error, info.componentStack);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleGoHome = (): void => {
    window.location.assign('/');
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <div className="zity-card w-full max-w-md p-6 text-center sm:p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
            <AlertOctagon className="h-7 w-7 text-red-500" />
          </div>

          <h1 className="mb-2 text-lg font-extrabold text-text-main">Уучлаарай, алдаа гарлаа</h1>
          <p className="mb-6 text-xs leading-relaxed text-text-muted">
            Хуудсыг дахин ачаалахад ихэвчлэн засагддаг. Давтагдвал бидэнтэй холбогдоно уу.
          </p>

          {IS_DEV && (
            <pre className="mb-5 max-h-40 overflow-auto rounded-2xl border border-border bg-surface-hover p-3 text-left font-mono text-[10px] leading-relaxed text-text-muted">
              {error.message}
            </pre>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button onClick={this.handleReload} className="zity-btn-primary flex-1 py-3 text-xs">
              <RefreshCw className="h-4 w-4" /> Дахин ачаалах
            </button>
            <button onClick={this.handleGoHome} className="zity-btn-secondary flex-1 py-3 text-xs">
              Нүүр хуудас руу
            </button>
          </div>
        </div>
      </div>
    );
  }
}
