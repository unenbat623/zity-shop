import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  /** Одоо бодитоор идэвхтэй байгаа theme (system сонголтыг бодож тооцсон) */
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  /** App эхлэхэд дуудаж, OS-ийн theme өөрчлөлтийг сонсоно */
  initTheme: () => () => void;
}

const DARK_BACKGROUND = '#0B0F17';
const LIGHT_BACKGROUND = '#F6F8FA';

function prefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === 'system') return prefersDark();
  return mode === 'dark';
}

/** DOM дээр theme-г бодитоор хэрэглэнэ — class + browser UI өнгө */
function applyTheme(isDark: boolean): void {
  if (typeof document === 'undefined') return;

  document.documentElement.classList.toggle('dark', isDark);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', isDark ? DARK_BACKGROUND : LIGHT_BACKGROUND);
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      isDark: false,

      setMode: (mode) => {
        const isDark = resolveIsDark(mode);
        applyTheme(isDark);
        set({ mode, isDark });
      },

      /** Light ↔ Dark. System горимоос сэлгэхэд одоогийн харагдацын эсрэг рүү шилжинэ. */
      toggleTheme: () => {
        const nextIsDark = !get().isDark;
        applyTheme(nextIsDark);
        set({ mode: nextIsDark ? 'dark' : 'light', isDark: nextIsDark });
      },

      initTheme: () => {
        const { mode } = get();
        const isDark = resolveIsDark(mode);
        applyTheme(isDark);
        set({ isDark });

        if (typeof window === 'undefined' || !window.matchMedia) {
          return () => undefined;
        }

        const query = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (event: MediaQueryListEvent) => {
          // OS-ийн өөрчлөлт зөвхөн "system" горимд нөлөөлнө
          if (get().mode !== 'system') return;
          applyTheme(event.matches);
          set({ isDark: event.matches });
        };

        query.addEventListener('change', handleChange);
        return () => query.removeEventListener('change', handleChange);
      },
    }),
    {
      name: 'zity-theme',
      // isDark нь mode-оос гаргаж авдаг тул зөвхөн mode-г хадгална
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const isDark = resolveIsDark(state.mode);
        applyTheme(isDark);
        state.isDark = isDark;
      },
    }
  )
);
