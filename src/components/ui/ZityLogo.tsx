/**
 * Zity брэндийн лого.
 *
 * Санаа: тогоочийн малгай (Zity Chef) + зоримог "Z" + шинэхэн навч (хүнс).
 * `public/logo.svg` файлтай ижил геометр — icon болон UI хоёр зөрөхгүй.
 * 32px дээр ч уншигдахуйц: зузаан штрих, гурван элемент, нарийн деталь байхгүй.
 */

import { useId } from 'react';

interface MarkProps {
  className?: string;
}

/** Зөвхөн тэмдэг — icon, avatar, жижиг хэмжээ */
export function ZityMark({ className = 'h-10 w-10' }: MarkProps) {
  /**
   * Gradient id-г React-аар үүсгэнэ.
   *
   * Тогтмол id ашиглавал нэг хуудсанд хоёр лого (жишээ нь desktop sidebar ба
   * мобайл drawer) байхад id давхцаж, `url(#...)` эхний — далд байгаа —
   * тодорхойлолт руу заана. Тэр үед лого өнгөгүй хоосон харагддаг.
   */
  const gradientId = `zity-grad-${useId()}`;

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Zity"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="55%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
      </defs>

      <rect width="64" height="64" rx="18" fill={`url(#${gradientId})`} />

      {/* Тогоочийн малгай — ирмэг нь бөмбөлгөөс нарийн */}
      <g fill="#FFFFFF">
        <circle cx="23" cy="17" r="6.5" />
        <circle cx="41" cy="17" r="6.5" />
        <circle cx="32" cy="13.5" r="8" />
        <rect x="22" y="18" width="20" height="8" rx="3" />
      </g>

      {/* Z */}
      <path
        d="M22 30.5h20a1.6 1.6 0 0 1 1.24 2.6L29.4 49.2h12.6a1.6 1.6 0 0 1 1.6 1.6v2a1.6 1.6 0 0 1-1.6 1.6H22a1.6 1.6 0 0 1-1.24-2.6L34.6 35.4H22a1.6 1.6 0 0 1-1.6-1.6v-1.7A1.6 1.6 0 0 1 22 30.5z"
        fill="#FFFFFF"
      />

      {/* Навч */}
      <path d="M55 39.5c0 5.8-4.3 10.2-10 10.2 0-5.8 4.3-10.2 10-10.2z" fill="#FCD34D" />
    </svg>
  );
}

interface LogoProps extends MarkProps {
  /** Доор нь тайлбар мөр харуулах эсэх */
  showTagline?: boolean;
  /** Тэмдгийн хэмжээ */
  markClassName?: string;
}

/** Тэмдэг + нэр (header, login, sidebar) */
export function ZityLogo({
  className = '',
  markClassName = 'h-10 w-10',
  showTagline = false,
}: LogoProps) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <ZityMark className={`${markClassName} shrink-0`} />
      <span className="flex flex-col leading-none">
        <span className="flex items-center gap-1">
          <span className="text-base font-extrabold tracking-tight text-text-main">ZITY</span>
          <span className="text-base font-extrabold tracking-tight text-emerald-600">SHOP</span>
        </span>
        {showTagline && (
          <span className="mt-1 text-[10px] font-medium text-text-muted">Zity Chef экосистем</span>
        )}
      </span>
    </span>
  );
}
