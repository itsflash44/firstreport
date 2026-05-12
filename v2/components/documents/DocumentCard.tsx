'use client';

import type { GeneratedDocument } from '../../types/index';

interface DocumentCardProps {
  document: GeneratedDocument;
  onDownload?: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  ready: 'bg-green-100 text-green-800',
  generating: 'bg-yellow-100 text-yellow-800',
  locked: 'bg-cool-gray text-text-secondary',
  failed: 'bg-red-100 text-red-800',
};

export function DocumentCard({ document, onDownload }: DocumentCardProps) {
  return (
    <div className="bg-white rounded-xl border border-cool-gray shadow-sm p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-navy truncate">{document.title}</p>
          <p className="text-xs text-text-secondary mt-0.5">{document.subtitle}</p>
        </div>
        <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[document.status]}`}>
          {document.status}
        </span>
      </div>

      {document.status === 'ready' && onDownload && (
        <button
          onClick={onDownload}
          className="mt-3 w-full py-2 rounded-lg bg-teal/10 text-teal text-sm font-medium hover:bg-teal/20 transition-colors focus-visible:outline-2 focus-visible:outline-teal"
        >
          Download PDF
        </button>
      )}
    </div>
  );
}
