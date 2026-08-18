import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Mail, MapPin, Phone } from 'lucide-react';

import { AppShell } from './AppShell';
import { LEGAL_COMPANY, LEGAL_UPDATED_AT } from '../constants/legal';
import { formatDate } from '../lib/format';

export interface LegalSection {
  /** Гарчиг — агуулгын жагсаалтад мөн энэ нэрээр харагдана */
  title: string;
  body: ReactNode;
}

interface LegalDocumentProps {
  title: string;
  /** Баримтын товч тайлбар — гарчгийн доор */
  summary: string;
  sections: LegalSection[];
  /** Хосолсон нөгөө баримт руу очих холбоос */
  relatedLink: { label: string; to: string };
}

/**
 * Үйлчилгээний нөхцөл болон Нууцлалын бодлогын нийтлэг бүрхүүл.
 *
 * Хоёр баримт нь ижил бүтэцтэй (гарчиг → шинэчилсэн огноо → агуулга → холбоо
 * барих) тул харагдацыг нэг дор барина — нэгийг нь засахад нөгөө нь хоцрохгүй.
 */
export function LegalDocument({ title, summary, sections, relatedLink }: LegalDocumentProps) {
  return (
    <AppShell showSearch={false} title={title} maxWidth="md">
      <article className="space-y-5">
        <header className="zity-card p-5 sm:p-6">
          <h1 className="text-xl font-black text-text-main sm:text-2xl">{title}</h1>
          <p className="mt-2 text-xs leading-relaxed text-text-muted sm:text-sm">{summary}</p>

          <p className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-text-subtle">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
            Сүүлд шинэчилсэн: {formatDate(LEGAL_UPDATED_AT)}
          </p>
        </header>

        {/* Агуулга — урт баримтаас хэрэгтэй хэсгээ шууд олоход */}
        <nav className="zity-card p-4 sm:p-5" aria-label="Агуулга">
          <h2 className="mb-2 text-xs font-extrabold text-text-main">Агуулга</h2>
          <ol className="list-inside list-decimal space-y-1">
            {sections.map((section, index) => (
              <li key={section.title} className="text-xs text-text-muted">
                <a
                  href={`#section-${index + 1}`}
                  className="font-semibold text-emerald-600 hover:underline"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {sections.map((section, index) => (
          <section key={section.title} id={`section-${index + 1}`} className="zity-card p-5 sm:p-6">
            <h2 className="mb-3 text-sm font-extrabold text-text-main sm:text-base">
              {index + 1}. {section.title}
            </h2>
            <div className="space-y-3 text-xs leading-relaxed text-text-muted sm:text-sm">
              {section.body}
            </div>
          </section>
        ))}

        {/* Холбоо барих — гомдол, хүсэлт хаашаа явахыг тодорхой заана */}
        <section className="zity-card p-5 sm:p-6">
          <h2 className="mb-3 text-sm font-extrabold text-text-main sm:text-base">Холбоо барих</h2>

          <dl className="space-y-2 text-xs text-text-muted sm:text-sm">
            <div>
              <dt className="font-bold text-text-main">{LEGAL_COMPANY.name}</dt>
              <dd className="text-[11px]">Улсын бүртгэлийн дугаар: {LEGAL_COMPANY.registrationNumber}</dd>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span>{LEGAL_COMPANY.address}</span>
            </div>

            <div className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <a
                href={`mailto:${LEGAL_COMPANY.supportEmail}`}
                className="font-semibold text-emerald-600 hover:underline"
              >
                {LEGAL_COMPANY.supportEmail}
              </a>
            </div>

            <div className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span>{LEGAL_COMPANY.phone}</span>
            </div>
          </dl>
        </section>

        <Link
          to={relatedLink.to}
          className="zity-btn-secondary w-full py-3 text-xs"
        >
          {relatedLink.label}
        </Link>
      </article>
    </AppShell>
  );
}
