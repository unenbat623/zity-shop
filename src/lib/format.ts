/** Монгол хэрэглэгчид зориулсан нэгдсэн форматлагчид */

const numberFormatter = new Intl.NumberFormat('mn-MN');

/** 17500 → "17,500₮" */
export function formatMnt(amount: number): string {
  if (!Number.isFinite(amount)) return '0₮';
  return `${numberFormatter.format(Math.round(amount))}₮`;
}

/** 45 → "45" */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return numberFormatter.format(value);
}

/** ISO огноо → "2026.08.14 14:30" */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('mn-MN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

/** ISO огноо → "2026.08.19" (цаггүй) */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('mn-MN', { dateStyle: 'medium' }).format(date);
}

/** ISO огноо → "14:30" */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('mn-MN', { timeStyle: 'short' }).format(date);
}

/** "3 минутын өмнө" маягийн харьцангуй хугацаа */
export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';

  const diffSeconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 60) return 'Дөнгөж сая';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} минутын өмнө`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} цагийн өмнө`;
  if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)} хоногийн өмнө`;
  return formatDateTime(iso);
}

/** Хэрэглэгчийн нэрнээс avatar-ын үсэг гаргана */
export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'Z';
  return trimmed.charAt(0).toUpperCase();
}
