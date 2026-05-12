'use client';

import { VoiceButton } from './VoiceButton';
import { useAppStore } from '../../stores/app-store';
import type { ChatPhase } from '../../hooks/use-chat-engine';

interface ChatControlsProps {
  phase: ChatPhase;
  error: string | null;
  onPress: () => void;
  onRelease: () => void;
  onCancel: () => void;
}

export function ChatControls({ phase, error, onPress, onRelease, onCancel }: ChatControlsProps) {
  const isOnline = useAppStore((s) => s.isOnline);

  return (
    <div
      className="shrink-0 border-t border-cool-gray bg-white px-4 py-3 flex flex-col items-center gap-2"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}
    >
      {error && (
        <p className="text-xs text-error text-center max-w-xs" role="alert">
          {error}
        </p>
      )}

      <VoiceButton
        phase={phase}
        onPress={onPress}
        onRelease={onRelease}
        onCancel={onCancel}
        disabled={!isOnline}
      />
    </div>
  );
}
