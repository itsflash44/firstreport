'use client';

import { useState, useRef } from 'react';

interface OfficerInfo {
  name: string;
  batch_number?: string;
  posting?: string;
  source: string;
}

interface Props {
  sessionId?: string;
  language?: string;
  onExtracted?: (info: OfficerInfo) => void;
}

/**
 * OfficerPhotoUpload — optional camera/file upload for police notice board.
 * Gemma 4 vision extracts officer name, batch number, and posting from the photo.
 * Stores result in sessionStorage as "officer_info".
 * Usage is completely optional — user can skip.
 */
export default function OfficerPhotoUpload({ sessionId, language = 'hi-IN', onExtracted }: Props) {
  const [loading, setLoading]       = useState(false);
  const [officer, setOfficer]       = useState<OfficerInfo | null>(null);
  const [error, setError]           = useState('');
  const fileInputRef                = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    setLoading(true);
    setError('');
    setOfficer(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      if (sessionId) formData.append('session_id', sessionId);

      const res = await fetch('/api/officer', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success && data.officer_info) {
        const info: OfficerInfo = data.officer_info;
        setOfficer(info);
        // Persist to sessionStorage so generate-pdf picks it up
        sessionStorage.setItem('officer_info', JSON.stringify(info));
        onExtracted?.(info);
      } else {
        setError('फ़ोटो से जानकारी नहीं मिली। कृपया फिर से कोशिश करें।');
      }
    } catch {
      setError('फ़ोटो अपलोड नहीं हुई। कृपया फिर से कोशिश करें।');
    }
    setLoading(false);
  };

  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-secondary">
          {language === 'hi-IN' ? 'अधिकारी की जानकारी (वैकल्पिक)' : 'Officer Info (Optional)'}
        </span>
        <div className="flex-1 h-px bg-cool-gray/60" />
      </div>

      <p className="text-xs text-muted">
        {language === 'hi-IN'
          ? 'थाने के नोटिस बोर्ड की फ़ोटो लें — AI अधिकारी का नाम और बैच नंबर निकाल लेगा।'
          : 'Take a photo of the police station notice board — AI will extract officer details.'}
      </p>

      {!officer && (
        <div className="flex gap-3">
          {/* Camera button (mobile) */}
          <label
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded border
                       border-dashed border-cool-gray text-secondary text-sm cursor-pointer
                       hover:border-navy hover:text-navy transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
            />
            {loading ? (
              <span className="animate-pulse">विश्लेषण हो रहा है…</span>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
                <span>📸 {language === 'hi-IN' ? 'फ़ोटो लें' : 'Take Photo'}</span>
              </>
            )}
          </label>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-error">{error}</p>
      )}

      {/* Extracted officer card */}
      {officer && (
        <div className="p-3 bg-teal/8 border border-teal/20 rounded space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal uppercase tracking-widest">
              ✓ {language === 'hi-IN' ? 'अधिकारी की जानकारी' : 'Officer Extracted'}
            </span>
            <button
              onClick={() => { setOfficer(null); sessionStorage.removeItem('officer_info'); }}
              className="text-xs text-muted hover:text-navy"
            >
              ✕ हटाएं
            </button>
          </div>
          <p className="text-sm font-semibold text-navy">{officer.name}</p>
          {officer.batch_number && (
            <p className="text-xs text-secondary">बैच: {officer.batch_number}</p>
          )}
          {officer.posting && (
            <p className="text-xs text-secondary">पद: {officer.posting}</p>
          )}
        </div>
      )}
    </div>
  );
}
