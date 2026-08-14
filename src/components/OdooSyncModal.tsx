import { Activity, CheckCircle2, ChefHat, Database, Loader2, RefreshCw, Server, WifiOff } from 'lucide-react';

import { Modal } from './ui/Modal';
import { useOdooStore } from '../store/useOdooStore';
import { useCatalogStore } from '../store/useCatalogStore';
import { formatTime } from '../lib/format';
import { env } from '../lib/env';

/** Zity Chef + Odoo холболтын төлөв харуулах цонх */
export function OdooSyncModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { config, logs, mode, isSyncing, isTesting, testConnection, triggerSync } = useOdooStore();
  const connection = useCatalogStore((state) => state.connection);

  const isChefLive = connection.status === 'live';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Интеграцийн төв"
      description="Zity Chef ↔ Delguur ↔ Odoo ERP"
      icon={<Database className="h-5 w-5" />}
      size="lg"
      footer={
        <div className="flex justify-end">
          <button onClick={onClose} className="zity-btn-secondary px-5 py-2 text-xs">
            Хаах
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        {/* Zity Chef */}
        <section className="rounded-2xl border border-border bg-surface-hover p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <ChefHat className="h-4 w-4 shrink-0 text-emerald-500" />
              <span className="text-xs font-semibold text-text-main">Zity Chef API</span>
            </span>
            <span
              className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                isChefLive
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                  : 'border-amber-500/20 bg-amber-500/10 text-amber-600'
              }`}
            >
              {isChefLive ? <CheckCircle2 className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isChefLive ? 'Холбогдсон' : 'Локал горим'}
            </span>
          </div>
          <p className="truncate font-mono text-[11px] text-text-muted">{env.chefApiUrl}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-text-muted">{connection.message}</p>
        </section>

        {/* Odoo */}
        <section className="rounded-2xl border border-border bg-surface-hover p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <Server className="h-4 w-4 shrink-0 text-emerald-500" />
              <span className="text-xs font-semibold text-text-main">Odoo ERP</span>
            </span>
            <span
              className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                mode === 'bridge'
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                  : 'border-amber-500/20 bg-amber-500/10 text-amber-600'
              }`}
            >
              {mode === 'bridge' ? 'Bridge' : 'Симуляц'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl border border-border bg-surface p-2.5">
              <span className="block text-[10px] text-text-muted">Датабэйс</span>
              <span className="font-mono font-semibold text-text-main">{config.db}</span>
            </div>
            <div className="rounded-xl border border-border bg-surface p-2.5">
              <span className="block text-[10px] text-text-muted">Сүүлийн синк</span>
              <span className="font-mono font-semibold text-text-main">
                {formatTime(config.lastSyncTime)}
              </span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => void triggerSync()}
            disabled={isSyncing}
            className="zity-btn-primary py-3 text-xs"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Бараа синк
          </button>
          <button
            onClick={() => void testConnection()}
            disabled={isTesting}
            className="zity-btn-secondary py-3 text-xs"
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
            ) : (
              <Activity className="h-4 w-4 text-emerald-500" />
            )}
            Холболт тест
          </button>
        </div>

        {logs.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-bold text-text-main">Сүүлийн үйлдлүүд</h3>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {logs.slice(0, 8).map((log) => (
                <div key={log.id} className="rounded-xl border border-border bg-surface-hover p-3 text-xs">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="truncate font-bold text-text-main">{log.action}</span>
                    <span className="shrink-0 font-mono text-[10px] text-text-muted">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-text-muted">{log.message}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </Modal>
  );
}
