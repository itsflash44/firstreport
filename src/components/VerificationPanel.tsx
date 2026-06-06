'use client';

import { useState, useRef, useEffect } from 'react';
import type { LangCode } from '@/lib/i18n';

/* ── Extended document interface — mirrors verify-document API response ── */
export interface CaseDoc {
  id: string;
  documentType: string;
  fileUrl: string;
  status: string;
  verificationScore?: number;
  qualityScore?: number;
  blurScore?: number;
  extractedName?: string;
  extractedIdNumber?: string;
  extractedDob?: string;
  extractedAddress?: string;
  mismatchWarnings?: string[];
  positiveFields?: string[];   // NEW: verified/readable fields from OCR
}

interface Props {
  sessionId: string;
  language: LangCode;
  currentCaseName?: string;
  onVerificationComplete?: () => void;
}

const DOC_TYPES = [
  'Aadhaar Card',
  'PAN Card',
  'Passport',
  'Driving License',
  'FIR Copy',
  'Medical Certificate',
  'Affidavit',
  'Bank Statement',
];

/* ── Status badge colour map ─────────────────────────────────────────── */
const STATUS_STYLE: Record<string, string> = {
  Verified:           'bg-green-100 text-green-800 border-green-200',
  'Name Mismatch':    'bg-red-100 text-red-800 border-red-200',
  'Needs Better Scan':'bg-orange-100 text-orange-800 border-orange-200',
  'Low Quality':      'bg-orange-100 text-orange-800 border-orange-200',
  'Missing Information':'bg-yellow-100 text-yellow-800 border-yellow-200',
  'In Review':        'bg-cool-gray text-navy border-cool-gray',
};

/* ── Score colour ────────────────────────────────────────────────────── */
function scoreColor(n: number): string {
  if (n >= 80) return '#4CAF50';
  if (n >= 50) return '#5FA8A0';
  return '#B8962E';
}

/* ── i18n labels ─────────────────────────────────────────────────────── */
const L: Record<string, Record<string, string>> = {
  title:        { 'hi-IN': 'दस्तावेज़ जाँच', 'en-IN': 'Document Verification' },
  docType:      { 'hi-IN': 'दस्तावेज़ प्रकार', 'en-IN': 'Document Type' },
  upload:       { 'hi-IN': 'अपलोड करें', 'en-IN': 'Upload & Verify' },
  verifying:    { 'hi-IN': 'जाँच हो रही है...', 'en-IN': 'Verifying...' },
  loading:      { 'hi-IN': 'लोड हो रहा है...', 'en-IN': 'Loading documents...' },
  empty:        { 'hi-IN': 'अभी कोई दस्तावेज़ अपलोड नहीं।', 'en-IN': 'No documents uploaded yet.' },
  trust:        { 'hi-IN': 'विश्वसनीयता', 'en-IN': 'Trust' },
  quality:      { 'hi-IN': 'गुणवत्ता', 'en-IN': 'Quality' },
  clarity:      { 'hi-IN': 'स्पष्टता', 'en-IN': 'Clarity' },
  name:         { 'hi-IN': 'नाम', 'en-IN': 'Name' },
  idNumber:     { 'hi-IN': 'आईडी नंबर', 'en-IN': 'ID Number' },
  dob:          { 'hi-IN': 'जन्म तिथि', 'en-IN': 'Date of Birth' },
  address:      { 'hi-IN': 'पता', 'en-IN': 'Address' },
  warnings:     { 'hi-IN': 'चेतावनियाँ', 'en-IN': 'Warnings' },
  verified:     { 'hi-IN': 'सत्यापित फ़ील्ड', 'en-IN': 'Verified Fields' },
  hint:         {
    'hi-IN': 'आधार, पैन, पासपोर्ट या FIR कॉपी अपलोड करें। AI तुरंत जाँच करेगा।',
    'en-IN': 'Upload Aadhaar, PAN, Passport or FIR copy. AI verifies instantly.',
  },
};

function lbl(key: string, lang: LangCode): string {
  return (L[key]?.[lang] ?? L[key]?.['en-IN'] ?? key);
}

/* ── Component ───────────────────────────────────────────────────────── */
export default function VerificationPanel({
  sessionId,
  language,
  currentCaseName,
  onVerificationComplete,
}: Props) {
  const [docs, setDocs]           = useState<CaseDoc[]>([]);
  const [loading, setLoading]     = useState(false);
  const [selectedType, setSelectedType] = useState(DOC_TYPES[0]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/documents?sessionId=${encodeURIComponent(sessionId)}`);
      if (res.ok) {
        const data = await res.json();
        setDocs(data.documents || []);
      }
    } catch { /* offline — silently ignore */ }
    finally { setLoading(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch('/api/verify-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            documentType: selectedType,
            fileBase64: base64,
            mimeType: file.type,
            currentCaseName,
          }),
        });
        const data = await res.json();
        if (data.success && data.document) {
          setDocs(prev => [data.document, ...prev]);
          if (onVerificationComplete) onVerificationComplete();
        } else {
          setUploadError(data.error || 'Verification failed. Please try again.');
        }
      } catch {
        setUploadError(
          language === 'hi-IN'
            ? 'नेटवर्क में समस्या। दोबारा कोशिश करें।'
            : 'Network error. Please try again.',
        );
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
  };

  return (
    <div className="bg-white rounded-sm border border-cool-gray/50 overflow-hidden">

      {/* Header */}
      <div className="p-4 border-b border-cool-gray/50 bg-off-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h3 lang={language} className="font-serif font-bold text-navy text-base">
            {lbl('title', language)}
          </h3>
        </div>
        <span className="text-[10px] font-mono text-muted">{docs.length} docs</span>
      </div>

      <div className="p-4 space-y-4">

        {/* Upload controls */}
        <div className="space-y-2">
          <label lang={language} className="block text-[10px] font-bold uppercase tracking-wider text-secondary">
            {lbl('docType', language)}
          </label>
          <div className="flex gap-2">
            <select
              className="flex-1 border border-cool-gray rounded-sm px-2 py-2 text-xs focus:outline-none focus:border-teal bg-white"
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              disabled={uploading}
            >
              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,application/pdf"
              onChange={handleFileUpload}
            />
            <button
              onClick={() => { setUploadError(null); fileInputRef.current?.click(); }}
              disabled={uploading}
              lang={language}
              className="px-3 py-2 bg-navy text-white text-[11px] font-bold uppercase tracking-wider rounded-sm hover:bg-navy-deep transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {uploading ? lbl('verifying', language) : lbl('upload', language)}
            </button>
          </div>

          {/* Hint */}
          <p lang={language} className="text-[10px] text-muted leading-relaxed">
            {lbl('hint', language)}
          </p>

          {/* Upload error */}
          {uploadError && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-sm text-xs text-red-700">
              {uploadError}
            </div>
          )}
        </div>

        {/* Document list */}
        {loading ? (
          <div className="py-8 text-center text-xs text-muted">{lbl('loading', language)}</div>
        ) : docs.length === 0 ? (
          <div className="py-8 text-center bg-ivory rounded-sm border border-dashed border-cool-gray">
            <svg className="w-8 h-8 text-cool-gray/60 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p lang={language} className="text-xs text-secondary">{lbl('empty', language)}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map(doc => (
              <DocCard key={doc.id} doc={doc} language={language} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Individual document verification card ───────────────────────────── */
function DocCard({ doc, language }: { doc: CaseDoc; language: LangCode }) {
  const [expanded, setExpanded] = useState(false);

  const score = doc.verificationScore ?? 0;
  const qual  = doc.qualityScore      ?? 0;
  const blur  = doc.blurScore         ?? 0;

  const hasWarnings   = (doc.mismatchWarnings?.length ?? 0) > 0;
  const hasPositive   = (doc.positiveFields?.length   ?? 0) > 0;
  const statusStyle   = STATUS_STYLE[doc.status] ?? STATUS_STYLE['In Review'];

  return (
    <div className={`rounded-sm border overflow-hidden transition-all ${
      doc.status === 'Verified' ? 'border-green-200' :
      doc.status === 'Name Mismatch' || doc.status === 'Low Quality' ? 'border-red-200' :
      'border-cool-gray/60'
    }`}>

      {/* Card header */}
      <div className="p-3 bg-off-white flex items-start gap-2">
        {/* Thumbnail */}
        {doc.fileUrl ? (
          <div className="w-10 h-10 bg-gray-200 rounded-sm overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={doc.fileUrl} alt={doc.documentType} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-10 h-10 bg-cool-gray/20 rounded-sm flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-cool-gray" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-xs font-semibold text-navy truncate">{doc.documentType}</span>
            <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-sm border uppercase tracking-wider ${statusStyle}`}>
              {doc.status}
            </span>
          </div>

          {/* Score bars */}
          <div className="flex items-center gap-3">
            <ScorePill label={lbl('trust', language)} value={score} />
            <ScorePill label={lbl('quality', language)} value={qual} />
            <ScorePill label={lbl('clarity', language)} value={blur} />
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-muted hover:text-navy transition-colors"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          <svg className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3 pb-3 pt-2 space-y-3 border-t border-cool-gray/30 bg-white">

          {/* Extracted fields */}
          {(doc.extractedName || doc.extractedIdNumber || doc.extractedDob || doc.extractedAddress) && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {doc.extractedName && (
                <Field label={lbl('name', language)} value={doc.extractedName} />
              )}
              {doc.extractedIdNumber && (
                <Field label={lbl('idNumber', language)} value={doc.extractedIdNumber} />
              )}
              {doc.extractedDob && (
                <Field label={lbl('dob', language)} value={doc.extractedDob} />
              )}
              {doc.extractedAddress && (
                <Field label={lbl('address', language)} value={doc.extractedAddress} span />
              )}
            </div>
          )}

          {/* ✅ Positive / verified fields */}
          {hasPositive && (
            <div className="p-2 bg-green-50 border border-green-100 rounded-sm">
              <div className="text-[9px] font-bold uppercase tracking-wider text-green-700 mb-1.5">
                {lbl('verified', language)}
              </div>
              <div className="flex flex-wrap gap-1">
                {doc.positiveFields!.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded-sm font-medium">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ⚠️ Mismatch warnings */}
          {hasWarnings && (
            <div className="p-2 bg-red-50 border border-red-100 rounded-sm">
              <div className="text-[9px] font-bold uppercase tracking-wider text-red-700 mb-1.5">
                {lbl('warnings', language)}
              </div>
              <ul className="space-y-1">
                {doc.mismatchWarnings!.map((w, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[10px] text-red-700">
                    <span className="shrink-0 mt-0.5">⚠</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Mini score pill ─────────────────────────────────────────────────── */
function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] text-muted">{label}</span>
      <span className="text-[10px] font-bold tabular-nums" style={{ color: scoreColor(value) }}>
        {value}%
      </span>
    </div>
  );
}

/* ── Extracted field chip ────────────────────────────────────────────── */
function Field({ label, value, span }: { label: string; value: string; span?: boolean }) {
  return (
    <div className={span ? 'col-span-2' : ''}>
      <div className="text-[9px] font-bold uppercase tracking-wider text-muted mb-0.5">{label}</div>
      <div className="text-[11px] text-navy-deep font-medium truncate">{value}</div>
    </div>
  );
}
