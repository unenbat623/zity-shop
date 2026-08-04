import React, { useState } from 'react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { useOdooStore } from '../store/useOdooStore';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Server,
  ShieldCheck,
  Settings,
  Link,
  Package,
  BarChart3,
  ArrowUpRight,
} from 'lucide-react';

export function OdooAdminScreen() {
  const { config, logs, isSyncing, testConnection, triggerSync, updateConfig } = useOdooStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editUrl, setEditUrl] = useState(config.url);
  const [editDb, setEditDb] = useState(config.db);
  const [editApiKey, setEditApiKey] = useState(config.apiKey);
  const [editUsername, setEditUsername] = useState(config.username);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setTestResult(null);
    const success = await testConnection();
    setTestResult(success ? '✅ Odoo ERP-тэй амжилттай холбогдлоо!' : '❌ Холболт амжилтгүй болсон. Тохиргоогоо шалгана уу.');
  };

  const handleSave = async () => {
    await updateConfig({
      url: editUrl,
      db: editDb,
      apiKey: editApiKey,
      username: editUsername,
    });
    setIsEditing(false);
  };

  const statusIcon = (status: 'success' | 'warning' | 'error') => {
    if (status === 'success') return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
    if (status === 'warning') return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
    return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
  };

  return (
    <div className="min-h-screen bg-background pb-28 text-text-main">
      <Header />

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-extrabold text-text-main flex items-center gap-2">
              <Database className="h-5 w-5 text-emerald-500" /> Odoo ERP Удирдлагын Төв
            </h1>
            <p className="text-xs text-text-muted">Zity Delguur ↔ Odoo Бараа, Захиалга, Нөөц Синк</p>
          </div>
        </div>

        {/* Connection Status Card */}
        <div className="rounded-3xl bg-surface border border-border shadow-xs overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-emerald-900/80 to-teal-900/80 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-extrabold text-white">Odoo ERP Сервер</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className={`h-2 w-2 rounded-full ${config.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span className={`font-bold ${config.isConnected ? 'text-emerald-300' : 'text-red-300'}`}>
                {config.isConnected ? 'ОНЛАЙН' : 'ОФЛАЙН'}
              </span>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Сервер URL', value: config.url, icon: Link },
                { label: 'Датабэйс', value: config.db, icon: Database },
                { label: 'Хэрэглэгч', value: config.username, icon: ShieldCheck },
                {
                  label: 'Сүүлийн синк',
                  value: config.lastSyncTime
                    ? new Date(config.lastSyncTime).toLocaleTimeString('mn-MN')
                    : '—',
                  icon: RefreshCw,
                },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-2xl bg-surface-hover p-2.5 border border-border">
                  <div className="flex items-center gap-1 mb-1">
                    <Icon className="h-3 w-3 text-emerald-500" />
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">{label}</span>
                  </div>
                  <p className="font-mono text-[11px] font-bold text-text-main truncate">{value}</p>
                </div>
              ))}
            </div>

            {testResult && (
              <div
                className={`rounded-2xl px-3 py-2 text-xs font-bold border ${
                  testResult.includes('✅')
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : 'bg-red-500/10 text-red-600 border-red-500/20'
                }`}
              >
                {testResult}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleTestConnection}
                disabled={isSyncing}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-surface-hover py-2.5 text-[11px] font-bold text-text-main border border-border hover:bg-border active:scale-95 transition-all disabled:opacity-50"
              >
                <Activity className="h-3.5 w-3.5 text-emerald-500" /> Тест
              </button>
              <button
                onClick={triggerSync}
                disabled={isSyncing}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 py-2.5 text-[11px] font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Синк хийж байна...' : 'Синк'}
              </button>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-surface-hover py-2.5 text-[11px] font-bold text-text-main border border-border hover:bg-border active:scale-95 transition-all"
              >
                <Settings className="h-3.5 w-3.5 text-text-muted" /> Тохиргоо
              </button>
            </div>
          </div>
        </div>

        {/* Configuration Edit Panel */}
        {isEditing && (
          <div className="rounded-3xl bg-surface border border-amber-500/30 shadow-xs p-4 space-y-3">
            <h3 className="text-xs font-extrabold text-text-main flex items-center gap-2">
              <Settings className="h-4 w-4 text-amber-500" /> Odoo ERP Тохиргоо Засах
            </h3>

            {[
              { label: 'Odoo URL', value: editUrl, setter: setEditUrl, placeholder: 'https://odoo.company.mn' },
              { label: 'Датабэйс нэр', value: editDb, setter: setEditDb, placeholder: 'zity_prod_db' },
              { label: 'Admin Хэрэглэгч (email)', value: editUsername, setter: setEditUsername, placeholder: 'admin@company.mn' },
              { label: 'API Key', value: editApiKey, setter: setEditApiKey, placeholder: 'odoo_api_key_xxxxx', isSecret: true },
            ].map(({ label, value, setter, placeholder, isSecret }) => (
              <div key={label}>
                <label className="text-[10px] font-bold text-text-muted block mb-1">{label}</label>
                <input
                  type={isSecret ? 'password' : 'text'}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  placeholder={placeholder}
                  className="w-full rounded-xl border border-border bg-surface-hover px-3 py-2 text-xs font-mono font-medium text-text-main outline-none focus:border-emerald-500"
                />
              </div>
            ))}

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                className="flex-1 rounded-2xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
              >
                Хадгалах
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 rounded-2xl bg-surface-hover py-2.5 text-xs font-bold text-text-main border border-border hover:bg-border"
              >
                Цуцлах
              </button>
            </div>
          </div>
        )}

        {/* Odoo Module Overview */}
        <div className="rounded-3xl bg-surface border border-border shadow-xs p-4">
          <h3 className="text-xs font-extrabold text-text-main mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-500" /> Холбогдсон Odoo Модулиуд
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { module: 'sale.order', desc: 'Захиалга үүсгэх', active: true, icon: '🛒' },
              { module: 'product.product', desc: 'Бараа татах / шинэчлэх', active: true, icon: '📦' },
              { module: 'stock.quant', desc: 'Нөөцийн мэдээлэл', active: true, icon: '🏭' },
              { module: 'res.partner', desc: 'Харилцагч бүртгэл', active: true, icon: '👤' },
              { module: 'account.move', desc: 'Нэхэмжлэл (Нэвтрэлт хүлээж байна)', active: false, icon: '📄' },
              { module: 'delivery.carrier', desc: 'Хүргэлтийн бодлого', active: false, icon: '🚚' },
            ].map(({ module, desc, active, icon }) => (
              <div
                key={module}
                className={`flex items-start gap-2 rounded-2xl p-2.5 border ${
                  active ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-surface-hover border-border opacity-60'
                }`}
              >
                <span className="text-lg">{icon}</span>
                <div>
                  <p className="font-mono text-[10px] font-bold text-text-main">{module}</p>
                  <p className="text-[10px] text-text-muted">{desc}</p>
                  <span
                    className={`text-[9px] font-extrabold ${active ? 'text-emerald-500' : 'text-text-muted'}`}
                  >
                    {active ? '● Идэвхтэй' : '○ Тохируулах шаардлагатай'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Sync Logs */}
        <div className="rounded-3xl bg-surface border border-border shadow-xs p-4">
          <h3 className="text-xs font-extrabold text-text-main mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" /> Синхрончлолын Түүхүүд
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">Синхрончлол бүртгэл байхгүй байна.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex gap-2.5 rounded-2xl bg-surface-hover p-3 border border-border">
                  <div className="mt-0.5">{statusIcon(log.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[11px] font-bold text-text-main truncate">{log.action}</p>
                      <span className="text-[10px] text-text-muted font-mono shrink-0">{log.timestamp}</span>
                    </div>
                    <p className="text-[10px] text-text-muted">{log.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
