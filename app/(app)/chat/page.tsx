'use client';

import { useState, useRef, useEffect, Suspense, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ChatBubble from '@/components/ChatBubble';
import MicButton from '@/components/MicButton';
import SpeakerButton from '@/components/SpeakerButton';
import AgentAvatar from '@/components/AgentAvatar';
import FirstReportLogo from '@/components/FirstReportLogo';
import SeverityBadge from '@/components/SeverityBadge';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { logHistoryEntry } from '@/lib/history';
import {
  type LangCode,
  type PersonaId,
  openingFor,
  t,
  LANG_BY_CODE,
} from '@/lib/i18n';
import {
  PERSONA_BY_ID,
  classifySeverity,
  type SeverityVerdict,
} from '@/lib/personas';

/** Minimum number of user turns before the AI is allowed to signal completion */
const MIN_TURNS_BEFORE_COMPLETE = 2;
/** Hard cap: after this many turns always wrap up */
const MAX_TURNS = 6;

interface ChatTurn {
  role: 'ai' | 'user';
  text: string;
}

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Type-narrow + sanitize search params. Default to Hindi/Standard.
  const rawLang = searchParams.get('lang');
  const language: LangCode =
    rawLang && (LANG_BY_CODE as Record<string, unknown>)[rawLang]
      ? (rawLang as LangCode)
      : 'hi-IN';

  const rawPersona = searchParams.get('persona');
  const personaId: PersonaId =
    rawPersona && (PERSONA_BY_ID as Record<string, unknown>)[rawPersona]
      ? (rawPersona as PersonaId)
      : 'standard';

  const persona = PERSONA_BY_ID[personaId] ?? PERSONA_BY_ID.standard;
  const langCfg = LANG_BY_CODE[language] ?? LANG_BY_CODE['hi-IN'];

  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isAITyping, setIsAITyping] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [verdict, setVerdict] = useState<SeverityVerdict | null>(null);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [lastAiText, setLastAiText] = useState('');
  const [networkError, setNetworkError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Opening line — derived from i18n + persona
  const openingText = useMemo(() => openingFor(personaId, language), [personaId, language]);

  // Initial AI greeting + auto-TTS
  useEffect(() => {
    setMessages([{ role: 'ai', text: openingText }]);
    setLastAiText(openingText);
    setAgentSpeaking(true);
    const tm = setTimeout(() => setAgentSpeaking(false), 2500);
    if (typeof document !== 'undefined') document.documentElement.lang = language;
    return () => clearTimeout(tm);
  }, [openingText, language]);

  // Switch language without losing chat history
  const handleLanguageChange = useCallback((next: LangCode) => {
    sessionStorage.setItem('language', next);
    router.replace(`/chat?lang=${next}&persona=${personaId}`);
  }, [router, personaId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAITyping]);

  const handleUserInput = async (text: string) => {
    if (!text.trim()) return;

    const newMessages: ChatTurn[] = [...messages, { role: 'user', text: text.trim() }];
    setMessages(newMessages);
    setTextInput('');
    setIsAITyping(true);

    // Local severity check on every user turn
    const localVerdict = classifySeverity(personaId, text);
    setVerdict(localVerdict);

    const newTurnCount = turnCount + 1;
    setTurnCount(newTurnCount);

    try {
      const res = await fetch('/api/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text.trim(),
          history: newMessages.map((m) => ({ role: m.role, content: m.text })),
          language,
          persona: personaId,
        }),
      });

      // Handle non-OK responses gracefully — show ephemeral error banner, do NOT add to transcript
      if (!res.ok) {
        setNetworkError(networkErrorFor(language));
        setTimeout(() => setNetworkError(null), 6000);
        setIsAITyping(false);
        return;
      }

      const data = await res.json();

      // Only allow completion signal after minimum turns AND either the AI
      // says it's done OR we've hit the hard cap.
      const canComplete = newTurnCount >= MIN_TURNS_BEFORE_COMPLETE;
      const shouldComplete = canComplete && (data.isComplete || newTurnCount >= MAX_TURNS);

      if (shouldComplete) {
        const summaryText =
          data.summary ||
          newMessages.filter((m) => m.role === 'user').map((m) => m.text).join('. ');
        const closingMsg = closingMessageFor(language);
        setMessages((prev) => [...prev, { role: 'ai', text: closingMsg }]);
        setLastAiText(closingMsg);
        setIsAITyping(false);

        sessionStorage.setItem('incident_summary', summaryText);
        sessionStorage.setItem('chat_history', JSON.stringify(newMessages));
        sessionStorage.setItem('severity', localVerdict.level);

        logHistoryEntry({
          ts: Date.now(),
          personaId,
          language,
          summary: summaryText,
          severity: localVerdict.level,
          transcript: newMessages,   // full turn-by-turn conversation saved
        });

        setTimeout(() => router.push(`/classify?lang=${language}&persona=${personaId}`), 2400);
      } else if (data.question) {
        setMessages((prev) => [...prev, { role: 'ai', text: data.question }]);
        setLastAiText(data.question);
        setIsAITyping(false);
      } else if (data.isComplete && !canComplete) {
        // AI wants to finish but we haven't reached MIN_TURNS — ask one more question
        const followUp = followUpFor(language);
        setMessages((prev) => [...prev, { role: 'ai', text: followUp }]);
        setLastAiText(followUp);
        setIsAITyping(false);
      } else {
        setIsAITyping(false);
      }
    } catch {
      setNetworkError(networkErrorFor(language));
      setTimeout(() => setNetworkError(null), 6000);
      setIsAITyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex flex-col">

      {/* === AGENT INFO BAR === */}
      <div className="bg-white border-b border-cool-gray">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <AgentAvatar persona={persona} compact speaking={agentSpeaking || isAITyping} />

          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-navy truncate">{persona.titleEn}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${isAITyping ? 'bg-warning animate-rec' : 'bg-success'}`}
              />
              <span className="text-[11px] text-muted">
                {isAITyping ? t('thinking', language) : `${langCfg.label} · ${t('online', language)}`}
              </span>
            </div>
          </div>

          <LanguageSwitcher current={language} onChange={handleLanguageChange} compact />

          <a
            href="tel:15100"
            id="nalsa-chat-btn"
            className="shrink-0 hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-error text-white text-xs font-semibold rounded hover:bg-red-600 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-rec" />
            SOS · 15100
          </a>
        </div>
      </div>

      {/* === MESSAGES === */}
      <main className="flex-1 overflow-y-auto bg-ivory">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          {messages.map((msg, i) => (
            <div key={i} className="group relative">
              <ChatBubble
                role={msg.role}
                text={msg.text}
                language={language}
                personaColor={persona.color}
                persona={personaId}
              />
              {/* Speaker button on every AI message — visible on hover or always on last */}
              {msg.role === 'ai' && (
                <div className={`absolute top-2 right-2 transition-opacity duration-150
                  ${i === messages.length - 1 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <SpeakerButton
                    text={msg.text}
                    language={language}
                    persona={personaId}
                    variant="mini"
                  />
                </div>
              )}
            </div>
          ))}
          {isAITyping && (
            <ChatBubble
              role="ai"
              text=""
              language={language}
              isTyping
              personaColor={persona.color}
              persona={personaId}
            />
          )}

          {verdict && (
            <div className="my-6">
              <SeverityBadge verdict={verdict} lang={language} />
            </div>
          )}

          <div ref={chatEndRef} className="h-4" />
        </div>
      </main>

      {/* === STICKY INPUT === */}
      <footer className="sticky bottom-0 z-20 bg-white border-t border-cool-gray shadow-sm">
        {/* Network error banner — ephemeral, never saved to transcript */}
        {networkError && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-3">
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-sm text-sm font-medium"
                 style={{ background: 'rgba(217,83,79,0.08)', border: '1px solid rgba(217,83,79,0.25)', color: '#C0392B' }}>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
              <span lang={language}>{networkError}</span>
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-5 grid sm:grid-cols-[auto,1fr] gap-4 sm:gap-5 items-end">
          <div className="flex justify-center sm:justify-start">
            <MicButton onTranscript={handleUserInput} language={language} disabled={isAITyping} />
          </div>

          <div className="flex items-end gap-2 sm:gap-3">
            <textarea
              ref={textareaRef}
              value={textInput}
              rows={1}
              onChange={(e) => {
                setTextInput(e.target.value);
                // Auto-resize: shrink then grow to fit content, cap at ~5 lines (128px)
                const ta = e.target;
                ta.style.height = 'auto';
                ta.style.height = Math.min(ta.scrollHeight, 128) + 'px';
              }}
              onKeyDown={(e) => {
                // Send on Enter (without Shift); Shift+Enter adds new line
                if (e.key === 'Enter' && !e.shiftKey && textInput.trim()) {
                  e.preventDefault();
                  handleUserInput(textInput);
                  if (textareaRef.current) textareaRef.current.style.height = 'auto';
                }
              }}
              placeholder={t('speak', language)}
              disabled={isAITyping}
              lang={language}
              className="fr-input flex-1 min-w-0 px-4 py-3 text-base resize-none overflow-y-auto"
              style={{ lineHeight: '1.5', minHeight: '48px', maxHeight: '128px' }}
            />
            <button
              onClick={() => {
                if (textInput.trim()) {
                  handleUserInput(textInput);
                  if (textareaRef.current) textareaRef.current.style.height = 'auto';
                }
              }}
              disabled={isAITyping || !textInput.trim()}
              aria-label={t('sendMessage', language)}
              className="shrink-0 w-11 h-11 sm:w-12 sm:h-12 bg-navy text-white rounded-md
                         hover:bg-navy/90 active:scale-95
                         disabled:opacity-40 disabled:cursor-not-allowed
                         flex items-center justify-center transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Floating speaker re-reads the last AI message */}
        <SpeakerButton
          key={`${personaId}-${language}-${lastAiText.slice(0, 20)}`}
          text={lastAiText}
          language={language}
          persona={personaId}
          variant="floating"
          autoPlay={false}
        />
      </footer>
    </div>
  );
}

function closingMessageFor(lang: LangCode): string {
  const map: Record<LangCode, string> = {
    'hi-IN': 'धन्यवाद। मैंने सब समझ लिया। अब मैं दस्तावेज़ तैयार कर रहा हूँ।',
    'en-IN': 'Thank you. I have understood everything. Preparing your documents now.',
    'bn-IN': 'ধন্যবাদ। আমি সব বুঝেছি। এখন আপনার নথি প্রস্তুত করছি।',
    'ta-IN': 'நன்றி. நான் எல்லாம் புரிந்துகொண்டேன். இப்போது உங்கள் ஆவணங்களைத் தயாரிக்கிறேன்.',
    'te-IN': 'ధన్యవాదాలు. నేను అన్నీ అర్థం చేసుకున్నాను. ఇప్పుడు మీ పత్రాలను సిద్ధం చేస్తున్నాను.',
    'mr-IN': 'धन्यवाद. मला सर्व समजले आहे. आता तुमची कागदपत्रे तयार करत आहे.',
    'gu-IN': 'આભાર. હું બધું સમજી ગયો છું. હવે તમારા દસ્તાવેજો તૈયાર કરી રહ્યો છું.',
    'kn-IN': 'ಧನ್ಯವಾದಗಳು. ನಾನು ಎಲ್ಲವನ್ನೂ ಅರ್ಥಮಾಡಿಕೊಂಡಿದ್ದೇನೆ. ಈಗ ನಿಮ್ಮ ದಾಖಲೆಗಳನ್ನು ಸಿದ್ಧಪಡಿಸುತ್ತಿದ್ದೇನೆ.',
    'ml-IN': 'നന്ദി. ഞാൻ എല്ലാം മനസ്സിലാക്കി. ഇപ്പോൾ നിങ്ങളുടെ രേഖകൾ തയ്യാറാക്കുകയാണ്.',
    'pa-IN': 'ਧੰਨਵਾਦ। ਮੈਂ ਸਭ ਸਮਝ ਲਿਆ ਹੈ। ਹੁਣ ਤੁਹਾਡੇ ਦਸਤਾਵੇਜ਼ ਤਿਆਰ ਕਰ ਰਿਹਾ ਹਾਂ।',
    'od-IN': 'ଧନ୍ୟବାଦ। ମୁଁ ସବୁ ବୁଝିଛି। ବର୍ତ୍ତମାନ ଆପଣଙ୍କ ଦଲିଲ ପ୍ରସ୍ତୁତ କରୁଛି।',
  };
  return map[lang] ?? map['en-IN'];
}

function followUpFor(lang: LangCode): string {
  const map: Record<LangCode, string> = {
    'hi-IN': 'क्या आप थोड़ा और बता सकते हैं? जैसे कब, कहाँ, और कौन शामिल था?',
    'en-IN': 'Could you tell me a bit more? For example, when, where, and who was involved?',
    'bn-IN': 'আপনি কি আরও কিছু বলতে পারবেন? যেমন কখন, কোথায় এবং কে জড়িত ছিল?',
    'ta-IN': 'கொஞ்சம் அதிகமாக சொல்ல முடியுமா? எப்போது, எங்கே, யார் சம்பந்தப்பட்டிருந்தார்கள்?',
    'te-IN': 'మీరు కొంచెం ఎక్కువ చెప్పగలరా? ఎప్పుడు, ఎక్కడ, ఎవరు పాల్గొన్నారు?',
    'mr-IN': 'तुम्ही थोडे अधिक सांगू शकाल का? केव्हा, कुठे आणि कोण सामील होते?',
    'gu-IN': 'શું તમે થોડું વધારે જણાવી શકો? ક્યારે, ક્યાં અને કોણ સામેલ હતું?',
    'kn-IN': 'ಸ್ವಲ್ಪ ಹೆಚ್ಚು ಹೇಳಬಲ್ಲಿರಾ? ಯಾವಾಗ, ಎಲ್ಲಿ ಮತ್ತು ಯಾರು ಒಳಗೊಂಡಿದ್ದರು?',
    'ml-IN': 'അൽപ്പം കൂടി പറയാൻ കഴിയുമോ? എപ്പോൾ, എവിടെ, ആര് ഉൾപ്പെട്ടിരുന്നു?',
    'pa-IN': 'ਕੀ ਤੁਸੀਂ ਹੋਰ ਦੱਸ ਸਕਦੇ ਹੋ? ਜਿਵੇਂ ਕਦੋਂ, ਕਿੱਥੇ ਅਤੇ ਕੌਣ ਸ਼ਾਮਲ ਸੀ?',
    'od-IN': 'ଆପଣ ଆଉ ଟିକିଏ ବଳ ବ‌ିବେ ଦୟାକ‌ରି? ଯେପ‌ରି - ​​କ‌ଦ‌ି, କ‌ଉଠ‌ା, ​​ଏ‌ବ‌ଂ ​​କ‌ଏ ​​​​​​​​​​ଜ‌ड़‌ित ​​ ​​ ​​ ​​​​​​​​​​ ​​​​ ​​​​​​ ​ ​​​​​​ ​ ​​ ​​​ ​ ​​ ​​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​​ ​ ​​ ​ ​ ​ ​ ​ ​ ​ ​ ​​?',
  };
  return map[lang] ?? map['en-IN'];
}

function networkErrorFor(lang: LangCode): string {
  const map: Record<LangCode, string> = {
    'hi-IN': 'नेटवर्क में समस्या है। दोबारा कोशिश करें।',
    'en-IN': 'Network issue. Please try again.',
    'bn-IN': 'নেটওয়ার্কে সমস্যা। আবার চেষ্টা করুন।',
    'ta-IN': 'நெட்வொர்க் சிக்கல். மீண்டும் முயற்சிக்கவும்.',
    'te-IN': 'నెట్‌వర్క్ సమస్య. మళ్ళీ ప్రయత్నించండి.',
    'mr-IN': 'नेटवर्कमध्ये समस्या. पुन्हा प्रयत्न करा.',
    'gu-IN': 'નેટવર્કમાં સમસ્યા. ફરી પ્રયાસ કરો.',
    'kn-IN': 'ನೆಟ್‌ವರ್ಕ್ ಸಮಸ್ಯೆ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
    'ml-IN': 'നെറ്റ്‌വർക്ക് പ്രശ്നം. വീണ്ടും ശ്രമിക്കുക.',
    'pa-IN': 'ਨੈੱਟਵਰਕ ਵਿੱਚ ਸਮੱਸਿਆ। ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
    'od-IN': 'ନେଟୱର୍କ ସମସ୍ୟା। ଦୟାକରି ପୁନଃ ଚେଷ୍ଟା କରନ୍ତୁ।',
  };
  return map[lang] ?? map['en-IN'];
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-ivory">
          <FirstReportLogo size={64} variant="icon" theme="light" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
