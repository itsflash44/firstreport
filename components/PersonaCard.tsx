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
        group/card relative w-full text-left p-6 rounded-sm cursor-pointer select-none
        border transition-all duration-500 ease-in-out
        ${selected
          ? 'text-white border-transparent shadow-md'
          : 'bg-white text-navy-deep border-cool-gray hover:shadow-lift hover:border-teal/50 hover:-translate-y-0.5'}
      `}
      style={selected ? { background: 'linear-gradient(135deg, #0F1F3D 0%, #1A2A44 100%)' } : {}}
    >
      {/* Section label + selected badge */}
      <div className="flex items-center justify-between mb-4">
        {/* Use inline style to defeat CSS specificity of .section-label global color rule */}
        <span
          className="section-label"
          style={{ color: selected ? 'rgba(255,255,255,0.65)' : undefined }}
        >
          {personaSectionLabel(persona.id)}
        </span>
        {selected && (
          <span className="citation-chip citation-chip-dark">Selected</span>
        )}
      </div>

      {/* Title row + speaker (stop propagation so click on speaker doesn't select card) */}
      <div className="flex items-start gap-2 mb-2">
        <h3
          className="font-serif text-2xl sm:text-3xl font-bold leading-tight tracking-tight flex-1"
          style={{ color: selected ? '#ffffff' : '#0F1F3D' }}
        >
          {title}
        </h3>
        <span
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className={`shrink-0 mt-1 transition-opacity duration-150 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
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
