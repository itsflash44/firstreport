'use client';

import type { PersonaSpec } from '@/lib/personas';
import type { LangCode } from '@/lib/i18n';
import SpeakerButton from './SpeakerButton';

interface PersonaCardProps {
  persona: PersonaSpec;
  selected: boolean;
  onSelect: () => void;
  lang: LangCode;
}

export default function PersonaCard({ persona, selected, onSelect, lang }: PersonaCardProps) {
  const isHi = lang === 'hi-IN';
  const title = isHi ? persona.titleHi : persona.titleEn;
  const sub   = isHi ? persona.subHi   : persona.subEn;

  return (
    // div+role avoids nested <button> invalid HTML (SpeakerButton is a <button>)
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
      className={`
        group/card relative w-full text-left p-6 rounded-md cursor-pointer select-none
        border transition-all duration-200 ease-out
        ${selected
          ? 'bg-navy text-white border-navy shadow-md'
          : 'bg-white text-navy border-cool-gray/60 hover:shadow-md hover:border-teal/40'}
      `}
    >
      {/* Section label + selected badge */}
      <div className="flex items-center justify-between mb-4">
        <span className={`section-label ${selected ? 'text-white/60' : ''}`}>
          {personaSectionLabel(persona.id)}
        </span>
        {selected && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal/20 text-teal text-[10px] font-semibold rounded-full tracking-wide uppercase">
            ✓ Selected
          </span>
        )}
      </div>

      {/* Title row + speaker (stop propagation so click on speaker doesn't select card) */}
      <div className="flex items-start gap-2 mb-2">
        <h3 className={`font-serif text-2xl sm:text-3xl font-bold leading-tight tracking-tight flex-1 ${selected ? 'text-white' : 'text-navy'}`}>
          {title}
        </h3>
        <span
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className={`shrink-0 mt-1 transition-opacity duration-150 ${selected ? 'opacity-100' : 'opacity-0 group/card-hover:opacity-100'}`}
        >
          <SpeakerButton
            text={`${title}. ${sub}`}
            language={lang}
            variant="mini"
          />
        </span>
      </div>

      {/* Persona English name */}
      {!isHi && (
        <div className={`text-xs font-medium mb-3 ${selected ? 'text-white/60' : 'text-muted'}`}>
          {persona.titleEn}
        </div>
      )}

      {/* Description */}
      <p className={`text-sm leading-relaxed mb-4 ${selected ? 'text-white/85' : 'text-secondary'}`}>
        {sub}
      </p>

      {/* Divider */}
      <div className={`mb-4 h-px ${selected ? 'bg-white/15' : 'bg-cool-gray/60'}`} />

      {/* Statutes */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {persona.statutes.slice(0, 3).map((s) => (
          <span
            key={s}
            className={`font-mono text-[10px] tracking-[0.1em] uppercase pb-0.5 border-b
              ${selected ? 'border-teal/60 text-white/80' : 'border-teal/40 text-secondary'}
            `}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

function personaSectionLabel(id: string): string {
  const map: Record<string, string> = {
    standard: 'Civil Affairs',
    pocso:    'Juvenile',
    women_dv: 'Family Court',
    senior:   'Elder Welfare',
    advisor:  'General Counsel',
  };
  return map[id] ?? 'General';
}
