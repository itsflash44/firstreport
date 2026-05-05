'use client';

import { useEffect, useRef, useState } from 'react';
import { LANGUAGES, type LangCode } from '@/lib/i18n';
import { uiStr } from '@/lib/ui-strings';
import SpeakerButton from './SpeakerButton';

interface LanguageSwitcherProps {
  current: LangCode;
  onChange: (next: LangCode) => void;
  /** When true (mobile chat header), use a compact pill with just the script. */
  compact?: boolean;
}

/**
 * Enterprise language switcher — click-based dropdown showing all 11 languages.
 * Used in every in-app header so the user can switch language at any point.
 * Each language option has its own TTS speaker button.
 */
export default function LanguageSwitcher({ current, onChange, compact = false }: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const cur = LANGUAGES.find((l) => l.code === current) ?? LANGUAGES[0];

  // Outside-click dismiss
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={uiStr('changeLanguage', current)}
        title={uiStr('changeLanguage', current)}
        aria-expanded={open}
        className={`
          ${compact ? 'h-9 px-2.5 gap-1.5' : 'h-9 px-3 gap-2'}
          flex items-center rounded-sm border border-cool-gray bg-white
          text-navy font-mono text-xs tracking-widest uppercase
          hover:border-teal hover:bg-teal/5
          transition-colors duration-150
        `}
      >
        <span lang={cur.bcp47} className="font-serif text-base leading-none">{cur.label}</span>
        {!compact && (
          <span className="text-[10px] tracking-[0.2em] text-secondary">{cur.code}</span>
        )}
        <svg
          className={`w-3 h-3 text-secondary transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 z-50
                     bg-white border border-cool-gray rounded-md shadow-lg
                     w-64 max-h-[70vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-cool-gray bg-ivory">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-secondary">
              {uiStr('changeLanguage', current)}
            </span>
          </div>

          {/* Language list */}
          <ul className="py-1">
            {LANGUAGES.map((l) => {
              const active = l.code === current;
              return (
                <li key={l.code}>
                  {/* div role="button" avoids nesting <button> inside <button> (SpeakerButton is a button) */}
                  <div
                    role="button"
                    tabIndex={0}
                    lang={l.bcp47}
                    onClick={() => { onChange(l.code); setOpen(false); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(l.code); setOpen(false); } }}
                    className={`
                      w-full flex items-center justify-between gap-2 px-3 py-2.5
                      cursor-pointer select-none transition-colors duration-100
                      ${active
                        ? 'bg-navy text-white'
                        : 'text-navy hover:bg-ivory hover:text-navy'}
                    `}
                  >
                    <span className="flex items-center gap-2.5 min-w-0 pointer-events-none">
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-teal shrink-0" />}
                      <span className="font-serif text-xl leading-none shrink-0">{l.label}</span>
                      <span className={`font-mono text-[10px] uppercase tracking-widest truncate ${active ? 'text-white/65' : 'text-secondary'}`}>
                        {l.sublabel}
                      </span>
                    </span>
                    {/* Per-language speaker — stop propagation so click doesn't select language */}
                    <span onClick={(e) => e.stopPropagation()} className="shrink-0">
                      <SpeakerButton
                        text={l.sublabel}
                        language={l.code}
                        variant="mini"
                      />
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
