'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/v2/stores/app-store';
import { getHistory } from '@/v2/db/history-repo';
import { t } from '@/v2/types/i18n';
import type { CaseSession } from '@/v2/types/index';

export default function HistoryPage() {
  const language = useAppStore((s) => s.language);
  const [entries, setEntries] = useState<CaseSession[]>([]);

  useEffect(() => {
    getHistory().then(setEntries).catch(() => {});
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-4">
      <h1 className="text-lg font-semibold text-navy">
        {t('history', language)}
      </h1>

      {entries.length === 0 && (
        <p className="text-sm text-text-secondary py-8 text-center">
          {t('noHistory', language)}
        </p>
      )}

      {entries.map((entry) => (
        <div
          key={entry.id}
          className="bg-white rounded-xl border border-cool-gray shadow-sm p-4 space-y-1"
        >
          <p className="text-sm font-medium text-navy truncate">
            {entry.classification?.offense_name_hindi ?? entry.incidentSummary.slice(0, 60)}
          </p>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
            <span className="w-1 h-1 rounded-full bg-cool-gray" />
            <span>{entry.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
