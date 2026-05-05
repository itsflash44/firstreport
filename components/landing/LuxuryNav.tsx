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
  const [scrolled,   setScrolled]   = useState(false);
  const langRef = useRef<HTMLDivElement | null>(null);

  const cur = LANGUAGES.find((l) => l.code === selectedLang) ?? LANGUAGES[0];

  // Blur backdrop activates after first scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!langRef.current?.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ease-in-out
        ${scrolled ? 'glass-nav shadow-sm' : 'bg-transparent'}`}
    >
      <div className="max-w-7xl mx-auto h-[72px] px-6 lg:px-10 flex items-center justify-between">

        {/* Brand — dark theme (white) when nav is transparent over dark hero, light when scrolled */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <FirstReportLogo size={44} variant="wordmark" theme={scrolled ? 'light' : 'dark'} />
        </Link>

        {/* Centre nav */}
        <nav className="hidden lg:flex items-center gap-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary">
          {([
            { href: '#practice',     label: 'Practice Areas' },
            { href: '#how-it-works', label: 'How It Works'   },
            { href: '#trust',        label: 'Trust'           },
          ]).map(({ href, label }) => (
            <span key={href}>
              <a
                href={href}
                className="relative py-1 hover:text-navy-deep transition-colors duration-300
                           after:absolute after:bottom-0 after:left-0 after:h-px after:w-0
                           after:bg-teal after:transition-all after:duration-500
                           hover:after:w-full"
              >
                {label}
              </a>
            </span>
          ))}

          {/* Language selector */}
          <div ref={langRef} className="relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              aria-expanded={langOpen}
              className="flex items-center gap-1.5 py-1 hover:text-navy-deep transition-colors duration-300"
            >
              {/* Globe icon */}
              <svg className="w-3.5 h-3.5 text-teal" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
              </svg>
              <span lang={cur.bcp47} className="font-serif text-sm leading-none text-navy-deep">{cur.label}</span>
              <span className="font-mono text-[9px] text-muted">{cur.code}</span>
              <svg
                className={`w-3 h-3 transition-transform duration-300 ${langOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            {langOpen && (
              <div className="absolute top-full right-0 mt-3 w-80 bg-white border border-cool-gray rounded shadow-lg z-50 p-5">
                <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted mb-3">
                  Available in 11 Indic languages
                </div>
                <ul className="grid grid-cols-3 gap-2">
                  {LANGUAGES.map((l) => {
                    const active = selectedLang === l.code;
                    return (
                      <li key={l.code}>
                        <button
                          onClick={() => { onLangChange(l.code); setLangOpen(false); }}
                          lang={l.bcp47}
                          className={`w-full block px-2 py-2 border rounded-sm text-left transition-all duration-300
                            ${active
                              ? 'bg-navy-deep text-white border-navy-deep'
                              : 'border-cool-gray hover:border-teal hover:bg-teal/5'}`}
                        >
                          <div className={`font-serif text-sm leading-none ${active ? 'text-white' : 'text-navy-deep'}`}>{l.label}</div>
                          <div className={`font-mono text-[9px] uppercase tracking-[0.18em] mt-0.5 ${active ? 'text-white/60' : 'text-muted'}`}>
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
        <div className="flex items-center gap-4">
          {/* NALSA — red dot + number */}
          <a
            href="tel:15100"
            className="hidden sm:flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-secondary hover:text-error transition-colors duration-300"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-60"/>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-error"/>
            </span>
            NALSA · 15100
          </a>

          {/* Begin Assessment CTA */}
          <a
            href="#assessment"
            className="px-5 py-2.5 bg-navy-deep text-white text-[11px] font-semibold uppercase tracking-[0.16em] rounded-sm
                       transition-all duration-500 hover:bg-navy hover:shadow-md active:scale-[0.98]"
          >
            Get Help →
          </a>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden w-9 h-9 border border-cool-gray rounded-sm flex items-center justify-center hover:border-navy-deep transition-colors duration-300"
            aria-label="Menu"
          >
            <svg className="w-4.5 h-4.5 text-navy-deep" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer — slides in */}
      <div className={`lg:hidden overflow-hidden transition-all duration-500 ease-in-out
        ${mobileOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="border-t border-cool-gray bg-ivory/95 backdrop-blur-sm">
          <nav className="px-6 py-6 flex flex-col gap-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary">
            <a href="#practice"     onClick={() => setMobileOpen(false)} className="hover:text-navy-deep transition-colors">Practice Areas</a>
            <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="hover:text-navy-deep transition-colors">How It Works</a>
            <a href="#trust"        onClick={() => setMobileOpen(false)} className="hover:text-navy-deep transition-colors">Trust</a>
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { onLangChange(l.code); setMobileOpen(false); }}
                  lang={l.bcp47}
                  className={`px-2 py-2 border rounded-sm text-left transition-all duration-300
                    ${selectedLang === l.code ? 'bg-navy-deep text-white border-navy-deep' : 'border-cool-gray text-navy-deep hover:border-teal'}`}
                >
                  <div className="font-serif text-sm leading-none">{l.label}</div>
                </button>
              ))}
            </div>
            <a href="tel:15100" className="flex items-center gap-2 text-error font-mono">
              <span className="w-2 h-2 rounded-full bg-error"/>
              NALSA · 15100 — Free Legal Aid
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
