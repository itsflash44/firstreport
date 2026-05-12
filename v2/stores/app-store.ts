import { create } from 'zustand';
import type { LangCode, AppSettings } from '../types/index';
import { isValidLangCode } from '../types/i18n';

const STORAGE_KEY_LANG = 'fr_v2_lang';
const STORAGE_KEY_SETTINGS = 'fr_v2_settings';

const DEFAULT_SETTINGS: AppSettings = {
  language: 'hi-IN',
  darkMode: false,
  autoPlayTts: true,
  offlineMode: false,
};

function loadLanguage(): LangCode {
  if (typeof window === 'undefined') return 'hi-IN';
  const stored = localStorage.getItem(STORAGE_KEY_LANG);
  if (stored && isValidLangCode(stored)) return stored;
  const legacy = localStorage.getItem('fr_lang');
  if (legacy && isValidLangCode(legacy)) return legacy;
  return 'hi-IN';
}

function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* corrupt data — use defaults */ }
  return DEFAULT_SETTINGS;
}

interface AppState {
  language: LangCode;
  isOnline: boolean;
  isHydrated: boolean;
  settings: AppSettings;

  setLanguage: (lang: LangCode) => void;
  setOnline: (online: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  language: loadLanguage(),
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isHydrated: false,
  settings: loadSettings(),

  setLanguage: (lang) => {
    set({ language: lang });
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_LANG, lang);
      document.documentElement.lang = lang;
    }
  },

  setOnline: (online) => set({ isOnline: online }),

  setHydrated: (hydrated) => set({ isHydrated: hydrated }),

  updateSettings: (patch) =>
    set((state) => {
      const next = { ...state.settings, ...patch };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(next));
      }
      return { settings: next };
    }),
}));
