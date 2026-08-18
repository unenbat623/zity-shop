/// <reference types="vite/client" />

/** Апп-д ашиглагддаг public орчны хувьсагчид (бүгд `VITE_` угтвартай) */
interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_ENV?: string;

  readonly VITE_ZITY_CHEF_API_URL?: string;

  /** Апп-ын public хаяг (OG/canonical). Жишээ: https://zity-shop.vercel.app */
  readonly VITE_SITE_URL?: string;

  /** OAuth-ийн дараа буцаж ирэх суурь хаяг. Хоосон = одоогийн origin */
  readonly VITE_AUTH_REDIRECT_URL?: string;

  /**
   * Демо симуляц ('true' | 'false'). Production дээр 'false' байх ёстой —
   * хуурамч төлбөр, хуурамч хүргэлтийн явцыг хаана.
   */
  readonly VITE_DEMO_MODE?: string;

  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;

  readonly VITE_ODOO_URL?: string;
  readonly VITE_ODOO_DB?: string;
  readonly VITE_ODOO_USERNAME?: string;

  /** Admin dashboard-д хандах эрхтэй имэйлүүд, таслалаар тусгаарлана */
  readonly VITE_ADMIN_EMAILS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
