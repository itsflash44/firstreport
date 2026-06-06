'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import FirstReportLogo from '@/components/FirstReportLogo';
import { LANGUAGES, type LangCode } from '@/lib/i18n';

interface LuxuryNavProps {
  selectedLang: LangCode;
  onLangChange: (lang: LangCode) => void;
}

// i18n for nav labels and CTA
const NAV_LABELS: Partial<Record<LangCode, [string, string, string]>> = {
  'hi-IN': ['क्षेत्र', 'कैसे काम करता है', 'विश्वास'],
  'en-IN': ['Practice Areas', 'How It Works', 'Trust'],
  'bn-IN': ['ক্ষেত্র', 'কীভাবে কাজ করে', 'বিশ্বাস'],
  'ta-IN': ['பிரிவுகள்', 'எவ்வாறு', 'நம்பகம்'],
  'te-IN': ['రంగాలు', 'ఎలా పనిచేస్తుంది', 'నమ్మకం'],
  'mr-IN': ['क्षेत्र', 'कसे काम करते', 'विश्वास'],
  'gu-IN': ['ક્ષેત્ર', 'કેવી રીતે', 'વિશ્વાસ'],
  'kn-IN': ['ಕ್ಷೇತ್ರ', 'ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ', 'ನಂಬಿಕೆ'],
  'ml-IN': ['മേഖലകൾ', 'എങ്ങനെ', 'വിശ്വാസം'],
  'pa-IN': ['ਖੇਤਰ', 'ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ', 'ਭਰੋਸਾ'],
  'od-IN': ['କ୍ଷେତ୍ର', 'କିପରି କାମ କରେ', 'ବିଶ୍ୱାସ'],
};
const GET_HELP: Partial<Record<LangCode, string>> = {
  'hi-IN': 'मदद लें', 'en-IN': 'Get Help', 'bn-IN': 'সাহায্য নিন',
  'ta-IN': 'உதவி பெறு', 'te-IN': 'సహాయం పొందండి', 'mr-IN': 'मदत घ्या',
  'gu-IN': 'મદદ મેળવો', 'kn-IN': 'ಸಹಾಯ ಪಡೆಯಿರಿ', 'ml-IN': 'സഹായം നേടൂ',
  'pa-IN': 'ਮਦਦ ਲਓ', 'od-IN': 'ସାହାଯ୍ୟ ନିଅ',
};
const AVAIL_LABEL: Partial<Record<LangCode, string>> = {
  'hi-IN': '11 भारतीय भाषाओं में', 'en-IN': 'Available in 11 Indic languages',
  'bn-IN': '১১টি ভারতীয় ভাষায়', 'ta-IN': '11 இந்திய மொழிகளில்',
  'te-IN': '11 భారతీయ భాషల్లో', 'mr-IN': '११ भारतीय भाषांमध्ये',
  'gu-IN': '11 ભારતીય ભાષાઓમાં', 'kn-IN': '11 ಭಾರತೀಯ ಭಾಷೆಗಳಲ್ಲಿ',
  'ml-IN': '11 ഇന്ത്യൻ ഭാഷകളിൽ', 'pa-IN': '11 ਭਾਰਤੀ ਭਾਸ਼ਾਵਾਂ ਵਿੱਚ',
  'od-IN': '11ଟି ଭାରତୀୟ ଭାଷାରେ',
};

export default function LuxuryNav({ selectedLang, onLangChange }: LuxuryNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen,   setLangOpen]   = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const langRef = useRef<HTMLDivElement | null>(null);

  const cur        = LANGUAGES.find((l) => l.code === selectedLang) ?? LANGUAGES[0];
  const navLabels  = NAV_LABELS[selectedLang]  ?? NAV_LABELS['en-IN']!;
  const getHelp    = GET_HELP[selectedLang]    ?? GET_HELP['en-IN']!;
  const availLabel = AVAIL_LABEL[selectedLang] ?? AVAIL_LABEL['en-IN']!;

  // Scroll listener — activates glassmorphism after first 12px
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close lang dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!langRef.current?.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Contrast-aware color tokens ────────────────────────────────
  // Over dark hero (transparent) → white text
  // Scrolled (glass-nav ivory bg) → navy/dark text
  const linkBase    = scrolled
    ? 'text-secondary hover:text-navy-deep'
    : 'text-white/85 hover:text-white';
  const underline   = scrolled ? 'after:bg-teal' : 'after:bg-white/60';
  const langText    = scrolled ? 'text-navy-deep' : 'text-white';
  const langMono    = scrolled ? 'text-muted'     : 'text-white/55';
  const chevron     = scrolled ? 'text-secondary' : 'text-white/60';
  const nalsaBase   = scrolled
    ? 'text-secondary hover:text-error'
    : 'text-white/70 hover:text-white';
  const ctaStyle    = scrolled
    ? 'bg-navy-deep text-white hover:bg-navy hover:shadow-md'
    : 'bg-white/12 text-white border border-white/25 hover:bg-white/20 backdrop-blur-sm';
  const burgerBorder= scrolled ? 'border-cool-gray hover:border-navy-deep' : 'border-white/30 hover:border-white';
  const burgerIcon  = scrolled ? 'text-navy-deep' : 'text-white';

  const navLinks = [
    { href: '#practice',     label: navLabels[0] },
    { href: '#how-it-works', label: navLabels[1] },
    { href: '#trust',        label: navLabels[2] },
  ];

  return (
    <header
      className={`fixed w-full top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out
        ${scrolled ? 'glass-nav shadow-sm' : 'bg-transparent'}`}
    >
      <div className="max-w-7xl mx-auto h-[72px] px-6 lg:px-10 flex items-center justify-between">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          {/* Logo theme: 'dark' = white marks on transparent (for dark hero); 'light' = navy (for ivory bg) */}
          <FirstReportLogo size={44} variant="wordmark" theme={scrolled ? 'light' : 'dark'} />
        </Link>

        {/* Centre nav — desktop */}
        <nav
          className={`hidden lg:flex items-center gap-8 text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors duration-500 ${linkBase}`}
          aria-label="Main navigation"
        >
          {navLinks.map(({ href, label }) => (
            <span key={href}>
              <a
                href={href}
                className={`relative py-1 transition-colors duration-300
                           after:absolute after:bottom-0 after:left-0 after:h-px after:w-0
                           ${underline} after:transition-all after:duration-500
                           hover:after:w-full`}
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
              aria-haspopup="listbox"
              className={`flex items-center gap-1.5 py-1 transition-colors duration-300 ${linkBase}`}
            >
              <svg className="w-3.5 h-3.5 text-teal" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
              </svg>
              <span lang={cur.bcp47} className={`font-serif text-sm leading-none ${langText}`}>{cur.label}</span>
              <span className={`font-mono text-[9px] ${langMono}`}>{cur.code}</span>
              <svg
                className={`w-3 h-3 transition-transform duration-300 ${langOpen ? 'rotate-180' : ''} ${chevron}`}
                fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            {langOpen && (
              <div
                role="listbox"
                aria-label="Select language"
                className="absolute top-full right-0 mt-3 w-80 bg-white border border-cool-gray rounded shadow-lg z-50 p-5"
              >
                <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted mb-3">
                  {availLabel}
                </div>
                <ul className="grid grid-cols-3 gap-2">
                  {LANGUAGES.map((l) => {
                    const active = selectedLang === l.code;
                    return (
                      <li key={l.code}>
                        <button
                          role="option"
                          aria-selected={active}
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
          {/* NALSA */}
          <a
            href="tel:15100"
            className={`hidden sm:flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] transition-colors duration-300 ${nalsaBase}`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-60"/>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-error"/>
            </span>
            NALSA · 15100
          </a>

          {/* CTA */}
          <a
            href="#assessment"
            className={`px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] rounded-sm
                       transition-all duration-500 active:scale-[0.98] ${ctaStyle}`}
          >
            {getHelp} →
          </a>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className={`lg:hidden w-9 h-9 border rounded-sm flex items-center justify-center transition-colors duration-300 ${burgerBorder}`}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            <svg className={`w-4.5 h-4.5 ${burgerIcon}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer — slides in, always dark-bg so text is readable */}
      <div className={`lg:hidden overflow-hidden transition-all duration-500 ease-in-out
        ${mobileOpen ? 'max-h-[520px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="border-t border-white/10 bg-navy-deep/97 backdrop-blur-sm">
          <nav className="px-6 py-6 flex flex-col gap-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">
            {navLinks.map(({ href, label }) => (
              <a key={href} href={href} onClick={() => setMobileOpen(false)} className="hover:text-white transition-colors">{label}</a>
            ))}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { onLangChange(l.code); setMobileOpen(false); }}
                  lang={l.bcp47}
                  className={`px-2 py-2 border rounded-sm text-left transition-all duration-300
                    ${selectedLang === l.code
                      ? 'bg-white text-navy-deep border-white'
                      : 'border-white/20 text-white/80 hover:border-teal hover:text-white'}`}
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
