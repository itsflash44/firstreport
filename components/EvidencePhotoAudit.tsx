'use client';

import { useState, useRef } from 'react';

interface AuditResult {
  overall_quality: 'good' | 'acceptable' | 'retake';
  clarity_score: number;
  lighting_score: number;
  angle_score: number;
  feedback_hindi: string;
  feedback_english: string;
  action_hint_hindi: string;
  is_usable: boolean;
}

interface Props {
  language?: string;
  sessionId?: string;
}

const QUALITY_STYLES: Record<string, { border: string; bg: string; badge: string; icon: string }> = {
  good:       { border: 'border-teal/30',    bg: 'bg-teal/5',    badge: 'bg-teal text-white',       icon: '✓' },
  acceptable: { border: 'border-warning/30', bg: 'bg-warning/5', badge: 'bg-warning text-white',    icon: '~' },
  retake:     { border: 'border-error/30',   bg: 'bg-error/5',   badge: 'bg-error text-white',      icon: '✕' },
};

function ScoreDots({ score }: { score: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <div key={i} className={`w-2 h-2 rounded-full ${i <= score ? 'bg-navy' : 'bg-cool-gray'}`} />
      ))}
    </div>
  );
}

/**
 * EvidencePhotoAudit — Gemma Vision evidence quality checker
 * ──────────────────────────────────────────────────────────
 * Lets the victim upload a photo of any evidence (injury, document,
 * location). Gemma 4 Vision scores it on clarity, lighting, and angle,
 * and tells the victim in simple Hindi whether it's court-ready or
 * needs to be retaken.
 */
export default function EvidencePhotoAudit({ language = 'hi-IN', sessionId }: Props) {
  const [loading, setLoading]   = useState(false);
  const [audit, setAudit]       = useState<AuditResult | null>(null);
  const [preview, setPreview]   = useState<string | null>(null);
  const [error, setError]       = useState('');
  const fileRef                 = useRef<HTMLInputElement>(null);

  const isHindi = language === 'hi-IN';

  const handleFile = async (file: File) => {
    if (!file) return;
    setLoading(true);
    setError('');
    setAudit(null);
    setPreview(URL.createObjectURL(file));

    try {
      const fd = new FormData();
      fd.append('image', file);
      if (sessionId) fd.append('session_id', sessionId);

      const res = await fetch('/api/audit-evidence', { method: 'POST', body: fd });
      const data = await res.json();

      if (data.success && data.audit) {
        setAudit(data.audit);
      } else {
        setError(isHindi ? 'फ़ोटो की जाँच नहीं हो सकी।' : 'Could not audit photo.');
      }
    } catch {
      setError(isHindi ? 'नेटवर्क समस्या। फिर कोशिश करें।' : 'Network error. Retry.');
    }
    setLoading(false);
  };

  const reset = () => {
    setAudit(null);
    setPreview(null);
    setError('');
  };

  const style = audit ? QUALITY_STYLES[audit.overall_quality] ?? QUALITY_STYLES.acceptable : null;

  return (
    <div className="mt-6 space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-secondary">
          {isHindi ? 'साक्ष्य फ़ोटो जाँच (वैकल्पिक)' : 'Evidence Photo Audit (Optional)'}
        </span>
        <div className="flex-1 h-px bg-cool-gray/60" />
      </div>

      <p className="text-xs text-muted">
        {isHindi
          ? 'चोट, दस्तावेज़, या घटनास्थल की फ़ोटो अपलोड करें — Gemma बताएगा कि यह अदालत के लिए काफ़ी है या नहीं।'
          : 'Upload a photo of injury, document, or scene — Gemma 4 Vision will check if it\'s court-ready.'}
      </p>

      {/* Upload area — only show when no audit yet */}
      {!audit && (
        <label className="flex flex-col items-center justify-center gap-2 px-4 py-5 rounded border-2
                          border-dashed border-cool-gray cursor-pointer
                          hover:border-navy hover:bg-navy/3 transition-colors">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
          />
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              {preview && (
                <img src={preview} alt="preview" className="w-20 h-20 object-cover rounded opacity-60" />
              )}
              <span className="text-sm text-secondary animate-pulse">
                {isHindi ? '🔍 Gemma जाँच कर रहा है…' : '🔍 Gemma Vision analysing…'}
              </span>
            </div>
          ) : (
            <>
              <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 5.75 5.75 0 011.317 11.095H6.75z" />
              </svg>
              <span className="text-sm font-medium text-secondary">
                {isHindi ? '📸 साक्ष्य फ़ोटो चुनें' : '📸 Select Evidence Photo'}
              </span>
              <span className="text-xs text-muted">
                {isHindi ? 'चोट / दस्तावेज़ / घटनास्थल' : 'Injury · Document · Scene'}
              </span>
            </>
          )}
        </label>
      )}

      {error && <p className="text-xs text-error">{error}</p>}

      {/* Audit result card */}
      {audit && style && (
        <div className={`rounded-lg border ${style.border} ${style.bg} overflow-hidden`}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3">
            {preview && (
              <img src={preview} alt="evidence" className="w-12 h-12 object-cover rounded flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                  {style.icon} {audit.overall_quality.toUpperCase()}
                </span>
                {audit.is_usable ? (
                  <span className="text-xs text-teal font-semibold">
                    {isHindi ? '✓ उपयोग योग्य' : '✓ Usable'}
                  </span>
                ) : (
                  <span className="text-xs text-error font-semibold">
                    {isHindi ? '⚠ दोबारा लें' : '⚠ Retake needed'}
                  </span>
                )}
              </div>
              <p className="text-xs text-secondary leading-relaxed">
                {isHindi ? audit.feedback_hindi : audit.feedback_english}
              </p>
            </div>
          </div>

          {/* Score bars */}
          <div className="grid grid-cols-3 gap-2 px-4 py-3 border-t border-cool-gray/30 bg-white/50">
            {[
              { label: isHindi ? 'स्पष्टता' : 'Clarity',  score: audit.clarity_score  },
              { label: isHindi ? 'रोशनी'    : 'Lighting', score: audit.lighting_score },
              { label: isHindi ? 'कोण'      : 'Angle',    score: audit.angle_score    },
            ].map(({ label, score }) => (
              <div key={label} className="flex flex-col gap-1">
                <span className="text-xs text-muted">{label}</span>
                <ScoreDots score={score} />
              </div>
            ))}
          </div>

          {/* Action hint + retry */}
          {!audit.is_usable && (
            <div className="px-4 py-3 border-t border-cool-gray/30 flex items-center justify-between gap-3">
              <p className="text-xs text-secondary flex-1">
                💡 {isHindi ? audit.action_hint_hindi : audit.action_hint_hindi}
              </p>
              <button
                onClick={reset}
                className="text-xs font-semibold text-navy hover:text-teal transition-colors shrink-0"
              >
                {isHindi ? 'दोबारा लें' : 'Retake'}
              </button>
            </div>
          )}

          {/* If usable, offer to change */}
          {audit.is_usable && (
            <div className="px-4 py-2 border-t border-cool-gray/30 flex justify-end">
              <button onClick={reset} className="text-xs text-muted hover:text-navy transition-colors">
                {isHindi ? 'बदलें' : 'Change photo'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
