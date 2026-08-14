import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChefHat,
  Database,
  Info,
  Link as LinkIcon,
  Loader2,
  Lock,
  Mail,
  Package,
  RefreshCw,
  Server,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
  XCircle,
} from 'lucide-react';

import { AppShell } from '../components/AppShell';
import { useOdooStore } from '../store/useOdooStore';
import { useOrderStore } from '../store/useOrderStore';
import { useAuthStore, useUserProfile } from '../store/useAuthStore';
import { useCatalogStore } from '../store/useCatalogStore';
import { useToastStore } from '../store/useToastStore';
import { ChefDashboard, ZityChefService } from '../services/zityChefService';
import { AdminUserRow, OdooSyncLog } from '../types';
import { formatMnt, formatNumber, formatTime } from '../lib/format';
import { env, isAdminRestrictionConfigured } from '../lib/env';

/** Нөөц энэ хэмжээнээс доош орвол анхааруулна */
const LOW_STOCK_THRESHOLD = 20;

export function OdooAdminScreen() {
  const showToast = useToastStore((state) => state.show);

  const { config, logs, mode, isSyncing, isTesting, lastResult, testConnection, triggerSync, updateConfig } =
    useOdooStore();
  const orders = useOrderStore((state) => state.orders);
  const account = useAuthStore((state) => state.account);
  const profile = useUserProfile();

  const { products, connection, isLoadingProducts, loadProducts } = useCatalogStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editUrl, setEditUrl] = useState(config.url);
  const [editDb, setEditDb] = useState(config.db);
  const [editUsername, setEditUsername] = useState(config.username);

  const [dashboard, setDashboard] = useState<ChefDashboard | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  // Chef backend-ийн нэгдсэн dashboard (хэрэглэгч, захиалга, орлого)
  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      setIsLoadingDashboard(true);
      const result = await ZityChefService.fetchDashboard(controller.signal);
      if (controller.signal.aborted) return;

      setDashboard(result.data);
      setDashboardError(
        result.isLive
          ? result.data.adminEnabled
            ? null
            : result.data.message || 'Chef backend дээр admin эрх аваагүй байна.'
          : result.error
      );
      setIsLoadingDashboard(false);
    }

    void loadDashboard();
    return () => controller.abort();
  }, []);

  /** Chef backend-ийн хэрэглэгчид + одоо нэвтэрсэн Delguur хэрэглэгч */
  const users = useMemo<AdminUserRow[]>(() => {
    const chefUsers = dashboard?.users ?? [];
    if (!account) return chefUsers;

    const currentUserOrders = orders.filter((order) => order.userId === account.id).length;
    const currentRow: AdminUserRow = {
      id: account.id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone || '—',
      source: chefUsers.some((user) => user.email === profile.email) ? 'Both' : 'Zity Delguur',
      savedItems: profile.addresses.length,
      orders: currentUserOrders,
      lastSeen: 'Одоо идэвхтэй',
    };

    return [currentRow, ...chefUsers.filter((user) => user.email !== profile.email)];
  }, [account, dashboard, orders, profile]);

  const localRevenue = orders
    .filter((order) => order.paymentStatus === 'paid')
    .reduce((sum, order) => sum + order.totalAmount, 0);

  // Chef backend live байвал түүний бодит тоог, эс бөгөөс локал тоог харуулна
  const isChefDashboardLive = dashboard?.adminEnabled === true;
  const totalUsers = isChefDashboardLive ? dashboard.stats.customers : users.length;
  const totalOrders = isChefDashboardLive ? dashboard.stats.orders : orders.length;
  const paidRevenue = isChefDashboardLive ? dashboard.stats.revenue : localRevenue;

  const lowStockCount = products.filter((product) => product.stock <= LOW_STOCK_THRESHOLD).length;
  const failedSyncCount = orders.filter(
    (order) => order.odooSync.status === 'failed' || order.chefSync.status === 'failed'
  ).length;

  const handleTestConnection = async () => {
    const success = await testConnection();
    showToast(
      success ? 'Odoo bridge холбогдлоо.' : 'Odoo bridge олдсонгүй — симуляц горимд ажиллана.',
      success ? 'success' : 'warning'
    );
  };

  const handleSync = async () => {
    await triggerSync();
    showToast('Синхрончлол дууслаа.', 'success');
  };

  const handleSaveConfig = () => {
    if (!/^https?:\/\/.+/.test(editUrl.trim())) {
      showToast('Odoo URL нь http:// эсвэл https:// -ээр эхлэх ёстой.', 'warning');
      return;
    }
    updateConfig({ url: editUrl.trim(), db: editDb.trim(), username: editUsername.trim() });
    setIsEditing(false);
    showToast('Odoo endpoint тохиргоо шинэчлэгдлээ.', 'success');
  };

  const statusIcon = (status: OdooSyncLog['status']) => {
    if (status === 'success') return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />;
    if (status === 'warning') return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />;
    return <XCircle className="h-4 w-4 shrink-0 text-red-500" />;
  };

  return (
    <AppShell showSearch={false} title="Admin dashboard" maxWidth="xl">
      <div className="space-y-5">
        {/* Гарчиг */}
        <div className="mb-2 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-extrabold text-text-main">
              <Database className="h-5 w-5 text-emerald-500" /> Admin dashboard
            </h1>
            <p className="text-xs text-text-muted">
              Zity Chef + Zity Delguur хэрэглэгч, бараа, захиалга, Odoo ERP холболт нэг дор.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => void handleSync()} disabled={isSyncing} className="zity-btn-primary px-4 py-2.5 text-xs">
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Синк хийж байна...' : 'Синк хийх'}
            </button>
            <button
              onClick={() => void handleTestConnection()}
              disabled={isTesting}
              className="zity-btn-secondary px-4 py-2.5 text-xs"
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
              ) : (
                <Activity className="h-4 w-4 text-emerald-500" />
              )}
              Холболт тест
            </button>
          </div>
        </div>

        {/* Admin эрх хязгаарлаагүй үеийн анхааруулга */}
        {!isAdminRestrictionConfigured() && (
          <div className="flex gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] leading-relaxed text-amber-600">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <span className="font-mono font-bold">VITE_ADMIN_EMAILS</span> тохируулаагүй тул нэвтэрсэн дурын
              хэрэглэгч энэ хуудсыг үзэж чадна. Production дээр заавал admin имэйлүүдээ жагсаана уу.
            </span>
          </div>
        )}

        {/* KPI */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            {
              label: 'Хэрэглэгчид',
              value: formatNumber(totalUsers),
              icon: Users,
              hint: isChefDashboardLive ? 'Chef DB' : 'Локал',
            },
            {
              label: 'Бараа',
              value: formatNumber(products.length),
              icon: Package,
              hint: connection.status === 'live' ? 'Chef live' : 'Локал каталог',
            },
            {
              label: 'Захиалга',
              value: formatNumber(totalOrders),
              icon: ShoppingBag,
              hint: isChefDashboardLive ? `${dashboard.stats.pendingOrders} хүлээгдэж` : 'Локал',
            },
            {
              label: 'Орлого',
              value: formatMnt(paidRevenue),
              icon: BarChart3,
              hint: isChefDashboardLive ? 'Chef DB' : 'Локал',
            },
            {
              label: 'Бага нөөц',
              value: formatNumber(lowStockCount),
              icon: AlertTriangle,
              hint: `≤ ${LOW_STOCK_THRESHOLD}`,
            },
          ].map(({ label, value, icon: Icon, hint }) => (
            <div key={label} className="zity-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <Icon className="h-5 w-5 text-emerald-500" />
                <span className="text-[10px] font-bold text-text-muted">{hint}</span>
              </div>
              <p className="text-2xl font-black text-text-main">{value}</p>
              <p className="text-[11px] font-bold text-text-muted">{label}</p>
            </div>
          ))}
        </div>

        {failedSyncCount > 0 && (
          <div className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-[11px] font-bold text-red-500">
            <XCircle className="h-4 w-4 shrink-0" />
            {failedSyncCount} захиалгын синк амжилтгүй болсон байна. Захиалгын дэлгэрэнгүй хэсгээс дахин
            илгээнэ үү.
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <section className="space-y-5 xl:col-span-4">
            {/* Холболтын төлөв */}
            <div className="zity-card overflow-hidden">
              <div className="zity-brand-surface flex items-center justify-between border-b border-border px-4 py-3">
                <span className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-emerald-300" />
                  <span className="text-sm font-extrabold text-white">Odoo ERP</span>
                </span>
                <span className="flex items-center gap-1.5 text-xs">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      config.isConnected ? 'animate-pulse bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  <span className={`font-bold ${config.isConnected ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {config.isConnected ? 'BRIDGE' : 'СИМУЛЯЦ'}
                  </span>
                </span>
              </div>

              <div className="space-y-3 p-4">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: 'Сервер URL', value: config.url, icon: LinkIcon },
                    { label: 'Датабэйс', value: config.db, icon: Database },
                    { label: 'Хэрэглэгч', value: config.username, icon: ShieldCheck },
                    { label: 'Сүүлийн синк', value: formatTime(config.lastSyncTime), icon: RefreshCw },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="rounded-2xl border border-border bg-surface-hover p-2.5">
                      <div className="mb-1 flex items-center gap-1">
                        <Icon className="h-3 w-3 text-emerald-500" />
                        <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted">
                          {label}
                        </span>
                      </div>
                      <p className="truncate font-mono text-[11px] font-bold text-text-main">{value}</p>
                    </div>
                  ))}
                </div>

                {lastResult && (
                  <div
                    className={`rounded-2xl border px-3 py-2 text-xs font-bold ${
                      lastResult.ok
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                        : 'border-amber-500/20 bg-amber-500/10 text-amber-600'
                    }`}
                  >
                    {lastResult.message}
                  </div>
                )}

                {mode === 'simulated' && (
                  <div className="flex gap-2 rounded-2xl border border-border bg-surface-hover p-3 text-[11px] leading-relaxed text-text-muted">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    <span>
                      Odoo руу browser-оос шууд хандах боломжгүй (CORS + нууц түлхүүр ил гарна). Backend дээр{' '}
                      <span className="font-mono font-bold">/api/odoo/status</span>,{' '}
                      <span className="font-mono font-bold">/api/odoo/products</span>,{' '}
                      <span className="font-mono font-bold">/api/odoo/orders</span> proxy нэмэхэд энэ хэсэг
                      автоматаар live болно.
                    </span>
                  </div>
                )}

                <button
                  onClick={() => setIsEditing((prev) => !prev)}
                  className="zity-btn-secondary w-full py-2.5 text-[11px]"
                >
                  <Settings className="h-3.5 w-3.5 text-text-muted" />
                  {isEditing ? 'Засварыг хаах' : 'Endpoint засах'}
                </button>
              </div>
            </div>

            {/* Endpoint засвар */}
            {isEditing && (
              <div className="zity-card animate-in space-y-3 p-4">
                <h3 className="flex items-center gap-2 text-xs font-extrabold text-text-main">
                  <Settings className="h-4 w-4 text-emerald-500" /> Odoo endpoint тохиргоо
                </h3>

                {[
                  { label: 'Odoo URL', value: editUrl, setter: setEditUrl, placeholder: 'https://odoo.zity.mn' },
                  { label: 'Датабэйс нэр', value: editDb, setter: setEditDb, placeholder: 'zity_delguur_db' },
                  {
                    label: 'Admin хэрэглэгч',
                    value: editUsername,
                    setter: setEditUsername,
                    placeholder: 'api_admin@zity.mn',
                  },
                ].map(({ label, value, setter, placeholder }) => (
                  <div key={label}>
                    <label className="mb-1 block text-[10px] font-bold text-text-muted">{label}</label>
                    <input
                      value={value}
                      onChange={(event) => setter(event.target.value)}
                      placeholder={placeholder}
                      className="zity-input font-mono"
                    />
                  </div>
                ))}

                <div className="flex gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] leading-relaxed text-amber-600">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    Odoo API key энд оруулахгүй. Түлхүүр нь backend-ийн env дээр байх ёстой — browser-т орсон
                    түлхүүрийг хэн ч харах боломжтой.
                  </span>
                </div>

                <div className="flex gap-2">
                  <button onClick={handleSaveConfig} className="zity-btn-primary flex-1 py-2.5 text-xs">
                    Хадгалах
                  </button>
                  <button onClick={() => setIsEditing(false)} className="zity-btn-secondary flex-1 py-2.5 text-xs">
                    Цуцлах
                  </button>
                </div>
              </div>
            )}

            {/* Имэйл (SMTP) — backend-ийн хариуцлага */}
            <div className="zity-card space-y-3 p-4">
              <h3 className="flex items-center gap-2 text-xs font-extrabold text-text-main">
                <Mail className="h-4 w-4 text-emerald-500" /> Имэйл илгээлт (SMTP)
              </h3>
              <div className="rounded-2xl border border-border bg-surface-hover p-3 text-[11px] leading-relaxed text-text-muted">
                <p className="mb-2 flex items-center gap-1.5 font-bold text-text-main">
                  <Lock className="h-3.5 w-3.5 text-emerald-500" /> Backend-ээр удирдагдана
                </p>
                <p>
                  Gmail App Password зэрэг SMTP нууц үгийг frontend дээр оруулах, хадгалах боломжгүй — bundle-д
                  ил гарна. Тохиргоог Chef backend-ийн env дээр хийнэ:
                </p>
                <pre className="mt-2 overflow-x-auto rounded-xl bg-surface p-2 font-mono text-[10px] text-text-main">
{`SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=admin@zity.mn
SMTP_PASSWORD=<app password>`}
                </pre>
                <p className="mt-2">
                  Дэлгэрэнгүйг <span className="font-mono">docs/chef-backend-env.md</span> файлаас үзнэ үү.
                </p>
              </div>
            </div>

            {/* Модулиуд */}
            <div className="zity-card p-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-extrabold text-text-main">
                <BarChart3 className="h-4 w-4 text-emerald-500" /> Odoo модулиуд
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { module: 'sale.order', desc: 'Захиалга', active: mode === 'bridge' },
                  { module: 'product.product', desc: 'Бараа', active: mode === 'bridge' },
                  { module: 'stock.quant', desc: 'Нөөц', active: mode === 'bridge' },
                  { module: 'res.partner', desc: 'Хэрэглэгч', active: mode === 'bridge' },
                  { module: 'account.move', desc: 'Нэхэмжлэл', active: false },
                  { module: 'mail.mail', desc: 'SMTP mail', active: false },
                ].map(({ module, desc, active }) => (
                  <div
                    key={module}
                    className={`rounded-2xl border p-2.5 ${
                      active
                        ? 'border-emerald-500/20 bg-emerald-500/5'
                        : 'border-border bg-surface-hover opacity-70'
                    }`}
                  >
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

          <section className="space-y-5 xl:col-span-8">
            {/* Хэрэглэгчид */}
            <div className="zity-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h3 className="flex items-center gap-2 text-xs font-extrabold text-text-main">
                  <Users className="h-4 w-4 text-emerald-500" /> Бүртгүүлсэн хэрэглэгчид
                </h3>
                <span className="text-[10px] font-bold text-text-muted">
                  {isLoadingDashboard ? 'Уншиж байна...' : `${users.length} хэрэглэгч`}
                </span>
              </div>

              {dashboardError && (
                <div className="flex gap-2 border-b border-border bg-amber-500/10 px-4 py-2.5 text-[11px] leading-relaxed text-amber-600">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    Chef backend-ийн нэгдсэн жагсаалт татагдсангүй: {dashboardError} Одоогоор зөвхөн Delguur
                    талын хэрэглэгч харагдаж байна.
                  </span>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-hover text-[10px] uppercase text-text-muted">
                    <tr>
                      <th className="px-4 py-3">Хэрэглэгч</th>
                      <th className="px-4 py-3">Эх сурвалж</th>
                      <th className="px-4 py-3">Хадгалсан хаяг</th>
                      <th className="px-4 py-3">Захиалга</th>
                      <th className="px-4 py-3">Сүүлийн идэвх</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                          Хэрэглэгчийн мэдээлэл алга.
                        </td>
                      </tr>
                    ) : (
                      users.map((row) => (
                        <tr key={row.id} className="border-t border-border">
                          <td className="px-4 py-3">
                            <p className="font-extrabold text-text-main">{row.name}</p>
                            <p className="text-[10px] text-text-muted">
                              {row.email} · {row.phone}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-extrabold text-emerald-600">
                              {row.source === 'Both' ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : row.source === 'Zity Chef' ? (
                                <ChefHat className="h-3 w-3" />
                              ) : (
                                <Store className="h-3 w-3" />
                              )}
                              {row.source}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold">{row.savedItems}</td>
                          <td className="px-4 py-3 font-bold">{row.orders}</td>
                          <td className="px-4 py-3 text-text-muted">{row.lastSeen}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Бараа */}
              <div className="zity-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <h3 className="flex items-center gap-2 text-xs font-extrabold text-text-main">
                    <Package className="h-4 w-4 text-emerald-500" /> Бараа, нөөц
                  </h3>
                  <span className="text-[10px] font-bold text-text-muted">
                    {isLoadingProducts ? 'Уншиж байна...' : `${products.length} бараа`}
                  </span>
                </div>
                <div className="max-h-[420px] overflow-y-auto">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 border-b border-border p-3 last:border-0"
                    >
                      <img
                        src={product.image}
                        alt=""
                        loading="lazy"
                        className="h-12 w-12 rounded-xl bg-surface-hover object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-extrabold text-text-main">{product.name}</p>
                        <p className="text-[10px] text-text-muted">
                          {product.sku} · {product.category}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-black text-emerald-600">
                          {formatMnt(product.discountPrice ?? product.price)}
                        </p>
                        <p
                          className={`text-[10px] font-bold ${
                            product.stock <= LOW_STOCK_THRESHOLD ? 'text-amber-500' : 'text-text-muted'
                          }`}
                        >
                          {product.stock} {product.unit}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Захиалга */}
              <div className="zity-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <h3 className="flex items-center gap-2 text-xs font-extrabold text-text-main">
                    <ShoppingBag className="h-4 w-4 text-emerald-500" /> Захиалгууд
                  </h3>
                  <span className="text-[10px] font-bold text-text-muted">{orders.length} захиалга</span>
                </div>
                <div className="max-h-[420px] overflow-y-auto">
                  {orders.length === 0 ? (
                    <p className="py-10 text-center text-xs text-text-muted">Захиалга бүртгэгдээгүй байна.</p>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="border-b border-border p-3 last:border-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-extrabold text-text-main">{order.id}</p>
                            <p className="truncate text-[10px] text-text-muted">
                              {order.odooOrderRef} · {order.items.length} бараа
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-extrabold text-emerald-600">
                            {order.status}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <SyncDot label="Odoo" state={order.odooSync.status} />
                            <SyncDot label="Chef" state={order.chefSync.status} />
                          </div>
                          <p className="text-sm font-black text-text-main">{formatMnt(order.totalAmount)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Синкийн түүх */}
            <div className="zity-card p-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-extrabold text-text-main">
                <Activity className="h-4 w-4 text-emerald-500" /> Синхрончлолын түүх
              </h3>
              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {logs.length === 0 ? (
                  <p className="py-4 text-center text-xs text-text-muted">
                    Түүх хоосон байна. "Синк хийх" товчийг дарж эхлүүлнэ үү.
                  </p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="flex gap-2.5 rounded-2xl border border-border bg-surface-hover p-3">
                      <div className="mt-0.5">{statusIcon(log.status)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-[11px] font-bold text-text-main">{log.action}</p>
                          <span className="shrink-0 font-mono text-[10px] text-text-muted">
                            {formatTime(log.timestamp)}
                          </span>
                        </div>
                        <p className="text-[10px] leading-relaxed text-text-muted">{log.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="rounded-3xl border border-border bg-surface p-4 text-[11px] leading-relaxed text-text-muted">
          <p className="mb-1 font-bold text-text-main">Интеграцийн одоогийн байдал</p>
          <ul className="list-inside list-disc space-y-1">
            <li>
              Zity Chef API: <span className="font-mono">{env.chefApiUrl}</span> —{' '}
              <span className={connection.status === 'live' ? 'font-bold text-emerald-600' : 'font-bold text-amber-500'}>
                {connection.status === 'live' ? 'холбогдсон' : 'холбогдоогүй (локал каталог)'}
              </span>
            </li>
            <li>
              Odoo ERP: <span className="font-mono">{config.url}</span> —{' '}
              <span className="font-bold">{mode === 'bridge' ? 'backend bridge' : 'симуляц'}</span>
            </li>
            <li>Нууц түлхүүрүүд (Odoo API key, SMTP password, service role key) backend дээр л байна.</li>
          </ul>
        </div>
      </div>
    </AppShell>
  );
}

function SyncDot({ label, state }: { label: string; state: 'pending' | 'success' | 'failed' }) {
  const color =
    state === 'success' ? 'bg-emerald-500' : state === 'failed' ? 'bg-red-500' : 'bg-amber-500';

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-1.5 py-0.5 text-[9px] font-bold text-text-muted">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}
