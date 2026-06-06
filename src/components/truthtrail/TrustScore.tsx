'use client';

interface TrustScoreProps {
  confidence: 'high' | 'medium' | 'low';
  section: string;
}

const CONFIDENCE_CONFIG = {
  high: { label: 'High Confidence', pct: 90, ringColor: 'ring-success/15', strokeColor: 'text-success' },
  medium: { label: 'Medium Confidence', pct: 65, ringColor: 'ring-warning/15', strokeColor: 'text-warning' },
  low: { label: 'Low Confidence', pct: 35, ringColor: 'ring-error/15', strokeColor: 'text-error' },
};

export function TrustScore({ confidence, section }: TrustScoreProps) {
  const config = CONFIDENCE_CONFIG[confidence];

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/70 shadow-xs p-5">
      <p className="text-[10px] text-secondary/40 uppercase tracking-[0.1em] font-semibold mb-4">
        System Transparency
      </p>

      <div className="flex items-center gap-6">
        <div className={`relative w-20 h-20 rounded-full ${config.ringColor} ring-4 flex items-center justify-center`}>
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#E8ECF1" strokeWidth="5" />
            <circle
              cx="40" cy="40" r="34" fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${config.pct * 2.136} 213.6`}
              className={config.strokeColor}
              style={{ transition: 'stroke-dasharray 1s ease-out' }}
            />
          </svg>
          <span className="absolute text-lg font-bold text-navy">{config.pct}%</span>
        </div>

        <div className="space-y-1.5">
          <p className="text-[14px] font-semibold text-navy">{config.label}</p>
          <p className="text-[12px] text-secondary/60 font-medium">BNSS Section {section}</p>
          <p className="text-[11px] text-secondary/40 leading-relaxed">
            AI classification confidence based on incident description analysis
          </p>
        </div>
      </div>
    </div>
  );
}
