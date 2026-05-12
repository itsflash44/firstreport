'use client';

import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/v2/stores/session-store';
import { useAppStore } from '@/v2/stores/app-store';
import { useClassification } from '@/v2/hooks/use-classification';
import { ClassificationCard } from '@/v2/components/classify/ClassificationCard';
import { SeverityBadge } from '@/v2/components/classify/SeverityBadge';
import { t } from '@/v2/types/i18n';

export default function ClassifyPage() {
  const router = useRouter();
  const session = useSessionStore((s) => s.activeSession);
  const language = useAppStore((s) => s.language);
  const { isLoading, error, retry } = useClassification();

  if (!session) return null;

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-navy">
          {t('classification', language)}
        </h1>
        <SeverityBadge level={session.severity} />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
          <p className="text-sm text-red-800">{error}</p>
          <button
            onClick={retry}
            className="text-sm text-red-700 underline font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {session.classification && (
        <>
          <ClassificationCard classification={session.classification} language={language} />

          <button
            onClick={() => router.push('/v2/documents')}
            className="w-full py-3 rounded-xl bg-teal text-white font-semibold text-sm transition-all hover:bg-teal/90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          >
            {t('documents', language)}
          </button>
        </>
      )}

      <p className="text-xs text-text-muted text-center leading-relaxed pt-2">
        {t('disclaimer', language)}
      </p>
    </div>
  );
}
