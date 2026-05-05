'use client';

import { useState } from 'react';
import type { PersonaId, LangCode } from '@/lib/i18n';

interface Props {
  bnssSection: string;
  offenseName: string;
  incident: string;
  language?: LangCode;
  persona?: PersonaId;
}

/**
 * LegalExplainer — "समझाएं" / "Explain" button
 * ───────────────────────────────────────────────
 * On tap, calls Gemma 4 to generate a 4-6 sentence plain-Hindi explanation
 * of what the BNSS section means for this specific victim. Result is spoken
 * aloud via Sarvam TTS so illiterate users can fully understand their rights.
 *
 * This is a key Kaggle hackathon feature: it proves Gemma isn't just
 * classifying data — it's acting as a legal assistant with real empathy.
 */
export default function LegalExplainer({ bnssSection, offenseName, incident, language = 'hi-IN', persona = 'standard' }: Props) {
  const [loading, setLoading]         = useState(false);
  const [explanation, setExplanation] = useState('');
  const [speaking, setSpeaking]       = useState(false);
  const [error, setError]             = useState('');

  const isHindi = language === 'hi-IN';

  const handleExplain = async () => {
    if (explanation) {
      // Already fetched — just re-speak
      await speakText(explanation);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/explain-law', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bnss_section: bnssSection, offense_name: offenseName, incident }),
      });
      const data = await res.json();
      if (data.success && data.explanation) {
        setExplanation(data.explanation);
        await speakText(data.explanation);
      } else {
        setError(isHindi ? 'समझाने में समस्या हुई।' : 'Could not generate explanation.');
      }
    } catch {
      setError(isHindi ? 'नेटवर्क समस्या। फिर कोशिश करें।' : 'Network error. Please retry.');
    }
    setLoading(false);
  };

  const speakText = async (text: string) => {
    setSpeaking(true);
    try {
      const ttsRes = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language, persona }),
      });
      if (ttsRes.ok) {
        const blob = await ttsRes.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); };
        audio.onerror = () => setSpeaking(false);
        await audio.play();
        return;
      }
    } catch { /* TTS failed, fall back silently */ }
    // Browser TTS fallback
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = language;
      utt.rate = 0.85;
      utt.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(utt);
    } else {
      setSpeaking(false);
    }
  };

  return (
    <div className="mt-5">
      {/* "समझाएं" trigger button */}
      {!explanation && (
        <button
          onClick={handleExplain}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded border border-navy/30
                     bg-navy/5 text-navy text-sm font-semibold hover:bg-navy hover:text-white
                     transition-colors disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
              <span>{isHindi ? 'Gemma समझा रहा है…' : 'Gemma is thinking…'}</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
              <span>{isHindi ? '🤖 समझाएं — Gemma बताएगा' : '🤖 Explain in Simple Hindi'}</span>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="text-xs text-error mt-2">{error}</p>
      )}

      {/* Explanation card — shown once fetched */}
      {explanation && (
        <div className="mt-3 p-4 bg-navy/5 border border-navy/20 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-navy">
              🤖 {isHindi ? 'Gemma का सरल स्पष्टीकरण' : 'Gemma\'s Plain-Language Explanation'}
            </span>
            <button
              onClick={() => speakText(explanation)}
              disabled={speaking}
              title={isHindi ? 'सुनें' : 'Listen'}
              className="flex items-center gap-1 text-xs text-navy hover:text-teal transition-colors disabled:opacity-50"
            >
              {speaking ? (
                <span className="w-3 h-3 border border-navy/40 border-t-navy rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
              )}
              <span>{isHindi ? 'सुनें' : 'Listen'}</span>
            </button>
          </div>

          <p className="text-sm text-secondary leading-relaxed">{explanation}</p>

          <p className="text-xs text-muted italic">
            {isHindi
              ? 'यह कानूनी सलाह नहीं है — NALSA 15100 से ज़रूर पूछें।'
              : 'Not legal advice — always verify with NALSA 15100.'}
          </p>
        </div>
      )}
    </div>
  );
}
