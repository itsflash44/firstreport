'use client';

import { LANGUAGES } from '../../types/i18n';
import type { LangCode } from '../../types/index';

interface LanguageGridProps {
  selected: LangCode | null;
  onSelect: (code: LangCode) => void;
}

export function LanguageGrid({ selected, onSelect }: LanguageGridProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {LANGUAGES.map((lang) => {
        const isActive = selected === lang.code;
        return (
          <button
            key={lang.code}
            onClick={() => onSelect(lang.code)}
            aria-pressed={isActive}
            className={`
              flex flex-col items-center justify-center gap-1 p-3 rounded-xl
              border-2 transition-all duration-150 min-h-[72px]
              focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2
              active:scale-95
              ${isActive
                ? 'border-teal bg-teal/10 shadow-sm'
                : 'border-cool-gray bg-white hover:border-teal/40'}
            `}
          >
            <span className="text-base font-semibold text-navy leading-tight">
              {lang.label}
            </span>
            <span className="text-xs text-text-secondary">
              {lang.sublabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}
