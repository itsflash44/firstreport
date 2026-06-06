'use client';

import { memo } from 'react';
import SpeakerButton from './SpeakerButton';
import type { PersonaId } from '@/lib/i18n';

interface ChatBubbleProps {
  role: 'ai' | 'user';
  text: string;
  language: string;
  isTyping?: boolean;
  personaColor?: 'red' | 'blue' | 'yellow';
  persona?: PersonaId;
}

// memo prevents re-rendering old bubbles when new messages are added
const ChatBubble = memo(function ChatBubble({
  role,
  text,
  language,
  isTyping = false,
  personaColor: _personaColor = 'blue',
  persona = 'standard',
}: ChatBubbleProps) {
  const isAI = role === 'ai';

  if (isTyping) {
    return (
      <div className="flex justify-start mb-5 animate-fade-in">
        <div className="bg-white border border-cool-gray/60 rounded-lg rounded-tl-sm shadow-xs px-5 py-4 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-navy/30 animate-pulse-square" />
          <span className="w-2.5 h-2.5 rounded-full bg-navy/30 animate-pulse-square" style={{ animationDelay: '200ms' }} />
          <span className="w-2.5 h-2.5 rounded-full bg-navy/30 animate-pulse-square" style={{ animationDelay: '400ms' }} />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-5 relative group animate-slide-up`}>
      <div
        className={`relative px-5 py-4 max-w-[85%] text-[15px] sm:text-base leading-relaxed
          ${isAI
            ? 'chat-bubble-ai bg-white text-primary border border-cool-gray/60 rounded-lg rounded-tl-sm shadow-xs'
            : 'chat-bubble-user bg-navy text-white rounded-lg rounded-tr-sm shadow-xs'}
        `}
      >
        <p className="font-medium whitespace-pre-wrap">{text}</p>
      </div>

      {isAI && (
        /* FIX: Mobile has no hover events — always visible on small screens.
           On desktop, fade in on hover only (less visual noise).
           touch-target wrapper guarantees ≥44px tap area on Galaxy A03.    */
        <div className="absolute -bottom-3 -right-3 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 z-10">
          <div className="touch-target">
            <SpeakerButton text={text} language={language} persona={persona} variant="mini" />
          </div>
        </div>
      )}
    </div>
  );
});

export default ChatBubble;
