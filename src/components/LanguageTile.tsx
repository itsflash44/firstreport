'use client';

import type { LanguageConfig } from '@/lib/i18n';
import SpeakerButton from './chat/SpeakerButton';

interface LanguageTileProps {
  lang: LanguageConfig;
  selected: boolean;
  onSelect: () => void;
}

export default function LanguageTile({ lang, selected, onSelect }: LanguageTileProps) {
  return (
    // div+role instead of <button> so we can nest the SpeakerButton <button> inside legally
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
      lang={lang.bcp47}
      className={`
        group relative flex flex-col justify-between cursor-pointer select-none
        h-28 sm:h-32 px-4 py-3 rounded-sm
        border transition-all duration-500 ease-in-out
        ${selected
          ? 'text-white border-transparent shadow-md'
          : 'bg-white text-navy-deep border-cool-gray hover:border-teal hover:shadow-sm hover:-translate-y-0.5'}
      `}
      style={selected ? { background: 'linear-gradient(135deg, #0F1F3D 0%, #1A2A44 100%)' } : {}}
    >
      {/* Top row — ISO code (mono) + speaker + selected dot */}
      <div className="flex items-center justify-between">
        <span className={`font-mono text-[10px] tracking-[0.28em] uppercase ${selected ? 'text-white/70' : 'text-muted'}`}>
          {lang.code}
        </span>
        <div className="flex items-center gap-1.5">
          {selected && <span className="w-1.5 h-1.5 rounded-full bg-teal" />}
          <span
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            className={`transition-opacity duration-150 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          >
            <SpeakerButton
              text={`${lang.sublabel} — ${lang.label}`}
              language={lang.code}
              variant="mini"
            />
          </span>
        </div>
      </div>

      {/* Native script — serif headline */}
      <div className="text-left">
        <div className={`font-serif text-3xl sm:text-4xl leading-none tracking-tight truncate ${selected ? 'text-white' : 'text-navy-deep'}`}>
          {lang.label}
        </div>
        <div className={`font-sans text-[10px] tracking-[0.1em] uppercase mt-2 ${selected ? 'text-white/70' : 'text-muted'}`}>
          {lang.sublabel}
        </div>
      </div>
    </div>
  );
}
