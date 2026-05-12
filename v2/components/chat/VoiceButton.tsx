'use client';

import type { ChatPhase } from '../../hooks/use-chat-engine';
import { useAppStore } from '../../stores/app-store';
import { t } from '../../types/i18n';

interface VoiceButtonProps {
  phase: ChatPhase;
  onPress: () => void;
  onRelease: () => void;
  onCancel: () => void;
  disabled: boolean;
}

export function VoiceButton({ phase, onPress, onRelease, onCancel, disabled }: VoiceButtonProps) {
  const language = useAppStore((s) => s.language);
  const isRecording = phase === 'recording';
  const isProcessing = phase === 'transcribing' || phase === 'thinking' || phase === 'speaking';

  const label = isRecording
    ? t('listening', language)
    : isProcessing
      ? t('thinking', language)
      : t('speak', language);

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onPointerDown={(e) => {
          if (disabled || isProcessing) return;
          e.preventDefault();
          if (isRecording) {
            onRelease();
          } else {
            onPress();
          }
        }}
        disabled={disabled || isProcessing}
        aria-label={label}
        className={`
          relative w-16 h-16 rounded-full flex items-center justify-center
          transition-all duration-200 select-none
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal
          ${isRecording
            ? 'bg-error text-white scale-110 shadow-lg'
            : isProcessing
              ? 'bg-cool-gray text-text-secondary cursor-wait'
              : 'bg-teal text-white shadow-md hover:shadow-lg active:scale-95'}
          ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
        `}
      >
        {isRecording ? (
          <MicActiveIcon />
        ) : isProcessing ? (
          <SpinnerIcon />
        ) : (
          <MicIcon />
        )}

        {isRecording && (
          <span className="absolute inset-0 rounded-full border-2 border-error animate-ping opacity-30" />
        )}
      </button>

      <span className="text-xs text-text-secondary font-medium h-4">
        {label}
      </span>

      {isRecording && (
        <button
          onClick={onCancel}
          className="text-xs text-error underline"
        >
          Cancel
        </button>
      )}
    </div>
  );
}

function MicIcon() {
  return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2M12 19v4m-4 0h8" />
    </svg>
  );
}

function MicActiveIcon() {
  return (
    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
      <rect x="9" y="2" width="6" height="14" rx="3" />
      <path d="M19 10v2a7 7 0 01-14 0v-2h2v2a5 5 0 0010 0v-2h2zM11 19.93V22h-3v2h8v-2h-3v-2.07A9 9 0 0021 11h-2a7 7 0 01-14 0H3a9 9 0 008 8.93z" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <path d="M12 2a10 10 0 019.17 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
