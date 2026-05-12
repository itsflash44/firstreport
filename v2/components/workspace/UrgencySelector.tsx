'use client';

import type { Urgency, LangCode } from '../../types/index';
import { t } from '../../types/i18n';

interface UrgencySelectorProps {
  selected: Urgency | null;
  onSelect: (urgency: Urgency) => void;
  language: LangCode;
}

const URGENCY_OPTIONS: Array<{ value: Urgency; labelKey: string; color: string }> = [
  { value: 1, labelKey: 'routine', color: 'border-green-400 bg-green-50' },
  { value: 2, labelKey: 'serious', color: 'border-warning bg-yellow-50' },
  { value: 3, labelKey: 'critical', color: 'border-error bg-red-50' },
];

export function UrgencySelector({ selected, onSelect, language }: UrgencySelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-navy">
        {t('urgencyTitle', language)}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {URGENCY_OPTIONS.map((opt) => {
          const isActive = selected === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              aria-pressed={isActive}
              className={`
                flex items-center justify-center p-3 rounded-xl
                border-2 transition-all duration-150 min-h-[56px]
                focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2
                active:scale-95
                ${isActive
                  ? `${opt.color} shadow-sm`
                  : 'border-cool-gray bg-white hover:border-teal/40'}
              `}
            >
              <span className="text-sm font-medium text-navy">
                {t(opt.labelKey, language)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
