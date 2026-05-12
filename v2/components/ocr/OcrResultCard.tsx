'use client';

import type { OcrFields } from '../../services/ocr';

interface OcrResultCardProps {
  fields: OcrFields;
  rawText: string;
  blurWarning: boolean;
}

const FIELD_LABELS: Array<{ key: keyof OcrFields; label: string }> = [
  { key: 'officerName', label: 'Officer Name / अधिकारी का नाम' },
  { key: 'batchNumber', label: 'Batch / ID Number' },
  { key: 'posting', label: 'Posting / पदस्थापना' },
  { key: 'stationName', label: 'Station / थाना' },
];

export function OcrResultCard({ fields, rawText, blurWarning }: OcrResultCardProps) {
  const hasAnyField = Object.values(fields).some(Boolean);

  return (
    <div className="bg-white rounded-xl border border-cool-gray shadow-sm p-4 space-y-4">
      {blurWarning && (
        <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
          <span>⚠️</span>
          <span>Image may be blurry — results could be inaccurate</span>
        </div>
      )}

      {hasAnyField ? (
        <div className="space-y-3">
          {FIELD_LABELS.map(({ key, label }) => (
            <div key={key}>
              <p className="text-xs text-text-secondary font-medium">{label}</p>
              <p className="text-sm text-navy font-medium mt-0.5">
                {fields[key] ?? '—'}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-text-secondary">
            No officer details detected. Raw text shown below.
          </p>
        </div>
      )}

      <details className="text-xs">
        <summary className="text-text-secondary cursor-pointer hover:text-navy transition-colors">
          Raw OCR text
        </summary>
        <pre className="mt-2 p-3 bg-off-white rounded-lg text-text-secondary whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
          {rawText || '(empty)'}
        </pre>
      </details>
    </div>
  );
}
