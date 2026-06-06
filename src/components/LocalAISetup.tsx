'use client';

/**
 * DEPRECATED — Ollama local AI setup removed.
 * AI now runs via Gemma 3 on Google AI Studio (cloud).
 * This component is kept as a harmless stub so old JSX imports compile.
 */

interface Props {
  language?: 'hi-IN' | 'en-IN';
  onStatusChange?: (status: unknown) => void;
}

export default function LocalAISetup({ language = 'hi-IN' }: Props) {
  return (
    <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-800 space-y-1">
      <p className="font-semibold">
        {language === 'hi-IN' ? '✓ AI सक्रिय' : '✓ AI Active'}
      </p>
      <p>
        {language === 'hi-IN'
          ? 'Gemma 3 — Google AI Studio द्वारा संचालित'
          : 'Gemma 3 — powered by Google AI Studio'}
      </p>
      <p className="text-teal-600">
        {language === 'hi-IN'
          ? 'NALSA हेल्पलाइन: 15100'
          : 'NALSA Helpline: 15100'}
      </p>
    </div>
  );
}
