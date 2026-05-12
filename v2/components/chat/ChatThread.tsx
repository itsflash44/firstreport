'use client';

import { useEffect, useRef } from 'react';
import { useSessionStore } from '../../stores/session-store';
import { ChatBubble } from './ChatBubble';

export function ChatThread() {
  const transcript = useSessionStore((s) => s.activeSession?.transcript ?? []);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript.length]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4" role="log" aria-live="polite" aria-label="Chat messages">
      {transcript.map((turn) => (
        <ChatBubble key={turn.id} turn={turn} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
