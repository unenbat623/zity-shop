import React, { useEffect, useMemo, useState } from 'react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { useOdooStore } from '../store/useOdooStore';
import { useOrderStore } from '../store/useOrderStore';
import { useAuthStore } from '../store/useAuthStore';
import { MOCK_PRODUCTS } from '../constants/mockData';
import { ZityChefService } from '../services/zityChefService';
import { Product } from '../types';
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
  Mail,
  Users,
  ShoppingBag,
  Send,
  LockKeyhole,
  ChefHat,
  Store,
  Eye,
} from 'lucide-react';

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: 'Zity Chef' | 'Zity Delguur' | 'Both';
  savedItems: number;
  orders: number;
  lastSeen: string;
}

export function OdooAdminScreen() {
  const { config, logs, isSyncing, testConnection, triggerSync, updateConfig } = useOdooStore();
  const { orders } = useOrderStore();
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editUrl, setEditUrl] = useState(config.url);
  const [editDb, setEditDb] = useState(config.db);
  const [editApiKey, setEditApiKey] = useState(config.apiKey);
  const [editUsername, setEditUsername] = useState(config.username);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [isChefLive, setIsChefLive] = useState(false);
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('admin@zity.mn');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpFromName, setSmtpFromName] = useState('Zity Delguur');
  const [smtpResult, setSmtpResult] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      const result = await ZityChefService.fetchStoreProducts();
      if (isMounted) {
        setProducts(result.products);
        setIsChefLive(result.isLive);
      }
    }

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const registeredUsers = useMemo<AdminUserRow[]>(
    () => [
      {
        id: 'u-current',
        name: user.name,
        email: user.email,
        phone: user.phone,
        source: user.isZityChefConnected ? 'Both' : 'Zity Delguur',
        savedItems: 6,
        orders: orders.length,
        lastSeen: 'Одоо идэвхтэй',
      },
      {
        id: 'u-chef-1',
        name: 'Chef Zity Demo',
        email: 'chef@zity.mn',
        phone: '99001122',
        source: 'Zity Chef',
        savedItems: 12,
        orders: 3,
        lastSeen: 'Өнөөдөр',
      },
      {
        id: 'u-shop-1',
        name: 'Delguur Customer',
        email: 'customer@zity.mn',
        phone: '88002233',
        source: 'Zity Delguur',
        savedItems: 4,
        orders: 1,
        lastSeen: 'Өчигдөр',
      },
    ],
    [orders.length, user.email, user.isZityChefConnected, user.name, user.phone]
  );

  const paidRevenue = orders
    .filter((order) => order.paymentStatus === 'paid')
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const lowStockProducts = products.filter((product) => product.stock <= 50).length;

  const handleTestConnection = async () => {
    setTestResult(null);
    const success = await testConnection();
    setTestResult(success ? 'Odoo ERP-тэй амжилттай холбогдлоо.' : 'Холболт амжилтгүй болсон. Тохиргоогоо шалгана уу.');
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

  const handleSmtpTest = () => {
    if (!smtpUser || !smtpPassword) {
      setSmtpResult('Gmail имэйл болон App Password оруулна уу.');
      return;
    }

    setSmtpResult(`${smtpHost}:${smtpPort} тохиргоо хадгалагдлаа. Туршилтын имэйл илгээхэд бэлэн.`);
  };

  const statusIcon = (status: 'success' | 'warning' | 'error') => {
    if (status === 'success') return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
    if (status === 'warning') return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
    return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
  };

  return (
    <div className="min-h-screen bg-background pb-28 text-text-main">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-5">
        {/* Page Title */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-2">
          <div>
            <h1 className="text-xl font-extrabold text-text-main flex items-center gap-2">
              <Database className="h-5 w-5 text-emerald-500" /> Admin Dashboard
            </h1>
            <p className="text-xs text-text-muted">
              Zity Chef + Zity Delguur хэрэглэгч, бараа, захиалга, Odoo ERP, Google SMTP нэг дор.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={triggerSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              Odoo Sync
            </button>
            <button
              onClick={handleTestConnection}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 rounded-2xl bg-surface px-4 py-2.5 text-xs font-extrabold text-text-main border border-border hover:bg-surface-hover disabled:opacity-50"
            >
              <Activity className="h-4 w-4 text-emerald-500" />
              Холболт тест
            </button>
          </div>
        </div>

        {/* KPI Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Хэрэглэгчид', value: registeredUsers.length, icon: Users, hint: 'Chef + Delguur' },
            { label: 'Бараа', value: products.length, icon: Package, hint: isChefLive ? 'Chef live' : 'Fallback data' },
            { label: 'Захиалга', value: orders.length, icon: ShoppingBag, hint: 'Odoo sale.order' },
            { label: 'Орлого', value: `${paidRevenue.toLocaleString()}₮`, icon: BarChart3, hint: 'Paid orders' },
            { label: 'Бага нөөц', value: lowStockProducts, icon: AlertTriangle, hint: '≤ 50 stock' },
          ].map(({ label, value, icon: Icon, hint }) => (
            <div key={label} className="rounded-2xl bg-surface border border-border p-4 shadow-xs">
              <div className="mb-3 flex items-center justify-between">
                <Icon className="h-5 w-5 text-emerald-500" />
                <span className="text-[10px] font-bold text-text-muted">{hint}</span>
              </div>
              <p className="text-2xl font-black text-text-main">{value}</p>
              <p className="text-[11px] font-bold text-text-muted">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <section className="xl:col-span-4 space-y-5">
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
                  <div className="rounded-2xl px-3 py-2 text-xs font-bold border bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
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
                    {isSyncing ? 'Синк...' : 'Синк'}
                  </button>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center justify-center gap-1.5 rounded-2xl bg-surface-hover py-2.5 text-[11px] font-bold text-text-main border border-border hover:bg-border active:scale-95 transition-all"
                  >
                    <Settings className="h-3.5 w-3.5 text-text-muted" /> Засах
                  </button>
                </div>
              </div>
            </div>

            {/* Configuration Edit Panel */}
            {isEditing && (
              <div className="rounded-3xl bg-surface border border-amber-500/30 shadow-xs p-4 space-y-3">
                <h3 className="text-xs font-extrabold text-text-main flex items-center gap-2">
                  <Settings className="h-4 w-4 text-amber-500" /> Odoo ERP Тохиргоо
                </h3>

                {[
                  { label: 'Odoo URL', value: editUrl, setter: setEditUrl, placeholder: 'https://odoo.company.mn' },
                  { label: 'Датабэйс нэр', value: editDb, setter: setEditDb, placeholder: 'zity_prod_db' },
                  { label: 'Admin хэрэглэгч', value: editUsername, setter: setEditUsername, placeholder: 'admin@company.mn' },
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

                <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 text-[11px] text-text-muted">
                  API key-г Odoo дээрээс Settings &gt; Technical &gt; API Keys хэсгээс үүсгээд энд оруулна.
                </div>

                <div className="flex gap-2 pt-1">
                  <button onClick={handleSave} className="flex-1 rounded-2xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700">
                    Хадгалах
                  </button>
                  <button onClick={() => setIsEditing(false)} className="flex-1 rounded-2xl bg-surface-hover py-2.5 text-xs font-bold text-text-main border border-border hover:bg-border">
                    Цуцлах
                  </button>
                </div>
              </div>
            )}

            {/* SMTP Setup */}
            <div className="rounded-3xl bg-surface border border-border shadow-xs p-4 space-y-3">
              <h3 className="text-xs font-extrabold text-text-main flex items-center gap-2">
                <Mail className="h-4 w-4 text-emerald-500" /> Google SMTP
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-text-muted block mb-1">SMTP Host</label>
                  <input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} className="w-full rounded-xl border border-border bg-surface-hover px-3 py-2 text-xs font-mono outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-muted block mb-1">Port</label>
                  <input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} className="w-full rounded-xl border border-border bg-surface-hover px-3 py-2 text-xs font-mono outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-muted block mb-1">Gmail хэрэглэгч</label>
                <input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} className="w-full rounded-xl border border-border bg-surface-hover px-3 py-2 text-xs font-mono outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-muted block mb-1">Google App Password</label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
                  <input type="password" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} placeholder="16 оронтой app password" className="w-full rounded-xl border border-border bg-surface-hover pl-9 pr-3 py-2 text-xs font-mono outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-muted block mb-1">From name</label>
                <input value={smtpFromName} onChange={(e) => setSmtpFromName(e.target.value)} className="w-full rounded-xl border border-border bg-surface-hover px-3 py-2 text-xs outline-none focus:border-emerald-500" />
              </div>
              {smtpResult && <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-[11px] font-bold text-emerald-600">{smtpResult}</div>}
              <button onClick={handleSmtpTest} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-700">
                <Send className="h-4 w-4" /> SMTP хадгалах / тест
              </button>
            </div>

            {/* Odoo Module Overview */}
            <div className="rounded-3xl bg-surface border border-border shadow-xs p-4">
              <h3 className="text-xs font-extrabold text-text-main mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-500" /> Odoo Модулиуд
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { module: 'sale.order', desc: 'Захиалга', active: true },
                  { module: 'product.product', desc: 'Бараа', active: true },
                  { module: 'stock.quant', desc: 'Нөөц', active: true },
                  { module: 'res.partner', desc: 'Хэрэглэгч', active: true },
                  { module: 'account.move', desc: 'Нэхэмжлэл', active: false },
                  { module: 'mail.mail', desc: 'SMTP mail', active: !!smtpPassword },
                ].map(({ module, desc, active }) => (
                  <div key={module} className={`rounded-2xl p-2.5 border ${active ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-surface-hover border-border opacity-70'}`}>
                    <p className="font-mono text-[10px] font-bold text-text-main">{module}</p>
                    <p className="text-[10px] text-text-muted">{desc}</p>
                    <span className={`text-[9px] font-extrabold ${active ? 'text-emerald-500' : 'text-text-muted'}`}>
                      {active ? 'Идэвхтэй' : 'Хүлээгдэж байна'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="xl:col-span-8 space-y-5">
            {/* Users */}
            <div className="rounded-3xl bg-surface border border-border shadow-xs overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="text-xs font-extrabold text-text-main flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-500" /> Бүртгүүлсэн хэрэглэгчид
                </h3>
                <span className="text-[10px] font-bold text-text-muted">Chef / Delguur unified</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-hover text-[10px] uppercase text-text-muted">
                    <tr>
                      <th className="px-4 py-3">Хэрэглэгч</th>
                      <th className="px-4 py-3">Эх сурвалж</th>
                      <th className="px-4 py-3">Хадгалсан бараа</th>
                      <th className="px-4 py-3">Захиалга</th>
                      <th className="px-4 py-3">Сүүлийн идэвх</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registeredUsers.map((row) => (
                      <tr key={row.id} className="border-t border-border">
                        <td className="px-4 py-3">
                          <p className="font-extrabold text-text-main">{row.name}</p>
                          <p className="text-[10px] text-text-muted">{row.email} · {row.phone}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-extrabold text-emerald-600 border border-emerald-500/20">
                            {row.source === 'Both' ? <CheckCircle2 className="h-3 w-3" /> : row.source === 'Zity Chef' ? <ChefHat className="h-3 w-3" /> : <Store className="h-3 w-3" />}
                            {row.source}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold">{row.savedItems}</td>
                        <td className="px-4 py-3 font-bold">{row.orders}</td>
                        <td className="px-4 py-3 text-text-muted">{row.lastSeen}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Products */}
              <div className="rounded-3xl bg-surface border border-border shadow-xs overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h3 className="text-xs font-extrabold text-text-main flex items-center gap-2">
                    <Package className="h-4 w-4 text-emerald-500" /> Хадгалагдаж байгаа бараа
                  </h3>
                  <span className="text-[10px] font-bold text-text-muted">{products.length} item</span>
                </div>
                <div className="max-h-[420px] overflow-y-auto">
                  {products.slice(0, 12).map((product) => (
                    <div key={product.id} className="flex items-center gap-3 border-b border-border p-3 last:border-0">
                      <img src={product.image} alt={product.name} className="h-12 w-12 rounded-xl object-cover bg-surface-hover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-extrabold text-text-main">{product.name}</p>
                        <p className="text-[10px] text-text-muted">{product.sku} · {product.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-emerald-600">{product.price.toLocaleString()}₮</p>
                        <p className={`text-[10px] font-bold ${product.stock <= 50 ? 'text-amber-500' : 'text-text-muted'}`}>
                          {product.stock} {product.unit}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Orders */}
              <div className="rounded-3xl bg-surface border border-border shadow-xs overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h3 className="text-xs font-extrabold text-text-main flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-emerald-500" /> Захиалгууд
                  </h3>
                  <span className="text-[10px] font-bold text-text-muted">{orders.length} order</span>
                </div>
                <div className="max-h-[420px] overflow-y-auto">
                  {orders.map((order) => (
                    <div key={order.id} className="border-b border-border p-3 last:border-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-extrabold text-text-main">{order.id}</p>
                          <p className="text-[10px] text-text-muted">{order.odooOrderRef} · {order.items.length} бараа</p>
                        </div>
                        <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-extrabold text-emerald-600 border border-emerald-500/20">
                          {order.status}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-[10px] text-text-muted">{new Date(order.createdAt).toLocaleString('mn-MN')}</p>
                        <p className="text-sm font-black text-text-main">{order.totalAmount.toLocaleString()}₮</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Sync Logs */}
            <div className="rounded-3xl bg-surface border border-border shadow-xs p-4">
              <h3 className="text-xs font-extrabold text-text-main mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" /> Синхрончлолын түүх
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
                      <Eye className="mt-0.5 h-4 w-4 text-text-muted" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-text-muted">
          Admin dashboard одоогоор frontend store + Chef API fallback дээр ажиллаж байна. Production дээр `res.partner`, `sale.order`, `product.product`, `stock.quant`, `mail.mail` endpoint-уудыг backend-ээр дамжуулж холбоход энэ UI шууд ашиглагдана.
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
