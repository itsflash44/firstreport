'use client';

/**
 * FirstReport — Shared Language Context
 *
 * Single source of truth for the active language across the entire (app) shell.
 * - Persisted to localStorage under key 'fr_lang'
 * - document.documentElement.lang is kept in sync for accessibility + browser fonts
 * - All (app) pages should read lang / call setLanguage from this context
 *   rather than managing their own local state.
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { LANG_BY_CODE, type LangCode } from '@/lib/i18n';

interface LanguageContextValue {
  lang: LangCode;
  setLanguage: (next: LangCode) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'hi-IN',
  setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<LangCode>('hi-IN');

  // On first mount: prefer URL ?lang= param, then localStorage, else default hi-IN
  useEffect(() => {
    const urlLang = new URLSearchParams(window.location.search).get('lang') as LangCode | null;
    const saved   = localStorage.getItem('fr_lang') as LangCode | null;
    const resolved =
      (urlLang && LANG_BY_CODE[urlLang] ? urlLang : null) ??
      (saved   && LANG_BY_CODE[saved]   ? saved   : null) ??
      'hi-IN';
    setLang(resolved);
    document.documentElement.lang = resolved;
  }, []);

  const setLanguage = (next: LangCode) => {
    if (!LANG_BY_CODE[next]) return;
    setLang(next);
    localStorage.setItem('fr_lang', next);
    document.documentElement.lang = next;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

/** Consume the shared language anywhere inside (app) layout */
export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
