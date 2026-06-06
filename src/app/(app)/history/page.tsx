'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigationWithQuery } from '@/lib/useNavigationWithQuery';
import FirstReportLogo from '@/components/FirstReportLogo';
import SpeakerButton from '@/components/chat/SpeakerButton';
import AgentAvatar from '@/components/chat/AgentAvatar';
import { LANG_BY_CODE, t } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageContext';
import { PERSONA_BY_ID } from '@/lib/personas';
import { readJourney, deleteLegalCase, type LegalCase } from '@/lib/legalJourney';

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
const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  active:    { label: 'Active',    cls: 'badge-teal' },
  pending:   { label: 'Pending',   cls: 'badge-warning' },
  escalated: { label: 'Escalated', cls: 'badge-error' },
  resolved:  { label: 'Resolved',  cls: 'badge-success' },
  archived:  { label: 'Archived',  cls: 'badge-navy' },
};

function HistoryContent() {
  const router              = useNavigationWithQuery();
  const { lang: language }  = useLanguage();
  const [cases, setCases]   = useState<LegalCase[]>([]);

  useEffect(() => {
    // Read all legal cases from the journey store (localStorage fr_legal_journey)
    const all = readJourney().sort((a, b) => b.updatedAt - a.updatedAt);
    setCases(all);
    if (typeof document !== 'undefined') document.documentElement.lang = language;
  }, [language]);

  const handleDelete = (id: string) => {
    deleteLegalCase(id);
    setCases(readJourney().sort((a, b) => b.updatedAt - a.updatedAt));
  };

  const fmtDate = (ts: number) =>
    new Date(ts).toLocaleString(language, {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const totalDocs = cases.reduce((sum, c) => sum + (c.documentsGenerated?.length ?? 0), 0);

  return (
    <div className="min-h-screen bg-ivory">
      {/* Top bar */}
      <div className="bg-white border-b border-cool-gray">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="section-label">{t('history', language)}</span>
            <span className="text-[10px] font-mono text-muted">{cases.length} {language === 'hi-IN' ? 'केस' : 'cases'} · {totalDocs} {language === 'hi-IN' ? 'दस्तावेज़' : 'docs'}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/home')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal text-white text-xs font-semibold rounded-sm hover:bg-teal-dark transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {language === 'hi-IN' ? 'नया केस' : 'New Case'}
            </button>
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
        <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 lang={language} className="font-serif font-bold text-navy text-3xl sm:text-4xl tracking-tight">
              {t('history', language)}
            </h1>
            <p className="text-sm text-muted mt-1">
              {language === 'hi-IN'
                ? `${cases.length} केस · ऑफलाइन सुरक्षित`
                : `${cases.length} case${cases.length !== 1 ? 's' : ''} · Saved offline`}
            </p>
          </div>
          {/* Mobile new case button */}
          <button
            onClick={() => router.push('/home')}
            className="sm:hidden inline-flex items-center gap-1.5 px-4 py-2 bg-teal text-white text-xs font-semibold rounded-sm hover:bg-teal-dark transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {language === 'hi-IN' ? 'नया केस' : 'New Case'}
          </button>
        </div>

        {cases.length === 0 ? (
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
            {cases.map((c) => {
              const persona    = PERSONA_BY_ID[c.personaId] ?? PERSONA_BY_ID.standard;
              const langCfg    = LANG_BY_CODE[c.language];
              const severity   = SEVERITY_STYLE[c.severity] ?? SEVERITY_STYLE.normal;
              const status     = STATUS_BADGE[c.status] ?? STATUS_BADGE.active;
              const borderCls  = SEVERITY_BORDER[c.severity] ?? 'border-l-navy';
              const docCount   = c.documentsGenerated?.length ?? 0;
              const hasConvs   = (c.conversations?.length ?? 0) > 0;
              const summary    = c.title || c.incidentSummary?.slice(0, 120) || (language === 'hi-IN' ? 'नया केस' : 'New case');

              return (
                <li
                  key={c.id}
                  className={`fr-card border-l-4 ${borderCls} overflow-hidden cursor-pointer`}
                  onClick={() => router.push(`/case/${c.id}`)}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      {/* Persona avatar */}
                      <div className="shrink-0">
                        <AgentAvatar persona={persona} compact />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-navy">{persona.titleEn}</span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${status.cls}`}>
                            {status.label}
                          </span>
                          {c.bnssSection && (
                            <span className="font-mono text-[10px] text-teal font-semibold">BNSS § {c.bnssSection}</span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted mt-0.5">
                          {fmtDate(c.updatedAt)} · {langCfg?.label ?? c.language}
                          {docCount > 0 && (
                            <span className="ml-2 text-teal font-semibold">
                              · {docCount} {language === 'hi-IN' ? 'दस्तावेज़' : `doc${docCount !== 1 ? 's' : ''}`}
                            </span>
                          )}
                        </div>
                      </div>

                      <SpeakerButton
                        text={summary}
                        language={c.language}
                        persona={c.personaId}
                        variant="mini"
                      />
                    </div>

                    <p lang={c.language} className="text-sm text-secondary leading-snug line-clamp-2">
                      {c.incidentSummary
                        ? <>&ldquo;{c.incidentSummary}&rdquo;</>
                        : <span className="italic text-muted">{language === 'hi-IN' ? 'कोई सारांश नहीं' : 'No summary yet — case just started'}</span>
                      }
                    </p>

                    {/* Statute chips */}
                    {c.statutesCited && c.statutesCited.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {c.statutesCited.slice(0, 4).map((s) => (
                          <span key={s} className="citation-chip citation-chip-light text-[8px]">{s}</span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-cool-gray/60 gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold ${severity.cls}`}>
                        {severity.label}
                      </span>

                      {/* Conversation count indicator */}
                      {hasConvs && (
                        <span className="flex items-center gap-1 text-[10px] text-muted">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {c.conversations?.length} {language === 'hi-IN' ? 'बातचीत' : 'conv.'}
                        </span>
                      )}

                      {/* Open case button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/case/${c.id}`); }}
                        className="flex items-center gap-1 text-xs font-semibold text-teal hover:text-navy-deep transition-colors ml-auto"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                        {language === 'hi-IN' ? 'केस खोलें' : 'Open case'}
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                        aria-label="Delete case"
                        className="w-7 h-7 rounded flex items-center justify-center text-muted hover:text-error hover:bg-error/10 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
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
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <FirstReportLogo size={64} variant="icon" theme="light" />
      </div>
    }>
      <HistoryContent />
    </Suspense>
  );
}
