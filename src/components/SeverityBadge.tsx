'use client';

import type { Severity, SeverityVerdict } from '@/lib/personas';
import { severityCopy } from '@/lib/personas';
import type { LangCode } from '@/lib/i18n';

interface SeverityBadgeProps {
  verdict: SeverityVerdict;
  lang: LangCode;
}

const STYLE: Record<Severity, { header: string; dot: string; tag: string; aria: string }> = {
  normal:   { header: 'bg-navy/8 border-b border-cool-gray', dot: 'bg-navy',    tag: 'NORMAL',   aria: 'Routine' },
  serious:  { header: 'bg-warning/10 border-b border-warning/30',  dot: 'bg-warning', tag: 'SERIOUS',  aria: 'Serious' },
  critical: { header: 'severity-critical',                          dot: 'bg-white',   tag: 'CRITICAL', aria: 'Critical' },
};

export default function SeverityBadge({ verdict, lang }: SeverityBadgeProps) {
  const style = STYLE[verdict.level];
  const copy = severityCopy(verdict.level, lang);
  const isCritical = verdict.level === 'critical';

  return (
    <div className="fr-card overflow-hidden animate-pop-in">
      <div className={`${style.header} px-4 py-2.5 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${style.dot}`} />
          <span className={`font-semibold text-xs tracking-widest uppercase ${isCritical ? 'text-white' : 'text-primary'}`}>
            {style.tag}
          </span>
        </div>
        <span className={`text-xs font-medium ${isCritical ? 'text-white/80' : 'text-muted'}`}>
          § Verdict
        </span>
      </div>

      <div className="p-4">
        <div className="font-semibold text-lg text-navy">{copy.title}</div>
        <p className="text-sm text-secondary mt-1">{copy.sub}</p>

        {verdict.resources?.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {verdict.resources.map((r) => (
              <li key={r} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-error shrink-0" />
                <span className="text-secondary">{r}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
