'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DocumentCard from '@/components/DocumentCard';
import SpeakerButton from '@/components/SpeakerButton';
import FirstReportLogo from '@/components/FirstReportLogo';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { LANG_BY_CODE, type LangCode, type PersonaId, LEGAL_DISCLAIMER } from '@/lib/i18n';

const LETTER_TYPES = [
  { key: 'SP',      title: 'SP COMPLAINT',     subtitle: 'BNSS §173 / §175 — Police Superintendent', color: 'red'    as const, status: 'ready'  as const, unlockDays: 0  },
  { key: 'DM',      title: 'DM PETITION',      subtitle: 'District Magistrate — escalation, day +3', color: 'blue'   as const, status: 'locked' as const, unlockDays: 3  },
  { key: 'HC',      title: 'HC WRIT',          subtitle: 'High Court — Article 226 of the Constitution', color: 'yellow' as const, status: 'locked' as const, unlockDays: 18 },
  { key: 'OFFICER', title: 'OFFICER ACCT.',    subtitle: 'BNSS §166 — accountability against the officer', color: 'red'    as const, status: 'ready'  as const, unlockDays: 0  },
];

function DocumentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawLang = searchParams.get('lang');
  const language: LangCode =
    rawLang && (LANG_BY_CODE as Record<string, unknown>)[rawLang]
      ? (rawLang as LangCode)
      : 'hi-IN';
  const personaId = (searchParams.get('persona') as PersonaId) || 'standard';

  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.lang = language;
  }, [language]);

  const handleLanguageChange = (next: LangCode) => {
    router.replace(`/documents?lang=${next}&persona=${personaId}`);
  };

  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState('');
  const [, setPdfs] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    generateDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateDocuments = async () => {
    const classification = JSON.parse(sessionStorage.getItem('classification') || '{}');
    const crimeInput = JSON.parse(sessionStorage.getItem('crime_input') || '{}');
    const transcript = sessionStorage.getItem('incident_summary') || '';

    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, crime_input: crimeInput, classification, lang_code: language }),
      });
      const data = await res.json();
      if (data.success) {
        setSessionId(data.session_id);
        setPdfs(data.paths || {});
      }
    } catch {
      /* offline — queued */
    }
    setLoading(false);
  };

  const handleDownload = async (letterType: string) => {
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, letter_type: letterType, language }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FirstReport_${letterType}_${sessionId.slice(0, 8)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      flash('Download failed.');
    }
  };

  const handleShare = async (letterType: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `FirstReport — ${letterType}`,
          text: 'FirstReport AI-prepared legal document',
          url: window.location.href,
        });
      } catch { /* user cancelled */ }
    }
  };

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleSendTelegram = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch('/api/send-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          victim_name: JSON.parse(sessionStorage.getItem('crime_input') || '{}').victim_name || 'Victim',
        }),
      });
      const data = await res.json();
      flash(data.success && data.all_sent ? '✓ Sent on Telegram' : 'Queued offline — will send when online');
    } catch {
      flash('Queued offline — will send when online');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-off-white gap-5">
        <FirstReportLogo size={72} variant="icon" theme="light" />
        <p className="text-sm font-medium text-secondary">Preparing documents…</p>
        <div className="w-full max-w-md space-y-3 px-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse bg-cool-gray/50 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white">
      {/* Section breadcrumb / lang bar */}
      <div className="bg-white border-b border-cool-gray">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <span className="section-label">Your Documents</span>
          <div className="flex items-center gap-3">
            <LanguageSwitcher current={language} onChange={handleLanguageChange} compact />
            <a
              href="tel:15100"
              id="nalsa-docs-btn"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-error text-white text-xs font-semibold rounded hover:bg-red-600 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-rec" />
              NALSA · 15100
            </a>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* HERO */}
        <div className="mb-8">
          <span className="badge-success inline-flex items-center px-3 py-1 text-xs font-semibold mb-3">
            4 documents · ready to send
          </span>
          <h1 className="font-serif font-bold text-navy text-3xl sm:text-4xl tracking-tight">
            Your Documents Are Ready
          </h1>
        </div>

        {/* TIMELINE */}
        <div className="fr-card p-5 mb-8">
          <p className="section-label mb-4">Escalation Timeline</p>
          <div className="flex items-center justify-between gap-2">
            {[
              { n: 1, label: 'SP',  day: 'TODAY', active: true },
              { n: 2, label: 'DM',  day: '+3 d',  active: false },
              { n: 3, label: 'HC',  day: '+18 d', active: false },
            ].map((s, i, arr) => (
              <div key={s.n} className="flex-1 flex items-center">
                <div className="flex flex-col items-center text-center w-full">
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm
                    ${s.active ? 'bg-teal text-white shadow-sm' : 'bg-cool-gray text-muted'}
                  `}>
                    {s.n}
                  </span>
                  <span className="text-xs font-semibold text-navy mt-2">{s.label}</span>
                  <span className="text-[10px] text-muted">{s.day}</span>
                </div>
                {i < arr.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${s.active ? 'bg-teal' : 'bg-cool-gray'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* DOCUMENTS GRID */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {LETTER_TYPES.map((letter) => (
            <DocumentCard
              key={letter.key}
              title={letter.title}
              subtitle={letter.subtitle}
              status={letter.status}
              unlockDays={letter.unlockDays}
              color={letter.color}
              language={language}
              onDownload={() => handleDownload(letter.key)}
              onShare={() => handleShare(letter.key)}
            />
          ))}
        </div>

        {/* SEND ALL */}
        <button
          id="send-telegram-btn"
          onClick={handleSendTelegram}
          className="fr-btn-teal w-full py-4 text-base font-semibold"
        >
          → Send All via Telegram
        </button>

        {/* DISCLAIMER */}
        <div className="mt-6 p-4 bg-warning/8 border border-warning/30 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-warning" />
            <span className="section-label">Disclaimer</span>
          </div>
          <p className="text-sm text-secondary leading-relaxed">
            {LEGAL_DISCLAIMER[language]}
          </p>
        </div>

        <SpeakerButton
          text={LEGAL_DISCLAIMER[language]}
          language={language}
          persona={personaId}
          variant="floating"
        />

        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-navy text-white rounded-md shadow-lg font-medium text-sm animate-pop-in">
            {toast}
          </div>
        )}
      </main>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-off-white">
          <FirstReportLogo size={64} variant="icon" theme="light" />
        </div>
      }
    >
      <DocumentsContent />
    </Suspense>
  );
}
