'use client';

import { useSessionStore } from '@/v2/stores/session-store';
import { useAppStore } from '@/v2/stores/app-store';
import { useDocumentFlow } from '@/v2/hooks/use-document-flow';
import { DocumentCard } from '@/v2/components/documents/DocumentCard';
import { DeliveryStatus } from '@/v2/components/documents/DeliveryStatus';
import { t } from '@/v2/types/i18n';

export default function DocumentsPage() {
  const session = useSessionStore((s) => s.activeSession);
  const language = useAppStore((s) => s.language);
  const { state, error, pdfBlob, generate, send, download } = useDocumentFlow();

  if (!session) return null;

  const hasDocuments = session.documents.length > 0;

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-4">
      <h1 className="text-lg font-semibold text-navy">
        {t('documents', language)}
      </h1>

      {!hasDocuments && (
        <button
          onClick={generate}
          disabled={state === 'generating'}
          className="w-full py-3 rounded-xl bg-teal text-white font-semibold text-sm transition-all hover:bg-teal/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-wait focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
        >
          {state === 'generating' ? 'Generating…' : 'Generate Documents'}
        </button>
      )}

      {session.documents.map((doc, i) => (
        <DocumentCard
          key={`${doc.letterType}-${i}`}
          document={doc}
          onDownload={pdfBlob ? download : undefined}
        />
      ))}

      <DeliveryStatus state={state} error={error} />

      {hasDocuments && state !== 'sent' && (
        <button
          onClick={send}
          disabled={state === 'generating'}
          className="w-full py-3 rounded-xl bg-navy text-white font-semibold text-sm transition-all hover:bg-navy/90 active:scale-[0.98] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
        >
          {t('send', language)} via Telegram
        </button>
      )}

      <p className="text-xs text-text-muted text-center leading-relaxed pt-2">
        {t('disclaimer', language)}
      </p>
    </div>
  );
}
