'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import FirstReportLogo from '@/components/FirstReportLogo';
import SpeakerButton from '@/components/SpeakerButton';
import { LANG_BY_CODE } from '@/lib/i18n';
import { PERSONA_BY_ID } from '@/lib/personas';
import { getHistoryEntry, type HistoryEntry } from '@/lib/history';

// Document types available from any session
const DOC_TYPES = [
  { key: 'sp',              label: 'SP Complaint',     subtitle: 'BNSS §173 / §175',              unlockDays: 0  },
  { key: 'dm',              label: 'DM Petition',      subtitle: 'District Magistrate — day +3',  unlockDays: 3  },
  { key: 'hc',              label: 'HC Writ',          subtitle: 'Article 226 — day +18',         unlockDays: 18 },
  { key: 'officer',         label: 'Officer Acct.',    subtitle: 'BNSS §166 accountability',       unlockDays: 0  },
];

const SEVERITY_META: Record<string, { label: string; bg: string; text: string }> = {
  normal:   { label: 'NORMAL',   bg: 'rgba(15,31,61,0.06)',   text: '#0F1F3D' },
  serious:  { label: 'SERIOUS',  bg: 'rgba(240,173,78,0.12)', text: '#B7760D' },
  critical: { label: 'CRITICAL', bg: 'rgba(217,83,79,0.12)',  text: '#C0392B' },
};

function SessionContent() {
  const { id }    = useParams<{ id: string }>();
  const router    = useRouter();
  const [entry, setEntry] = useState<HistoryEntry | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const found = getHistoryEntry(id);
    if (found) {
      setEntry(found);
      if (typeof document !== 'undefined') document.documentElement.lang = found.language;
    } else {
      setNotFound(true);
    }
  }, [id]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-ivory flex flex-col items-center justify-center gap-4 px-6">
        <FirstReportLogo size={64} variant="icon" theme="light" />
        <p className="text-base text-secondary font-medium text-center">Session not found on this device.</p>
        <Link href="/history" className="text-sm font-semibold text-teal hover:underline">← Back to history</Link>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <FirstReportLogo size={64} variant="icon" theme="light" />
      </div>
    );
  }

  const persona   = PERSONA_BY_ID[entry.personaId] ?? PERSONA_BY_ID.standard;
  const langCfg   = LANG_BY_CODE[entry.language];
  const sevMeta   = SEVERITY_META[entry.severity] ?? SEVERITY_META.normal;
  const fmtDate   = (ts: number) =>
    new Date(ts).toLocaleString(entry.language, {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="min-h-screen bg-ivory">

      {/* ── TOP BAR ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white border-b border-cool-gray">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-navy-deep transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            History
          </button>
          <span className="section-label">Session Replay</span>
          <a
            href="tel:15100"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-error text-white text-xs font-semibold rounded hover:bg-red-600 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            NALSA · 15100
          </a>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── SESSION HEADER CARD ────────────────────────────────── */}
        <div className="fr-card overflow-hidden">
          {/* Gold+teal accent bar */}
          <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #B8962E 0%, #5FA8A0 100%)' }} />
          <div className="p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold rounded"
                    style={{ background: sevMeta.bg, color: sevMeta.text }}
                  >
                    {sevMeta.label}
                  </span>
                  {entry.bnssSection && (
                    <span className="font-mono text-xs font-semibold" style={{ color: '#5FA8A0' }}>
                      BNSS § {entry.bnssSection}
                    </span>
                  )}
                </div>
                <h1 lang={entry.language} className="font-serif font-bold text-2xl sm:text-3xl text-navy-deep leading-snug">
                  {persona.titleEn}
                  <span className="text-base font-normal text-secondary ml-2 font-sans">
                    · {persona.titleHi}
                  </span>
                </h1>
                <p className="text-xs text-muted mt-1 font-mono">
                  {fmtDate(entry.ts)} · {langCfg?.label ?? entry.language} · {langCfg?.sublabel}
                </p>
              </div>
              <SpeakerButton text={entry.summary} language={entry.language} variant="inline" />
            </div>

            {/* Incident summary */}
            <div className="p-4 rounded-sm border border-cool-gray bg-ivory">
              <div className="authority-strip mb-2">Incident Summary</div>
              <p lang={entry.language} className="text-sm text-navy-deep leading-relaxed">
                &ldquo;{entry.summary}&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* ── FULL CONVERSATION ──────────────────────────────────── */}
        {entry.transcript && entry.transcript.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-px bg-teal/40" />
              <span className="authority-strip">Full Conversation · {entry.transcript.length} turns</span>
            </div>

            <div className="space-y-3">
              {entry.transcript.map((turn, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2 ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {turn.role === 'ai' && (
                    <div className="shrink-0 w-8 h-8 rounded-sm flex items-center justify-center mt-0.5"
                         style={{ background: 'rgba(15,31,61,0.07)' }}>
                      <FirstReportLogo size={18} variant="icon" theme="light" />
                    </div>
                  )}

                  <div
                    className="max-w-[82%] rounded-sm px-4 py-3 text-sm leading-relaxed"
                    style={turn.role === 'user'
                      ? { background: '#0F1F3D', color: '#ffffff' }
                      : { background: '#ffffff', border: '1px solid #D9E2EC', color: '#0F1F3D' }}
                  >
                    <p lang={entry.language}>{turn.text}</p>
                  </div>

                  {turn.role === 'ai' && (
                    <div className="shrink-0 mt-1">
                      <SpeakerButton text={turn.text} language={entry.language} variant="mini" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── DOCUMENTS PANEL ────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-teal/40" />
            <span className="authority-strip">
              {entry.sessionId ? 'Generated Documents' : 'Documents'}
            </span>
          </div>

          {entry.sessionId ? (
            <div className="fr-card overflow-hidden">
              <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #5FA8A0 0%, #B8962E 100%)' }} />
              <div className="p-5 space-y-3">
                {DOC_TYPES.map((doc) => (
                  <div key={doc.key}
                       className="flex items-center justify-between gap-4 py-2 border-b border-cool-gray last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-navy-deep">{doc.label}</div>
                      <div className="text-xs text-secondary">{doc.subtitle}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {doc.unlockDays > 0 && (
                        <span className="font-mono text-[10px] text-muted">+{doc.unlockDays}d</span>
                      )}
                      <a
                        href={`/api/documents/${entry.sessionId}/${doc.key}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors"
                        style={{ background: '#0F1F3D', color: '#ffffff' }}
                      >
                        View PDF
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="fr-card p-6 text-center">
              <p className="text-sm text-secondary">
                Documents are only accessible from the device where they were generated.
              </p>
              <a
                href="/home"
                className="inline-block mt-4 px-5 py-2 text-xs font-semibold rounded-sm transition-colors"
                style={{ background: '#5FA8A0', color: '#ffffff' }}
              >
                Start a new case →
              </a>
            </div>
          )}
        </section>

        {/* ── NALSA FOOTER ───────────────────────────────────────── */}
        <div className="pb-8">
          <a
            href="tel:15100"
            className="flex items-center justify-center gap-2.5 w-full py-3.5 border border-red-200 rounded-sm
                       text-sm font-semibold transition-all duration-300 hover:bg-red-50"
            style={{ color: '#D9534F' }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60"/>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"/>
            </span>
            NALSA Free Legal Aid · 15100
          </a>
        </div>

      </main>
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <FirstReportLogo size={64} variant="icon" theme="light" />
      </div>
    }>
      <SessionContent />
    </Suspense>
  );
}
