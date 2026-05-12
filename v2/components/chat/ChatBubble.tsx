'use client';

import { memo } from 'react';
import type { ChatTurn } from '../../types/index';

interface ChatBubbleProps {
  turn: ChatTurn;
}

export const ChatBubble = memo(function ChatBubble({ turn }: ChatBubbleProps) {
  const isUser = turn.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`
          max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${isUser
            ? 'bg-teal text-white rounded-br-md'
            : 'bg-white text-navy border border-cool-gray rounded-bl-md shadow-xs'}
        `}
      >
        {turn.text}
      </div>
    </div>
  );
});
