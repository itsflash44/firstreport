'use client';

/**
 * FirstReport — Browser-Native OCR Panel (Production-Hardened)
 *
 * Fixes applied vs v1:
 * - acquireOCRWorker() called on mount, cleanup on unmount (no memory leaks)
 * - After OCR success, bridges result to legalJourney localStorage
 *   so the case page reflects verified documents without reload
 * - Restored savedDocs from Dexie on mount (case continuity)
 * - visibilitychange listener: marks worker dead when tab is backgrounded
 * - Touch-safe file inputs for Galaxy A03
 * - Error boundary for OffscreenCanvas failures
 * - safeAddToSyncQueue replaces addToSyncQueue (dedup)
 */

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type DragEvent,
  type ChangeEvent,
} from 'react';
import { processDocumentOCR, acquireOCRWorker, markWorkerDead } from '@/lib/ocr/tesseractWorker';
import {
  getDB,
  type LocalDocument,
  type OCRResult,
  type DocumentType,
} from '@/lib/db/dexie';
import { queueDocumentUpload, safeAddToSyncQueue } from '@/lib/sync/syncEngine';

// Bridge to legalJourney so that documents show in the case's Documents tab
import { addDocumentToCase } from '@/lib/legalJourney';

// ─────────────────────────────────────────────────────────────────────────────

const DOC_TYPES: DocumentType[] = [
  'Aadhaar Card', 'PAN Card', 'Passport', 'Driving License',
  'FIR Copy', 'Medical Certificate', 'Affidavit', 'Bank Statement',
];

const DOC_TYPE_HINDI: Record<string, string> = {
  'Aadhaar Card':       'आधार कार्ड',
  'PAN Card':           'PAN कार्ड',
  'Passport':           'पासपोर्ट',
  'Driving License':    'ड्राइविंग लाइसेंस',
  'FIR Copy':           'FIR की कॉपी',
  'Medical Certificate':'मेडिकल प्रमाणपत्र',
  'Affidavit':          'शपथपत्र',
  'Bank Statement':     'बैंक स्टेटमेंट',
  'Utility Bill':       'बिजली / पानी बिल',
  'Other':              'अन्य दस्तावेज़',
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: string; label: string }> = {
  'Verified':             { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', icon: '✓', label: 'सत्यापित' },
  'Partial Match':        { bg: 'bg-blue-50 border-blue-200',       text: 'text-blue-800',    icon: '≈', label: 'आंशिक मिलान' },
  'Name Mismatch':        { bg: 'bg-red-50 border-red-200',         text: 'text-red-800',     icon: '✗', label: 'नाम अलग' },
  'Needs Better Scan':    { bg: 'bg-orange-50 border-orange-200',   text: 'text-orange-800',  icon: '⟳', label: 'बेहतर स्कैन चाहिए' },
  'Low Quality':          { bg: 'bg-orange-50 border-orange-200',   text: 'text-orange-800',  icon: '⚠', label: 'कम क्वालिटी' },
  'Pending Review':       { bg: 'bg-gray-50 border-gray-200',       text: 'text-gray-700',    icon: '…', label: 'समीक्षाधीन' },
  'Incomplete Document':  { bg: 'bg-yellow-50 border-yellow-200',   text: 'text-yellow-800',  icon: '!', label: 'अधूरा दस्तावेज़' },
  'In Review':            { bg: 'bg-gray-50 border-gray-200',       text: 'text-gray-700',    icon: '…', label: 'समीक्षाधीन' },
};

// ─────────────────────────────────────────────────────────────────────────────

interface ScoreBarProps { label: string; value: number; colorClass: string }
function ScoreBar({ label, value, colorClass }: ScoreBarProps) {
  return (
    <div>
      <div className="flex justify-between text-xs text-navy/60 mb-1">
        <span>{label}</span>
        <span className="font-mono font-medium">{value}%</span>
      </div>
      <div className="h-1.5 bg-navy/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
             style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

interface ExtractedFieldProps { label: string; value: string | undefined; confidence?: number }
function ExtractedField({ label, value, confidence }: ExtractedFieldProps) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 py-2 border-b border-navy/5 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-navy/40 font-medium">{label}</p>
        <p className="text-sm text-navy font-medium truncate">{value}</p>
      </div>
      {confidence !== undefined && (
        <span className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded font-mono
          ${confidence >= 80 ? 'bg-emerald-100 text-emerald-700'
          : confidence >= 60 ? 'bg-amber-100 text-amber-700'
          : 'bg-red-100 text-red-700'}`}>
          {confidence}%
        </span>
      )}
    </div>
  );
}

interface OCRPanelProps {
  caseId: string;
  caseName?: string;
  language?: string;
  onDocumentVerified?: (doc: LocalDocument) => void;
}

export default function OCRPanel({ caseId, caseName, language = 'hi-IN', onDocumentVerified }: OCRPanelProps) {
  const [selectedType, setSelectedType] = useState<DocumentType>('Aadhaar Card');
  const [file, setFile]       = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress]     = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [result, setResult]   = useState<OCRResult | null>(null);
  const [savedDocs, setSavedDocs] = useState<LocalDocument[]>([]);
  const [error, setError]     = useState<string | null>(null);
  const [docsLoaded, setDocsLoaded] = useState(false);

  const fileInputRef   = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef  = useRef<string | null>(null);

  // ── FIX: Acquire OCR worker on mount, release on unmount ────────────────
  useEffect(() => {
    const release = acquireOCRWorker();

    // FIX: Mark worker dead when tab is backgrounded (mobile memory reclaim)
    const handleVisibilityChange = () => {
      if (document.hidden) markWorkerDead();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      release();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // ── Cleanup object URLs on unmount ──────────────────────────────────────
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  // ── FIX: Load existing docs from Dexie on mount (case continuity) ───────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;

    const load = async () => {
      try {
        const db = getDB();
        const docs = await db.documents
          .where('caseId').equals(caseId)
          .reverse()
          .sortBy('createdAt');
        if (!cancelled) {
          setSavedDocs(docs);
          setDocsLoaded(true);
        }
      } catch (e) {
        console.error('[OCRPanel] Error loading docs:', e);
        if (!cancelled) setDocsLoaded(true);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [caseId]);

  // ── File handling ────────────────────────────────────────────────────────

  const handleFile = useCallback((f: File) => {
    // Revoke previous URL
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    setFile(f);
    setResult(null);
    setError(null);
    setProgress(0);
    setProgressLabel('');
    const url = URL.createObjectURL(f);
    previewUrlRef.current = url;
    setPreview(url);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith('image/')) handleFile(dropped);
  }, [handleFile]);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    // FIX: reset input value so same file can be re-selected
    e.target.value = '';
  }, [handleFile]);

  // ── Run OCR ──────────────────────────────────────────────────────────────

  const runOCR = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const ocrResult = await processDocumentOCR(file, {
        documentType: selectedType,
        caseName,
        onProgress: (stage, p) => {
          setProgressLabel(stage);
          setProgress(p);
        },
      });

      if (!ocrResult.success || !ocrResult.result) {
        setError(ocrResult.error ?? 'OCR विफल हो गया');
        setProcessing(false);
        return;
      }

      setResult(ocrResult.result);

      // ── Persist to Dexie ────────────────────────────────────────────────
      const db = getDB();
      const docId = crypto.randomUUID();
      const now   = Date.now();

      const doc: LocalDocument = {
        id: docId,
        caseId,
        type: selectedType,
        fileName: file.name,
        mimeType: file.type,
        localBlob: file,
        localBlobUrl: preview ?? undefined,
        verificationStatus: ocrResult.result.verificationResult.status,
        ocrData: ocrResult.result,
        qualityScore: ocrResult.result.qualityAnalysis.overallScore,
        verificationScore: ocrResult.result.verificationResult.overallScore,
        createdAt: now,
        syncStatus: 'local',
      };

      await db.documents.put(doc);
      setSavedDocs(prev => [doc, ...prev]);

      // ── FIX: Bridge OCR result to legalJourney (localStorage) ──────────
      // This ensures the document shows in the case page's Documents panel
      // without requiring a full page reload.
      addDocumentToCase(caseId, {
        type: 'evidence_list' as const,
        title: `${DOC_TYPE_HINDI[selectedType] ?? selectedType} — OCR सत्यापित`,
        generatedAt: now,
        language: language as 'hi-IN',
        content: JSON.stringify({
          verificationStatus: doc.verificationStatus,
          extractedName: ocrResult.result.extractedFields.name,
          documentId: docId,
          qualityScore: doc.qualityScore,
        }),
      });

      // ── Queue for cloud upload ──────────────────────────────────────────
      await queueDocumentUpload(docId, caseId, file, file.name, file.type);

      // ── Queue metadata sync ─────────────────────────────────────────────
      await safeAddToSyncQueue('UPLOAD_DOCUMENT', docId, 'document', {
        caseId,
        type: selectedType,
        verificationStatus: doc.verificationStatus,
        qualityScore: doc.qualityScore,
        verificationScore: doc.verificationScore,
        extractedName: ocrResult.result.extractedFields.name,
        processedAt: now,
      });

      onDocumentVerified?.(doc);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR में त्रुटि हुई');
    } finally {
      setProcessing(false);
    }
  }, [file, selectedType, caseName, caseId, preview, language, onDocumentVerified]);

  // ─────────────────────────────────────────────────────────────────────────

  const vr = result?.verificationResult ?? null;
  const statusCfg = vr ? (STATUS_CONFIG[vr.status] ?? STATUS_CONFIG['Pending Review']) : null;

  return (
    <div className="space-y-5">

      {/* ── Document Type ──────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-navy/50 uppercase tracking-wide mb-2">
          दस्तावेज़ का प्रकार
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {DOC_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-2.5 py-2 rounded-lg border text-left text-xs font-medium transition-all active:scale-95
                ${selectedType === type
                  ? 'bg-navy text-white border-navy shadow-sm'
                  : 'bg-white text-navy/70 border-navy/15 hover:border-navy/30 active:bg-navy/5'
                }`}
            >
              {DOC_TYPE_HINDI[type]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Upload Zone ────────────────────────────────────────────────────── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl overflow-hidden transition-colors duration-200
          ${isDragging ? 'border-navy bg-navy/5'
          : preview ? 'border-navy/30'
          : 'border-navy/15 hover:border-navy/30'}`}
      >
        {preview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Document preview"
                 className="w-full max-h-56 object-contain bg-gray-50" />
            <button
              onClick={() => {
                if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
                previewUrlRef.current = null;
                setFile(null); setPreview(null); setResult(null);
              }}
              className="absolute top-2 right-2 bg-white/95 text-navy rounded-full w-8 h-8
                         flex items-center justify-center shadow text-lg hover:bg-white
                         active:scale-95 transition-transform touch-none"
              aria-label="Remove document"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="py-10 px-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 text-navy/25">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-navy/60 mb-1">दस्तावेज़ यहाँ खींचें या फोटो लें</p>
            <p className="text-xs text-navy/35">JPG, PNG, WEBP — max 20MB</p>
          </div>
        )}

        {/* FIX: hidden inputs with touch-friendly minimum tap areas */}
        <input ref={fileInputRef}   type="file" accept="image/*"                     onChange={handleFileChange} className="hidden" tabIndex={-1} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" tabIndex={-1} />
      </div>

      {/* ── Action Buttons ─────────────────────────────────────────────────── */}
      <div className="flex gap-2">
        {/* FIX: min-h-11 ensures 44px touch targets on mobile (WCAG 2.5.5) */}
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 min-h-11 border border-navy/15
                     rounded-xl text-sm text-navy/65 hover:bg-navy/5 active:bg-navy/10
                     active:scale-98 transition-all touch-none"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          कैमरा
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 min-h-11 border border-navy/15
                     rounded-xl text-sm text-navy/65 hover:bg-navy/5 active:bg-navy/10
                     active:scale-98 transition-all touch-none"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          गैलरी
        </button>

        {file && !processing && (
          <button
            onClick={runOCR}
            className="flex-1 min-h-11 bg-navy text-white rounded-xl text-sm font-semibold
                       hover:bg-navy/90 active:scale-98 transition-all touch-none"
          >
            OCR चलाएं →
          </button>
        )}
      </div>

      {/* ── Progress ───────────────────────────────────────────────────────── */}
      {processing && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-navy/45">
            <span className="truncate">{progressLabel || 'Processing…'}</span>
            <span className="ml-2 flex-shrink-0">{progress}%</span>
          </div>
          <div className="h-2 bg-navy/8 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-navy to-blue-500 rounded-full transition-all duration-300"
                 style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700
                        flex items-start gap-2.5">
          <span className="flex-shrink-0 text-base">⚠</span>
          <div>
            <p className="font-medium mb-1">OCR में समस्या</p>
            <p className="text-xs opacity-80">{error}</p>
            <button onClick={() => setError(null)}
                    className="text-xs underline mt-1 opacity-70 hover:opacity-100">
              दोबारा कोशिश करें
            </button>
          </div>
        </div>
      )}

      {/* ── OCR Result ────────────────────────────────────────────────────── */}
      {result && vr && statusCfg && (
        <div className="space-y-4">

          {/* Status badge */}
          <div className={`p-4 border rounded-xl ${statusCfg.bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xl ${statusCfg.text}`}>{statusCfg.icon}</span>
              <span className={`font-semibold text-sm ${statusCfg.text}`}>{statusCfg.label}</span>
            </div>
            {vr.nameMatch && (
              <p className={`text-xs mt-1 ${statusCfg.text}`}>
                {vr.nameMatch.verdict === 'match'
                  ? `नाम पूरी तरह मिलता है: ${vr.nameMatch.documentValue}`
                  : vr.nameMatch.verdict === 'probable_match'
                    ? `नाम आंशिक मिलता है (${vr.nameMatch.matchScore}%): ${vr.nameMatch.documentValue}`
                    : `नाम मेल नहीं खाता: केस "${vr.nameMatch.caseValue}" ≠ दस्तावेज़ "${vr.nameMatch.documentValue}"`
                }
              </p>
            )}
          </div>

          {/* Score bars */}
          <div className="p-4 bg-white border border-navy/8 rounded-xl space-y-2.5">
            <p className="text-xs font-semibold text-navy/50 uppercase tracking-wide mb-3">
              गुणवत्ता स्कोर
            </p>
            <ScoreBar label="OCR सटीकता" value={result.confidence}
              colorClass={result.confidence >= 70 ? 'bg-emerald-500' : result.confidence >= 40 ? 'bg-amber-500' : 'bg-red-500'} />
            <ScoreBar label="छवि गुणवत्ता" value={result.qualityAnalysis.overallScore}
              colorClass={result.qualityAnalysis.overallScore >= 70 ? 'bg-emerald-500' : result.qualityAnalysis.overallScore >= 40 ? 'bg-amber-500' : 'bg-red-500'} />
            <ScoreBar label="सत्यापन स्कोर" value={vr.overallScore}
              colorClass={vr.overallScore >= 70 ? 'bg-emerald-500' : vr.overallScore >= 40 ? 'bg-blue-500' : 'bg-red-500'} />
          </div>

          {/* Extracted fields */}
          <div className="p-4 bg-white border border-navy/8 rounded-xl">
            <p className="text-xs font-semibold text-navy/50 uppercase tracking-wide mb-3">
              निकाले गए फ़ील्ड
            </p>
            <ExtractedField label="नाम"        value={result.extractedFields.name}          confidence={result.extractedFields.fieldConfidence['name']} />
            <ExtractedField label="आधार नंबर"  value={result.extractedFields.aadhaarNumber} confidence={result.extractedFields.fieldConfidence['aadhaarNumber']} />
            <ExtractedField label="PAN नंबर"   value={result.extractedFields.panNumber}     confidence={result.extractedFields.fieldConfidence['panNumber']} />
            <ExtractedField label="जन्म तिथि"  value={result.extractedFields.dob}           confidence={result.extractedFields.fieldConfidence['dob']} />
            <ExtractedField label="लिंग"        value={result.extractedFields.gender}        confidence={result.extractedFields.fieldConfidence['gender']} />
            <ExtractedField label="FIR नंबर"   value={result.extractedFields.firNumber}     confidence={result.extractedFields.fieldConfidence['firNumber']} />
            <ExtractedField label="थाना"        value={result.extractedFields.policeStation} confidence={result.extractedFields.fieldConfidence['policeStation']} />
            <ExtractedField label="अधिकारी"     value={result.extractedFields.officerName}  confidence={result.extractedFields.fieldConfidence['officerName']} />
            <ExtractedField label="पता"         value={result.extractedFields.address}       confidence={result.extractedFields.fieldConfidence['address']} />
          </div>

          {/* Warnings */}
          {vr.warnings.length > 0 && (
            <div className="space-y-1.5">
              {vr.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-amber-50 border
                                        border-amber-200 rounded-lg text-xs text-amber-800">
                  <span className="flex-shrink-0">⚠</span>
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Positive fields */}
          {vr.positiveFields.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {vr.positiveFields.map(f => (
                <span key={f} className="px-2.5 py-1 bg-emerald-50 border border-emerald-200
                                          rounded-full text-xs text-emerald-700 font-medium">
                  ✓ {f}
                </span>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {result.qualityAnalysis.suggestions.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-xs font-semibold text-blue-800 mb-2">सुझाव:</p>
              <ul className="space-y-1">
                {result.qualityAnalysis.suggestions.map((s, i) => (
                  <li key={i} className="text-xs text-blue-700 flex items-start gap-1.5">
                    <span className="flex-shrink-0 mt-0.5">→</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Saved Documents List ────────────────────────────────────────────── */}
      {docsLoaded && savedDocs.length > 0 && (
        <div className="border-t border-navy/8 pt-4">
          <p className="text-xs font-semibold text-navy/50 uppercase tracking-wide mb-3">
            इस केस के दस्तावेज़ ({savedDocs.length})
          </p>
          <div className="space-y-1.5">
            {savedDocs.map(doc => {
              const cfg = STATUS_CONFIG[doc.verificationStatus] ?? STATUS_CONFIG['Pending Review'];
              return (
                <div key={doc.id}
                     className={`flex items-center gap-3 p-3 border rounded-xl ${cfg.bg}`}>
                  <span className={`text-base flex-shrink-0 ${cfg.text}`}>{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${cfg.text}`}>
                      {DOC_TYPE_HINDI[doc.type] ?? doc.type}
                    </p>
                    <p className={`text-xs ${cfg.text} opacity-70`}>
                      {cfg.label}
                      {doc.verificationScore !== undefined && ` · ${doc.verificationScore}%`}
                    </p>
                  </div>
                  <span className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded font-medium
                    ${doc.syncStatus === 'synced'
                      ? 'bg-emerald-100 text-emerald-700'
                      : doc.syncStatus === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'}`}>
                    {doc.syncStatus === 'synced' ? '✓' : doc.syncStatus === 'failed' ? '✗' : '⟳'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Loading skeleton for docs */}
      {!docsLoaded && (
        <div className="border-t border-navy/8 pt-4 space-y-2">
          {[1, 2].map(n => (
            <div key={n} className="h-12 bg-navy/5 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* NALSA safety strip */}
      <a href="tel:15100"
         className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl
                    text-xs text-red-700 font-medium hover:bg-red-100 transition-colors">
        <span className="text-base">📞</span>
        <span>NALSA कानूनी सहायता: <strong>15100</strong></span>
      </a>
    </div>
  );
}
