'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import FirstReportLogo from '@/components/FirstReportLogo';
import { LANGUAGES, type LangCode } from '@/lib/i18n';

interface LuxuryNavProps {
  selectedLang: LangCode;
  onLangChange: (lang: LangCode) => void;
}

export default function LuxuryNav({ selectedLang, onLangChange }: LuxuryNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen,   setLangOpen]   = useState(false);
  const langRef = useRef<HTMLDivElement | null>(null);

  const cur = LANGUAGES.find((l) => l.code === selectedLang) ?? LANGUAGES[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!langRef.current?.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-cool-gray bg-white">
      <div className="max-w-7xl mx-auto h-20 px-6 lg:px-10 flex items-center justify-between">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <FirstReportLogo size={40} variant="wordmark" theme="light" />
        </Link>

        {/* Center nav */}
        <nav className="hidden lg:flex items-center gap-8 text-[12px] font-semibold uppercase tracking-[0.16em] text-secondary">
          <a href="#practice"    className="hover:text-navy transition-colors">Practice Areas</a>
          <a href="#how-it-works" className="hover:text-navy transition-colors">How It Works</a>
          <a href="#trust"       className="hover:text-navy transition-colors">Trust</a>

          {/* Languages — click-based, state update in-place */}
          <div ref={langRef} className="relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              aria-expanded={langOpen}
              className="flex items-center gap-1.5 hover:text-navy transition-colors"
            >
              <span lang={cur.bcp47} className="font-serif text-base leading-none text-navy">{cur.label}</span>
              <span className="text-[10px] text-secondary">{cur.code}</span>
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {langOpen && (
              <div className="absolute top-full right-0 mt-3 w-80 bg-white border border-cool-gray rounded-md shadow-lg z-50 p-5">
                <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-secondary mb-3">
                  Available in 11 languages
                </div>
                <ul className="grid grid-cols-3 gap-2">
                  {LANGUAGES.map((l) => {
                    const active = selectedLang === l.code;
                    return (
                      <li key={l.code}>
                        <button
                          onClick={() => { onLangChange(l.code); setLangOpen(false); }}
                          lang={l.bcp47}
                          className={`w-full block px-2 py-1.5 border rounded-sm text-left transition-colors
                            ${active
                              ? 'bg-navy text-white border-navy'
                              : 'border-cool-gray hover:border-teal hover:bg-teal/5'}`}
                        >
                          <div className={`font-serif text-base leading-none ${active ? 'text-white' : 'text-navy'}`}>{l.label}</div>
                          <div className={`font-mono text-[9px] uppercase tracking-[0.2em] mt-0.5 ${active ? 'text-white/65' : 'text-secondary'}`}>
                            {l.sublabel}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-3 sm:gap-5">
          <a
            href="tel:15100"
            className="hidden sm:flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary hover:text-error transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-error animate-rec" />
            NALSA · 15100
          </a>

          <a
            href="#assessment"
            className="px-5 py-2.5 bg-navy text-white rounded-sm text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em]
                       hover:bg-navy/90 active:scale-[0.98] transition-all"
          >
            Begin Assessment →
          </a>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden w-10 h-10 border border-cool-gray rounded-sm flex items-center justify-center hover:border-navy transition-colors"
            aria-label="Menu"
          >
            <svg className="w-5 h-5 text-navy" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-cool-gray bg-white">
          <nav className="px-6 py-5 flex flex-col gap-4 text-sm font-semibold uppercase tracking-[0.16em] text-secondary">
            <a href="#practice"    onClick={() => setMobileOpen(false)} className="hover:text-navy">Practice Areas</a>
            <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="hover:text-navy">How It Works</a>
            <a href="#trust"        onClick={() => setMobileOpen(false)} className="hover:text-navy">Trust</a>
            {/* Mobile lang selector — simple grid */}
            <div className="grid grid-cols-3 gap-1.5 pt-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { onLangChange(l.code); setMobileOpen(false); }}
                  lang={l.bcp47}
                  className={`px-2 py-1.5 border rounded-sm text-left transition-colors
                    ${selectedLang === l.code ? 'bg-navy text-white border-navy' : 'border-cool-gray text-navy hover:border-teal'}`}
                >
                  <div className="font-serif text-sm leading-none">{l.label}</div>
                </button>
              ))}
            </div>
            <a href="tel:15100" className="text-error font-semibold">NALSA · 15100</a>
          </nav>
        </div>
      )}
    </header>
  );
}
