'use client';

import SpeakerButton from './chat/SpeakerButton';
import type { LangCode, PersonaId } from '@/lib/i18n';

interface TtsLabelProps {
  /** The text to be read aloud (may differ from visible children). */
  text: string;
  language: LangCode | string;
  persona?: PersonaId;
  children: React.ReactNode;
  /** Extra classes on the wrapper span. */
  className?: string;
  /** If true the speaker is always visible, not just on hover. */
  alwaysVisible?: boolean;
}

/**
 * Wraps any UI element with a hover-revealed speaker icon.
 * For illiterate users — clicking the speaker reads out `text` in `language`.
 *
 * Usage:
 *   <TtsLabel text="Step 1: Select your language" language={lang}>
 *     <h2>Step 1</h2>
 *   </TtsLabel>
 */
export default function TtsLabel({
  text,
  language,
  persona = 'standard',
  children,
  className = '',
  alwaysVisible = false,
}: TtsLabelProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 group/tts ${className}`}>
      {children}
      <span
        className={`shrink-0 transition-opacity duration-150
          ${alwaysVisible ? 'opacity-100' : 'opacity-0 group-hover/tts:opacity-100'}`}
      >
        <SpeakerButton
          text={text}
          language={language}
          persona={persona}
          variant="mini"
        />
      </span>
    </span>
  );
}
