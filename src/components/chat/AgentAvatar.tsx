'use client';

import { memo } from 'react';
import type { PersonaSpec } from '@/lib/personas';
import FirstReportLogo from '../FirstReportLogo';

interface AgentAvatarProps {
  persona: PersonaSpec;
  size?: number;
  speaking?: boolean;
  compact?: boolean;
}

/**
 * Agent avatar panel — shows the FirstReport shield logo as the "face"
 * of the AI agent, with speaking animation and editorial caption.
 *
 * compact mode → small square for chat header
 * full mode    → large panel for home page right column
 */
const AgentAvatar = memo(function AgentAvatar({
  persona,
  size = 320,
  speaking = false,
  compact = false,
}: AgentAvatarProps) {
  const figNum = personaFigNumber(persona.id);

  if (compact) {
    return (
      <div
        className="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-sm bg-ivory border border-cool-gray flex items-center justify-center relative"
        aria-label={`${persona.titleEn} agent`}
      >
        <FirstReportLogo variant="icon" size={28} theme="light" />
        {speaking && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-teal border-2 border-white animate-rec" />
        )}
      </div>
    );
  }

  return (
    <figure className="w-full" style={{ maxWidth: size }}>
      <div
        className="relative aspect-square bg-ivory border border-cool-gray rounded-md overflow-hidden flex flex-col items-center justify-center"
        style={{ minHeight: Math.min(size, 300) }}
      >
        {/* Edition tag */}
        <div className="absolute top-3 left-3 px-2 py-1 bg-white border border-cool-gray rounded-sm font-mono text-[10px] tracking-[0.28em] uppercase text-secondary">
          Fig. {figNum}
        </div>

        {/* Logo — the "face" */}
        <div className="flex flex-col items-center gap-4">
          <FirstReportLogo variant="icon" size={Math.round(size * 0.38)} theme="light" />

          {/* Speaking wave animation */}
          {speaking && (
            <div className="flex items-end gap-0.5 h-6">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="w-1 bg-teal rounded-full animate-wave"
                  style={{
                    height: '100%',
                    animationDelay: `${i * 100}ms`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Speaking pip — bottom right */}
        {speaking && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white border border-cool-gray rounded-sm px-2 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal animate-rec" />
            <span className="font-mono text-[9px] tracking-[0.28em] uppercase text-secondary">Live</span>
          </div>
        )}
      </div>

      <figcaption className={`mt-2.5 font-mono text-[10px] tracking-[0.28em] uppercase
        ${speaking ? 'text-teal' : 'text-secondary'}`}>
        Fig. {figNum} — {persona.titleEn} · FirstReport / 2026
      </figcaption>
    </figure>
  );
});

export default AgentAvatar;

function personaFigNumber(id: string): string {
  const map: Record<string, string> = {
    standard: '1.1',
    pocso:    '1.2',
    women_dv: '1.3',
    senior:   '1.4',
    advisor:  '1.5',
  };
  return map[id] ?? '1.0';
}
