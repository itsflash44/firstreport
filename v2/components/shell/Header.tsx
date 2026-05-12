'use client';

import { useAppStore } from '../../stores/app-store';
import { LANG_BY_CODE, t } from '../../types/i18n';
import type { LangCode } from '../../types/index';

interface HeaderProps {
  onMenuToggle: () => void;
  menuOpen: boolean;
}

export function Header({ onMenuToggle, menuOpen }: HeaderProps) {
  const language = useAppStore((s) => s.language);
  const langConfig = LANG_BY_CODE[language];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b border-cool-gray flex items-center px-3 gap-2"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <button
        onClick={onMenuToggle}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        className="w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded-md hover:bg-off-white transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-teal"
      >
        <span className={`block w-5 h-0.5 bg-navy transition-all duration-200 origin-center ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
        <span className={`block w-5 h-0.5 bg-navy transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
        <span className={`block w-5 h-0.5 bg-navy transition-all duration-200 origin-center ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
      </button>

      <div className="flex-1 min-w-0">
        <span className="text-base font-semibold text-navy tracking-tight">FirstReport</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <LanguageBadge code={language} label={langConfig.label} />
        <NalsaButton language={language} />
      </div>
    </header>
  );
}

function LanguageBadge({ code, label }: { code: LangCode; label: string }) {
  return (
    <span className="inline-flex items-center px-2 py-1 bg-off-white text-navy text-xs font-medium rounded border border-cool-gray">
      {label}
    </span>
  );
}

function NalsaButton({ language }: { language: LangCode }) {
  return (
    <a
      href="tel:15100"
      aria-label={t('sosCall', language)}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-error text-white text-xs font-semibold rounded hover:bg-red-600 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
      15100
    </a>
  );
}
