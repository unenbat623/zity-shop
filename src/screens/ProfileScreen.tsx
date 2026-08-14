import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ChefHat,
  Database,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Package,
  PackageCheck,
  Pencil,
  Phone,
  Plus,
  Refrigerator,
  Star,
  Trash2,
  Trophy,
  X,
} from 'lucide-react';

import { AppShell } from '../components/AppShell';
import { useAuthStore, useUserProfile } from '../store/useAuthStore';
import { useOrderStore } from '../store/useOrderStore';
import { useCatalogStore } from '../store/useCatalogStore';
import { useToastStore } from '../store/useToastStore';
import { DeliveryAddress } from '../types';
import { formatMnt, formatNumber, getInitials } from '../lib/format';

const DISTRICTS = [
  'Сүхбаатар дүүрэг',
  'Хан-Уул дүүрэг',
  'Баянгол дүүрэг',
  'Баянзүрх дүүрэг',
  'Чингэлтэй дүүрэг',
  'Сонгинохайрхан дүүрэг',
  'Налайх дүүрэг',
];

type AddressDraft = Omit<DeliveryAddress, 'id'>;

const EMPTY_DRAFT: AddressDraft = {
  label: '',
  district: DISTRICTS[0],
  khoroo: '',
  streetBuilding: '',
  entranceAppt: '',
  phone: '',
  notes: '',
};

export function ProfileScreen() {
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.show);

  const account = useAuthStore((state) => state.account);
  const isAdmin = useAuthStore((state) => state.isAdmin());
  const profile = useUserProfile();
  const selectedAddressIndex = useAuthStore((state) => state.getSelectedAddressIndex());
  const { setSelectedAddressIndex, addAddress, updateAddress, removeAddress, toggleZityChefConnection, signOut } =
    useAuthStore();

  const orders = useOrderStore((state) => state.orders);
  const connection = useCatalogStore((state) => state.connection);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [draft, setDraft] = useState<AddressDraft>(EMPTY_DRAFT);

  const myOrders = orders.filter((order) => order.userId === (account?.id ?? null));
  const totalSpend = myOrders
    .filter((order) => order.paymentStatus === 'paid')
    .reduce((sum, order) => sum + order.totalAmount, 0);
  const deliveredOrders = myOrders.filter((order) => order.status === 'delivered').length;

  const openCreateForm = () => {
    setDraft({ ...EMPTY_DRAFT, phone: profile.phone });
    setEditingId(null);
    setIsFormOpen(true);
  };

  const openEditForm = (address: DeliveryAddress) => {
    const { id, ...rest } = address;
    setDraft(rest);
    setEditingId(id);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!draft.khoroo.trim() || !draft.streetBuilding.trim()) {
      showToast('Хороо болон байр/гудамжны нэрийг бөглөнө үү.', 'warning');
      return;
    }
    if (!/^[6-9]\d{7}$/.test(draft.phone.trim())) {
      showToast('Холбоо барих утас 8 оронтой байх ёстой.', 'warning');
      return;
    }

    if (editingId) {
      updateAddress(editingId, draft);
      showToast('Хаяг шинэчлэгдлээ.', 'success');
    } else {
      addAddress(draft);
      showToast('Шинэ хаяг нэмэгдлээ.', 'success');
    }
    closeForm();
  };

  const handleRemove = (address: DeliveryAddress) => {
    removeAddress(address.id);
    showToast('Хаяг устгагдлаа.', 'info');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <AppShell showSearch={false} title="Профайл" maxWidth="md">
      <div className="space-y-4">
        {/* Профайлын толгой */}
        <section className="zity-brand-surface relative overflow-hidden rounded-3xl p-6 shadow-xl">
          <div className="relative z-10">
            <div className="flex items-center gap-4">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt=""
                  className="h-16 w-16 rounded-2xl border border-white/20 object-cover shadow-lg"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/20 text-3xl font-extrabold text-white shadow-lg backdrop-blur-md">
                  {getInitials(profile.name)}
                </div>
              )}

              <div className="min-w-0">
                <h1 className="truncate text-xl font-extrabold text-white">{profile.name}</h1>
                <p className="flex min-w-0 items-center gap-1 text-xs font-medium text-emerald-200">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </p>
                {profile.phone && (
                  <p className="mt-0.5 flex min-w-0 items-center gap-1 text-xs font-medium text-emerald-200">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span className="truncate">{profile.phone}</span>
                  </p>
                )}
                {account && (
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white">
                    {account.provider === 'google' ? 'Google бүртгэл' : 'Имэйл бүртгэл'}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-400" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-200">Zity Points</p>
                  <p className="text-2xl font-extrabold text-white">{formatNumber(profile.zityPoints)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase text-emerald-200">Нийт зарцуулсан</p>
                <p className="text-sm font-extrabold text-white">{formatMnt(totalSpend)}</p>
              </div>
            </div>

            <button
              onClick={() => void handleSignOut()}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-extrabold text-white transition-colors hover:bg-white/20"
            >
              <LogOut className="h-4 w-4" /> Гарах
            </button>
          </div>

          <ChefHat className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 rotate-12 text-white/10" />
        </section>

        {/* Товч статистик */}
        <section className="grid grid-cols-3 gap-3">
          {[
            { icon: PackageCheck, label: 'Нийт захиалга', value: formatNumber(myOrders.length) },
            { icon: CheckCircle2, label: 'Хүргэгдсэн', value: formatNumber(deliveredOrders) },
            { icon: Star, label: 'Zity Points', value: formatNumber(profile.zityPoints) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="zity-card p-3 text-center">
              <Icon className="mx-auto mb-1 h-5 w-5 text-emerald-500" />
              <p className="text-lg font-extrabold text-text-main">{value}</p>
              <p className="text-[10px] font-bold text-text-muted">{label}</p>
            </div>
          ))}
        </section>

        {/* Zity Chef холболт */}
        <section
          className={`rounded-3xl border p-4 shadow-xs ${
            profile.isZityChefConnected
              ? 'border-emerald-500/30 bg-emerald-500/10'
              : 'border-border bg-surface'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
                  profile.isZityChefConnected
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-border bg-surface-hover text-text-muted'
                }`}
              >
                <ChefHat className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-text-main">Zity Chef холболт</p>
                <p className="text-[10px] leading-relaxed text-text-muted">
                  {profile.isZityChefConnected
                    ? 'Худалдан авсан орц Zity Chef хөргөгчид автоматаар нэмэгдэнэ.'
                    : 'Холбоогүй байна — жорын орц хөргөгчид синк хийгдэхгүй.'}
                </p>
                <p className="mt-1 text-[10px] font-bold text-text-subtle">
                  Backend:{' '}
                  <span className={connection.status === 'live' ? 'text-emerald-600' : 'text-amber-500'}>
                    {connection.status === 'live' ? 'Live' : 'Локал каталог'}
                  </span>
                </p>
              </div>
            </div>

            <button
              onClick={toggleZityChefConnection}
              className={`shrink-0 rounded-full px-4 py-2.5 text-[11px] font-extrabold transition-all active:scale-95 ${
                profile.isZityChefConnected
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'border border-border bg-surface-hover text-text-main hover:bg-border'
              }`}
            >
              {profile.isZityChefConnected ? 'Идэвхтэй' : 'Холбох'}
            </button>
          </div>
        </section>

        {/* Хадгалсан хаягууд */}
        <section className="zity-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="flex items-center gap-2 text-xs font-extrabold text-text-main">
              <MapPin className="h-4 w-4 text-emerald-500" /> Хүргэлтийн хаягууд
            </h2>
            <button
              onClick={isFormOpen ? closeForm : openCreateForm}
              className="-my-2 flex shrink-0 items-center gap-1 px-2 py-2 text-[11px] font-bold text-emerald-600 hover:underline"
            >
              {isFormOpen ? (
                <>
                  <X className="h-3.5 w-3.5" /> Хаах
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" /> Нэмэх
                </>
              )}
            </button>
          </div>

          {isFormOpen && (
            <form onSubmit={handleSubmit} className="animate-in space-y-2 border-b border-border bg-surface-hover/50 p-4">
              <div className="grid grid-cols-2 gap-2">
                <LabeledInput
                  label="Нэршил (сонголтоор)"
                  value={draft.label ?? ''}
                  onChange={(value) => setDraft({ ...draft, label: value })}
                  placeholder="Гэр / Ажил"
                />
                <div>
                  <label className="mb-1 block text-[10px] font-bold text-text-muted">Дүүрэг</label>
                  <select
                    value={draft.district}
                    onChange={(event) => setDraft({ ...draft, district: event.target.value })}
                    className="zity-input"
                  >
                    {DISTRICTS.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <LabeledInput
                  label="Хороо"
                  value={draft.khoroo}
                  onChange={(value) => setDraft({ ...draft, khoroo: value })}
                  placeholder="1-р хороо"
                  required
                />
                <LabeledInput
                  label="Утас"
                  value={draft.phone}
                  onChange={(value) => setDraft({ ...draft, phone: value.replace(/\D/g, '').slice(0, 8) })}
                  placeholder="99112233"
                  inputMode="numeric"
                  required
                />
              </div>

              <LabeledInput
                label="Байр, гудамж"
                value={draft.streetBuilding}
                onChange={(value) => setDraft({ ...draft, streetBuilding: value })}
                placeholder="Zity Center, 4-р давхар"
                required
              />

              <div className="grid grid-cols-2 gap-2">
                <LabeledInput
                  label="Орц, тоот"
                  value={draft.entranceAppt}
                  onChange={(value) => setDraft({ ...draft, entranceAppt: value })}
                  placeholder="1-р орц, 402 тоот"
                />
                <LabeledInput
                  label="Тэмдэглэл"
                  value={draft.notes ?? ''}
                  onChange={(value) => setDraft({ ...draft, notes: value })}
                  placeholder="Код: 1234"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button type="submit" className="zity-btn-primary flex-1 py-2.5 text-xs">
                  {editingId ? 'Хадгалах' : 'Хаяг нэмэх'}
                </button>
                <button type="button" onClick={closeForm} className="zity-btn-secondary flex-1 py-2.5 text-xs">
                  Цуцлах
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2 p-3">
            {profile.addresses.length === 0 ? (
              <p className="py-6 text-center text-xs text-text-muted">
                Хаяг хадгалаагүй байна. Захиалга өгөхийн тулд хаягаа нэмнэ үү.
              </p>
            ) : (
              profile.addresses.map((address, index) => {
                const isSelected = index === selectedAddressIndex;
                return (
                  <div
                    key={address.id}
                    className={`flex items-start gap-3 rounded-2xl border p-3 transition-all ${
                      isSelected
                        ? 'border-emerald-500/40 bg-emerald-500/10'
                        : 'border-border bg-surface-hover'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedAddressIndex(index)}
                      className="flex flex-1 items-start gap-3 text-left"
                      aria-pressed={isSelected}
                    >
                      <span
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-border text-text-muted'
                        }`}
                      >
                        <MapPin className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-text-main">
                            {address.district}, {address.khoroo}
                          </span>
                          {address.label && (
                            <span className="rounded-full border border-border bg-surface px-1.5 py-0.5 text-[9px] font-bold text-text-muted">
                              {address.label}
                            </span>
                          )}
                        </span>
                        <span className="block text-[11px] text-text-muted">{address.streetBuilding}</span>
                        {address.entranceAppt && (
                          <span className="block text-[10px] text-text-muted">{address.entranceAppt}</span>
                        )}
                        <span className="block font-mono text-[10px] text-text-muted">{address.phone}</span>
                        {address.notes && (
                          <span className="mt-0.5 block text-[10px] font-medium text-emerald-600">
                            📝 {address.notes}
                          </span>
                        )}
                      </span>
                    </button>

                    <div className="flex shrink-0 flex-col gap-1">
                      <button
                        onClick={() => openEditForm(address)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface hover:text-text-main"
                        aria-label="Хаяг засах"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemove(address)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface hover:text-red-500"
                        aria-label="Хаяг устгах"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Цэсний холбоосууд */}
        <section className="zity-card overflow-hidden">
          {[
            { icon: Package, label: 'Захиалгын түүх', path: '/orders', badge: myOrders.length },
            { icon: ChefHat, label: 'Хоолны орц багцууд', path: '/recipe-kits' },
            { icon: Refrigerator, label: 'Zity Chef хөргөгч', path: '/zity-fridge' },
            ...(isAdmin
              ? [{ icon: LayoutDashboard, label: 'Admin dashboard', path: '/odoo-admin' }]
              : []),
          ].map(({ icon: Icon, label, path, badge }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex w-full items-center justify-between border-b border-border p-4 transition-colors last:border-0 hover:bg-surface-hover"
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-bold text-text-main">{label}</span>
              </span>
              <span className="flex items-center gap-2">
                {badge !== undefined && badge > 0 && (
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600">
                    {badge}
                  </span>
                )}
                <ArrowRight className="h-4 w-4 text-text-muted" />
              </span>
            </button>
          ))}
        </section>

        {isAdmin && (
          <p className="flex items-center gap-1.5 px-1 text-[10px] text-text-subtle">
            <Database className="h-3 w-3" /> Танд admin эрх идэвхтэй байна.
          </p>
        )}
      </div>
    </AppShell>
  );
}

interface LabeledInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  inputMode?: 'text' | 'numeric';
}

function LabeledInput({ label, value, onChange, placeholder, required, inputMode }: LabeledInputProps) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold text-text-muted">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        inputMode={inputMode}
        className="zity-input"
      />
    </div>
  );
}
