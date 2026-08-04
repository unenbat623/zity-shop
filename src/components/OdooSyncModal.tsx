import React from 'react';
import { X, Database, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, Server, Activity } from 'lucide-react';
import { useOdooStore } from '../store/useOdooStore';

export function OdooSyncModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { config, logs, isSyncing, testConnection, triggerSync } = useOdooStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-surface p-6 shadow-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                Odoo ERP Холболтын Төв
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </h2>
              <p className="text-xs text-text-muted">Zity Delguur app ↔ Odoo Sales & Inventory Sync</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-hover text-text-muted hover:text-text-main"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Connection Status Card */}
          <div className="rounded-2xl bg-surface-hover p-4 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-semibold text-text-main">Odoo Сервер:</span>
                <span className="text-xs text-text-muted font-mono">{config.url}</span>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Идэвхтэй
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-surface p-2.5 rounded-xl border border-border">
                <span className="text-text-muted block text-[10px]">Датабэйс</span>
                <span className="font-semibold text-text-main font-mono">{config.db}</span>
              </div>
              <div className="bg-surface p-2.5 rounded-xl border border-border">
                <span className="text-text-muted block text-[10px]">Сүүлчийн синк</span>
                <span className="font-semibold text-text-main font-mono">
                  {config.lastSyncTime ? new Date(config.lastSyncTime).toLocaleTimeString('mn-MN') : 'Холбогдоогүй'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Trigger Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={triggerSync}
              disabled={isSyncing}
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs font-bold text-white transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50 shadow-md shadow-emerald-600/20"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              Бараа, Нөөц Синхрончлох
            </button>
            <button
              onClick={testConnection}
              disabled={isSyncing}
              className="flex items-center justify-center gap-2 rounded-2xl bg-surface-hover py-3 text-xs font-bold text-text-main transition-all hover:bg-border border border-border active:scale-95 disabled:opacity-50"
            >
              <Activity className="h-4 w-4 text-emerald-500" />
              Холболт Тэстлэх
            </button>
          </div>

          {/* Live Sync Logs */}
          <div>
            <h3 className="text-xs font-bold text-text-main mb-2 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Синк хийсэн түүхүүд
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="rounded-xl bg-surface p-3 border border-border text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-text-main">{log.action}</span>
                    <span className="text-[10px] text-text-muted font-mono">{log.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-text-muted">{log.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-surface-hover px-5 py-2 text-xs font-bold text-text-main hover:bg-border transition-colors border border-border"
          >
            Хаах
          </button>
        </div>
      </div>
    </div>
  );
}
