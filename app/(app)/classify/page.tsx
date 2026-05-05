'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SpeakerButton from '@/components/SpeakerButton';
import FirstReportLogo from '@/components/FirstReportLogo';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { LANG_BY_CODE, type LangCode, type PersonaId, t } from '@/lib/i18n';
import OfficerPhotoUpload from '@/components/OfficerPhotoUpload';
import LegalDocumentChecklist from '@/components/LegalDocumentChecklist';
import LegalExplainer from '@/components/LegalExplainer';
import EvidencePhotoAudit from '@/components/EvidencePhotoAudit';

function ClassifyContent() {
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
    router.replace(`/classify?lang=${next}&persona=${personaId}`);
  };

  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [classification, setClassification] = useState<any>(null);
  const [summary, setSummary] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [crimeInput, setCrimeInput] = useState<any>(null);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    const classify = async () => {
      const incidentSummary = sessionStorage.getItem('incident_summary') || '';
      const sid = sessionStorage.getItem('current_session_id') || '';
      setSummary(incidentSummary);
      setSessionId(sid);
      try {
        const res = await fetch('/api/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ summary: incidentSummary, language, persona: personaId, sessionId: sid }),
        });
        const data = await res.json();
        if (data.success) {
          setClassification(data.classification);
          setCrimeInput(data.crime_input);
          if (data.sessionId) {
            setSessionId(data.sessionId);
            sessionStorage.setItem('current_session_id', data.sessionId);
          }
          sessionStorage.setItem('classification', JSON.stringify(data.classification));
          sessionStorage.setItem('crime_input', JSON.stringify(data.crime_input));
        } else {
          setError('वर्गीकरण में समस्या हुई।');
        }
      } catch {
        setError('Network error. Please try again.');
      }
      setLoading(false);
    };
    classify();
  }, [language, personaId]);

  const handleConfirm = () => {
    sessionStorage.setItem('classification', JSON.stringify(classification));
    sessionStorage.setItem('crime_input', JSON.stringify(crimeInput));
    router.push(`/documents?lang=${language}&persona=${personaId}`);
  };
  const handleRetry = () => router.push(`/chat?lang=${language}&persona=${personaId}`);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-ivory gap-5">
        <FirstReportLogo size={72} variant="icon" theme="light" />
        <p className="text-sm font-medium text-secondary">Finding applicable section…</p>
        <div className="w-full max-w-md space-y-3 px-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse bg-cool-gray/50 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-ivory gap-5 px-6">
        <div className="fr-card p-5 border-l-4 border-error max-w-sm w-full text-center">
          <p className="text-sm font-medium text-secondary">{error}</p>
        </div>
        <button
          onClick={handleRetry}
          className="fr-btn-primary px-6 py-3 text-sm"
        >
          {t('start', language)} →
        </button>
      </div>
    );
  }

  const isCognizable = classification?.is_cognizable;
  const isLowConfidence = classification?.confidence === 'low';
  const pageText = `धारा ${classification?.bnss_section} BNSS. ${classification?.offense_name_hindi}. ${classification?.rationale_hindi}`;

  return (
    <div className="min-h-screen bg-ivory">
      {/* Breadcrumb / lang switcher strip */}
      <div className="bg-white border-b border-cool-gray">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <span className="section-label">Classification Result</span>
          <div className="flex items-center gap-3">
            <LanguageSwitcher current={language} onChange={handleLanguageChange} compact />
            <a
              href="tel:15100"
              id="nalsa-classify-btn"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-error text-white text-xs font-semibold rounded hover:bg-red-600 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-rec" />
              NALSA · 15100
            </a>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <SpeakerButton text={pageText} language={language} persona={personaId} variant="floating" />

        {/* What you said */}
        <section className="mb-6">
          <p className="section-label mb-2">YOU SAID</p>
          <div className="fr-card p-5">
            <p className="text-base font-medium text-secondary leading-relaxed italic">&ldquo;{summary}&rdquo;</p>
          </div>
        </section>

        {/* Classification card */}
        <section className={`fr-card p-6 mb-6 border-l-4 ${isCognizable ? 'border-l-error' : 'border-l-navy'}`}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <span
              className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full
                ${isCognizable ? 'badge-error' : 'badge-navy'}
              `}
            >
              {isCognizable ? 'COGNIZABLE OFFENCE' : 'NON-COGNIZABLE'}
            </span>
          </div>

          <h2 className="font-serif font-bold text-2xl sm:text-3xl text-navy tracking-tight mb-2">
            {classification?.offense_name_hindi}
          </h2>
          <div className="font-mono text-teal font-semibold text-lg mb-4 tracking-wide">
            BNSS § {classification?.bnss_section}
          </div>

          <p className="text-sm sm:text-base text-secondary leading-relaxed">
            {classification?.rationale_hindi}
          </p>

          {classification?.punishment && (
            <div className="mt-5 pt-4 border-t border-cool-gray/60">
              <span className="section-label block mb-1">PUNISHMENT</span>
              <p className="text-sm text-secondary mt-1">{classification.punishment}</p>
            </div>
          )}

          {isCognizable && (
            <div className="mt-5 p-3.5 severity-critical rounded-md">
              <p className="text-xs font-semibold leading-relaxed text-white">
                Police were legally required to register the FIR.
              </p>
            </div>
          )}

          {/* Legal Explainer — Gemma explains the law in simple Hindi */}
          <LegalExplainer
            bnssSection={classification?.bnss_section}
            offenseName={classification?.offense_name_hindi}
            incident={summary}
            language={language}
            persona={personaId}
          />
        </section>

        {isLowConfidence && (
          <section className="fr-card p-5 mb-6 border-l-4 border-l-warning">
            <div className="font-semibold text-sm text-primary mb-1">⚠ Complex matter</div>
            <p className="text-sm text-secondary mb-4">Confirm with NALSA before proceeding.</p>
            <a
              href="tel:15100"
              className="inline-flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded text-sm font-semibold hover:bg-navy/90 transition-colors"
            >
              📞 NALSA · 15100
            </a>
          </section>
        )}

        {/* Officer Photo Upload — optional, shown after classification */}
        {classification && (
          <OfficerPhotoUpload sessionId={sessionId} language={language} />
        )}

        {/* Evidence Vision Audit — Gemma checks photo quality for court use */}
        {classification && (
          <EvidencePhotoAudit language={language} sessionId={sessionId} />
        )}

        {/* Legal Document Checklist — required vs missing docs for this BNSS offense */}
        {classification && (
          <LegalDocumentChecklist
            bnssSection={classification.bnss_section}
            offenseName={classification.offense_name_hindi}
            incident={summary}
            language={language}
          />
        )}

        <div className="space-y-3">
          {!isLowConfidence && (
            <button
              id="generate-docs-btn"
              onClick={handleConfirm}
              className="fr-btn-primary w-full py-4 text-base"
            >
              ✓ Generate Documents →
            </button>
          )}
          <button
            onClick={handleRetry}
            className="w-full py-3 text-sm font-semibold text-secondary bg-white border border-cool-gray rounded hover:bg-ivory transition-colors"
          >
            ✗ Retry Interview
          </button>
          <a
            href="tel:15100"
            id="nalsa-classify-bottom-btn"
            className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold
                       bg-error/8 text-error border border-error/20 rounded
                       hover:bg-error hover:text-white transition-colors"
          >
            📞 NALSA · 15100
          </a>
        </div>
      </main>
    </div>
  );
}

export default function ClassifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-ivory">
          <FirstReportLogo size={64} variant="icon" theme="light" />
        </div>
      }
    >
      <ClassifyContent />
    </Suspense>
  );
}
