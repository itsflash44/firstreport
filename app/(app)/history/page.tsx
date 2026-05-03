'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FirstReportLogo from '@/components/FirstReportLogo';
import SpeakerButton from '@/components/SpeakerButton';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { LANG_BY_CODE, t, type LangCode } from '@/lib/i18n';
import { PERSONA_BY_ID } from '@/lib/personas';
import { readHistory, deleteHistoryEntry, type HistoryEntry } from '@/lib/history';

const SEVERITY_STYLE: Record<string, { label: string; cls: string }> = {
  normal:   { label: 'NORMAL',   cls: 'badge-navy' },
  serious:  { label: 'SERIOUS',  cls: 'badge-warning' },
  critical: { label: 'CRITICAL', cls: 'badge-error' },
};
const SEVERITY_BORDER: Record<string, string> = {
  normal:   'border-l-navy',
  serious:  'border-l-warning',
  critical: 'border-l-error',
};

function HistoryContent() {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const rawLang       = searchParams.get('lang');
  const language: LangCode =
    rawLang && (LANG_BY_CODE as Record<string, unknown>)[rawLang]
      ? (rawLang as LangCode) : 'hi-IN';

  const [entries,    setEntries]    = useState<HistoryEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setEntries(readHistory());
    if (typeof document !== 'undefined') document.documentElement.lang = language;
  }, [language]);

  const handleLanguageChange = (next: LangCode) => router.replace(`/history?lang=${next}`);

  const handleDelete = (id: string) => {
    deleteHistoryEntry(id);
    setEntries(readHistory());
    if (expandedId === id) setExpandedId(null);
  };

  const fmtDate = (ts: number) =>
    new Date(ts).toLocaleString(language, {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="min-h-screen bg-off-white">
      {/* Top bar */}
      <div className="bg-white border-b border-cool-gray">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <span className="section-label">Past Consultations · {entries.length}</span>
          <div className="flex items-center gap-3">
            <LanguageSwitcher current={language} onChange={handleLanguageChange} compact />
            <a
              href="tel:15100"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-error text-white text-xs font-semibold rounded hover:bg-red-600 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-rec" />
              NALSA · 15100
            </a>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8">
          <h1 lang={language} className="font-serif font-bold text-navy text-3xl sm:text-4xl tracking-tight">
            {t('history', language)}
          </h1>
          <p className="text-sm text-muted mt-1">Local · Offline · {entries.length} entries</p>
        </div>

        {entries.length === 0 ? (
          <div className="fr-card p-12 text-center">
            <FirstReportLogo size={60} variant="icon" theme="light" />
            <p lang={language} className="mt-5 text-base font-medium text-secondary">
              {t('noHistory', language)}
            </p>
            <button
              onClick={() => router.push('/home')}
              className="fr-btn-primary mt-5 px-6 py-2.5 text-sm"
            >
              {t('start', language)} →
            </button>
          </div>
        ) : (
          <ul className="space-y-4">
            {entries.map((e) => {
              const persona   = PERSONA_BY_ID[e.personaId] ?? PERSONA_BY_ID.standard;
              const langCfg   = LANG_BY_CODE[e.language];
              const severity  = SEVERITY_STYLE[e.severity] ?? SEVERITY_STYLE.normal;
              const borderCls = SEVERITY_BORDER[e.severity] ?? 'border-l-navy';
              const isOpen    = expandedId === e.id;

              return (
                <li key={e.id} className={`fr-card border-l-4 ${borderCls} overflow-hidden`}>
                  {/* Card header — always visible */}
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="shrink-0 w-10 h-10 rounded-md bg-navy/10 text-navy flex items-center justify-center font-bold text-base">
                        §
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-navy truncate">{persona.titleEn}</div>
                        <div className="text-[11px] text-muted mt-0.5">
                          {fmtDate(e.ts)} · {langCfg?.label ?? e.language}
                        </div>
                      </div>
                      <SpeakerButton
                        text={e.summary}
                        language={e.language}
                        persona={e.personaId}
                        variant="mini"
                      />
                    </div>

                    <p lang={e.language} className="text-sm text-secondary leading-snug line-clamp-3">
                      &ldquo;{e.summary}&rdquo;
                    </p>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-cool-gray/60 gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold ${severity.cls}`}>
                        {severity.label}
                      </span>
                      {e.bnssSection && (
                        <span className="font-mono text-xs text-teal font-semibold">BNSS § {e.bnssSection}</span>
                      )}

                      {/* Expand transcript button — only if transcript exists */}
                      {e.transcript && e.transcript.length > 0 && (
                        <button
                          onClick={() => setExpandedId(isOpen ? null : e.id)}
                          className="flex items-center gap-1 text-xs font-semibold text-teal hover:text-navy transition-colors"
                        >
                          <svg
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                            fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                          {isOpen ? 'Hide' : 'Full chat'}
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(e.id)}
                        aria-label="Delete"
                        className="w-7 h-7 rounded flex items-center justify-center text-muted hover:text-error hover:bg-error/10 transition-colors ml-auto"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Transcript panel — expanded */}
                  {isOpen && e.transcript && (
                    <div className="border-t border-cool-gray bg-off-white px-5 py-4 space-y-3 max-h-96 overflow-y-auto">
                      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-secondary mb-3">
                        Full conversation · {e.transcript.length} turns
                      </div>
                      {e.transcript.map((turn, idx) => (
                        <div
                          key={idx}
                          className={`flex gap-2 ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {turn.role === 'ai' && (
                            <div className="shrink-0 w-6 h-6 rounded-sm bg-navy/10 flex items-center justify-center mt-0.5">
                              <FirstReportLogo size={14} variant="icon" theme="light" />
                            </div>
                          )}
                          <div className={`max-w-[80%] rounded-md px-3 py-2 text-sm leading-relaxed
                            ${turn.role === 'user'
                              ? 'bg-navy text-white'
                              : 'bg-white border border-cool-gray text-navy'}`}
                          >
                            <p lang={e.language}>{turn.text}</p>
                          </div>
                          {turn.role === 'ai' && (
                            <span className="shrink-0 mt-1">
                              <SpeakerButton text={turn.text} language={e.language} variant="mini" />
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-off-white">
        <FirstReportLogo size={64} variant="icon" theme="light" />
      </div>
    }>
      <HistoryContent />
    </Suspense>
  );
}
