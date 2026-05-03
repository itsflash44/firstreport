'use client';

import SpeakerButton from './SpeakerButton';
import type { LangCode } from '@/lib/i18n';

interface DocumentCardProps {
  title: string;
  subtitle: string;
  status: 'ready' | 'locked' | 'sent';
  unlockDays?: number;
  language: LangCode | string;
  color?: 'red' | 'blue' | 'yellow';
  onPreview?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
}

export default function DocumentCard({
  title,
  subtitle,
  status,
  unlockDays,
  language,
  color: _color = 'blue',
  onPreview,
  onDownload,
  onShare,
}: DocumentCardProps) {
  const isLocked = status === 'locked';

  return (
    <div
      className={`fr-card p-5 border-l-4 transition-all duration-200
        ${isLocked
          ? 'border-l-cool-gray opacity-60'
          : status === 'sent'
          ? 'border-l-teal'
          : 'border-l-navy'}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`shrink-0 w-11 h-11 rounded-md flex items-center justify-center text-xl
          ${isLocked
            ? 'bg-cool-gray/50 text-muted'
            : status === 'sent'
            ? 'bg-teal/10 text-teal'
            : 'bg-navy/10 text-navy'}
        `}>
          {isLocked ? '🔒' : status === 'sent' ? '✓' : '§'}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base text-navy truncate">{title}</h3>
          <p className="text-sm text-secondary mt-0.5">{subtitle}</p>

          <div className="mt-2.5">
            {status === 'ready' && (
              <span className="badge-success inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold">
                READY
              </span>
            )}
            {status === 'locked' && unlockDays && (
              <span className="badge-warning inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold">
                LOCKED · {unlockDays}d
              </span>
            )}
            {status === 'sent' && (
              <span className="badge-teal inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold">
                SENT
              </span>
            )}
          </div>
        </div>

        <SpeakerButton text={`${title}. ${subtitle}`} language={language} variant="mini" />
      </div>

      {!isLocked && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-cool-gray/60">
          <button
            onClick={onPreview}
            className="flex-1 py-1.5 text-xs font-semibold text-navy hover:bg-navy/5 rounded transition-colors"
          >
            View
          </button>
          <button
            onClick={onDownload}
            className="flex-1 py-1.5 text-xs font-semibold bg-navy text-white rounded hover:bg-navy/90 transition-colors"
          >
            PDF
          </button>
          <button
            onClick={onShare}
            className="flex-1 py-1.5 text-xs font-semibold bg-teal text-white rounded hover:bg-teal/88 transition-colors"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
