'use client';

interface TrustScoreProps {
  confidence: 'high' | 'medium' | 'low';
  section: string;
}

const CONFIDENCE_CONFIG = {
  high: { label: 'High Confidence', pct: 90, color: 'bg-green-500', ring: 'ring-green-200' },
  medium: { label: 'Medium Confidence', pct: 65, color: 'bg-yellow-500', ring: 'ring-yellow-200' },
  low: { label: 'Low Confidence', pct: 35, color: 'bg-red-500', ring: 'ring-red-200' },
};

export function TrustScore({ confidence, section }: TrustScoreProps) {
  const config = CONFIDENCE_CONFIG[confidence];

  return (
    <div className="bg-white rounded-xl border border-cool-gray shadow-sm p-5">
      <p className="text-xs text-text-secondary uppercase tracking-wide font-medium mb-4">
        System Transparency
      </p>

      <div className="flex items-center gap-6">
        <div className={`relative w-20 h-20 rounded-full ${config.ring} ring-4 flex items-center justify-center`}>
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#E2E8F0" strokeWidth="6" />
            <circle
              cx="40" cy="40" r="34" fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${config.pct * 2.136} 213.6`}
              className={confidence === 'high' ? 'text-green-500' : confidence === 'medium' ? 'text-yellow-500' : 'text-red-500'}
              style={{ transition: 'stroke-dasharray 1s ease-out' }}
            />
          </svg>
          <span className="absolute text-lg font-bold text-navy">{config.pct}%</span>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-navy">{config.label}</p>
          <p className="text-xs text-text-secondary">BNSS Section {section}</p>
          <p className="text-xs text-text-muted">
            AI classification confidence based on incident description analysis
          </p>
        </div>
      </div>
    </div>
  );
}
