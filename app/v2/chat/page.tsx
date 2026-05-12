'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/v2/stores/session-store';
import { useAppStore } from '@/v2/stores/app-store';
import { useChatEngine } from '@/v2/hooks/use-chat-engine';
import { useTtsPlayback } from '@/v2/hooks/use-tts-playback';
import { openingFor } from '@/v2/types/i18n';
import { ChatThread } from '@/v2/components/chat/ChatThread';
import { ChatControls } from '@/v2/components/chat/ChatControls';

export default function ChatPage() {
  const router = useRouter();
  const session = useSessionStore((s) => s.activeSession);
  const addTurn = useSessionStore((s) => s.addTurn);
  const language = useAppStore((s) => s.language);
  const { phase, error, startRecording, stopAndProcess, cancelRecording } = useChatEngine();
  const tts = useTtsPlayback();

  useEffect(() => {
    if (!session) {
      router.replace('/v2');
      return;
    }

    if (session.status === 'classified') {
      router.replace('/v2/classify');
      return;
    }

    if (session.transcript.length === 0) {
      const opening = openingFor(session.personaId, session.language);
      addTurn({ role: 'ai', text: opening });
      tts.speak(opening, session.language);
    }
  }, []);

  if (!session) return null;

  return (
    <div className="flex flex-col h-[calc(100dvh-56px)]">
      <ChatThread />
      <ChatControls
        phase={phase}
        error={error}
        onPress={startRecording}
        onRelease={stopAndProcess}
        onCancel={cancelRecording}
      />
    </div>
  );
}
