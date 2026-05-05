'use client';

import { useState, useEffect } from 'react';

interface ChecklistItem {
  name_hindi: string;
  name_english: string;
  is_present: boolean;
  importance: 'required' | 'recommended';
  tip_hindi?: string | null;
}

interface Verification {
  bnss_section: string;
  offense_name_hindi: string;
  required_docs: ChecklistItem[];
  missing_count: number;
  summary_hindi: string;
  summary_english: string;
}

interface Props {
  bnssSection: string;
  offenseName: string;
  incident: string;
  language?: string;
}

/**
 * LegalDocumentChecklist
 * ─────────────────────
 * Calls /api/verify-docs after classification and shows a bilingual
 * required-vs-missing document checklist so the victim knows exactly
 * what supporting evidence to gather before submitting to the SP/DM/HC.
 *
 * Completely optional — if the API fails the component hides itself.
 */
export default function LegalDocumentChecklist({
  bnssSection,
  offenseName,
  incident,
  language = 'hi-IN',
}: Props) {
  const [loading, setLoading]             = useState(true);
  const [verification, setVerification]   = useState<Verification | null>(null);
  const [expanded, setExpanded]           = useState(false);

  const isHindi = language === 'hi-IN';

  useEffect(() => {
    if (!bnssSection || !incident) { setLoading(false); return; }

    const run = async () => {
      try {
        const res = await fetch('/api/verify-docs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bnss_section:  bnssSection,
            offense_name:  offenseName,
            incident,
            existing_docs: [],
          }),
        });
        const data = await res.json();
        if (data.success && data.verification) {
          setVerification(data.verification);
          setExpanded(data.verification.missing_count > 0);
        }
      } catch {
        // silent fail — checklist is optional
      }
      setLoading(false);
    };
    run();
  }, [bnssSection, offenseName, incident]);

  if (loading) {
    return (
      <div className="mt-6 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-secondary">
            {isHindi ? 'दस्तावेज़ जाँच' : 'Document Check'}
          </span>
          <div className="flex-1 h-px bg-cool-gray/60" />
        </div>
        <div className="h-10 animate-pulse bg-cool-gray/40 rounded-md" />
      </div>
    );
  }

  if (!verification) return null;

  const { required_docs, missing_count, summary_hindi, summary_english } = verification;
  const required = required_docs.filter(d => d.importance === 'required');
  const recommended = required_docs.filter(d => d.importance === 'recommended');

  return (
    <div className="mt-6 space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-secondary">
          {isHindi ? 'आवश्यक दस्तावेज़' : 'Required Documents'}
        </span>
        <div className="flex-1 h-px bg-cool-gray/60" />
      </div>

      {/* Summary banner */}
      <button
        onClick={() => setExpanded(e => !e)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded border text-left transition-colors
          ${missing_count === 0
            ? 'bg-teal/8 border-teal/20 text-teal'
            : 'bg-warning/8 border-warning/30 text-primary'
          }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{missing_count === 0 ? '✓' : '⚠'}</span>
          <span className="text-sm font-medium leading-snug">
            {isHindi ? summary_hindi : summary_english}
          </span>
        </div>
        <span className="text-xs font-semibold ml-3 shrink-0">
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {/* Expandable checklist */}
      {expanded && (
        <div className="space-y-2">
          {/* Required docs */}
          {required.map((doc, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 px-4 py-3 rounded border
                ${doc.is_present
                  ? 'bg-teal/5 border-teal/20'
                  : 'bg-error/5 border-error/20'
                }`}
            >
              {/* Checkbox indicator */}
              <div className={`mt-0.5 w-5 h-5 shrink-0 rounded flex items-center justify-center text-xs font-bold
                ${doc.is_present ? 'bg-teal text-white' : 'bg-white border-2 border-error text-error'}`}
              >
                {doc.is_present ? '✓' : '✕'}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-navy leading-tight">
                  {isHindi ? doc.name_hindi : doc.name_english}
                </p>
                {!isHindi && (
                  <p className="text-xs text-muted mt-0.5">{doc.name_hindi}</p>
                )}
                {!doc.is_present && doc.tip_hindi && (
                  <p className="text-xs text-secondary mt-1 leading-relaxed">
                    💡 {isHindi ? doc.tip_hindi : doc.tip_hindi}
                  </p>
                )}
              </div>

              <span className={`text-xs font-semibold uppercase shrink-0
                ${doc.importance === 'required' ? 'text-error' : 'text-secondary'}`}
              >
                {doc.importance === 'required'
                  ? (isHindi ? 'ज़रूरी' : 'Required')
                  : (isHindi ? 'सुझाव' : 'Recommended')}
              </span>
            </div>
          ))}

          {/* Recommended docs (if any) */}
          {recommended.length > 0 && (
            <>
              <p className="text-xs font-semibold uppercase tracking-widest text-secondary pt-1">
                {isHindi ? 'सुझाए गए दस्तावेज़' : 'Recommended'}
              </p>
              {recommended.map((doc, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 px-4 py-3 rounded border
                    ${doc.is_present
                      ? 'bg-teal/5 border-teal/20'
                      : 'bg-cool-gray/20 border-cool-gray/50'
                    }`}
                >
                  <div className={`mt-0.5 w-5 h-5 shrink-0 rounded flex items-center justify-center text-xs font-bold
                    ${doc.is_present ? 'bg-teal text-white' : 'bg-white border border-cool-gray text-secondary'}`}
                  >
                    {doc.is_present ? '✓' : '○'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-navy leading-tight">
                      {isHindi ? doc.name_hindi : doc.name_english}
                    </p>
                    {!doc.is_present && doc.tip_hindi && (
                      <p className="text-xs text-secondary mt-1">💡 {doc.tip_hindi}</p>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* NALSA nudge when items missing */}
          {missing_count > 0 && (
            <a
              href="tel:15100"
              className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold
                         bg-error/8 text-error border border-error/20 rounded
                         hover:bg-error hover:text-white transition-colors"
            >
              📞 {isHindi
                ? 'दस्तावेज़ इकट्ठा करने में मदद चाहिए? NALSA · 15100'
                : 'Need help gathering documents? NALSA · 15100'}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
