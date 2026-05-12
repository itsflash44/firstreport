'use client';

import { useAppStore } from '../../stores/app-store';
import { t } from '../../types/i18n';

export function OfflineBanner() {
  const isOnline = useAppStore((s) => s.isOnline);
  const language = useAppStore((s) => s.language);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      className="flex items-center justify-center gap-2 px-4 py-2 bg-warning/90 text-navy text-sm font-medium"
    >
      <span className="w-2 h-2 rounded-full bg-error animate-pulse shrink-0" />
      {t('offline', language)}
    </div>
  );
}
