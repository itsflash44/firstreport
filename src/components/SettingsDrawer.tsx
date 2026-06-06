'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { LANGUAGES, type LangCode } from '@/lib/i18n';
import { uiStr } from '@/lib/ui-strings';
import { clearHistory } from '@/lib/history';
import SpeakerButton from './chat/SpeakerButton';
import FirstReportLogo from './FirstReportLogo';

const MIC_LIMIT_SEC = 8; // max recording seconds for name input

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  currentLang: LangCode;
  onLangChange: (lang: LangCode) => void;
}

function aboutText(lang: LangCode): string {
  const map: Record<string, string> = {
    'hi-IN': 'फ़र्स्टरिपोर्ट, वर्शन 1.0। भारत के लिए AI-आधारित आवाज़ी कानूनी सहायता। 11 भारतीय भाषाओं में उपलब्ध। पूरी तरह ऑफलाइन काम करता है। BNSS 2023, POCSO, PWDVA और अन्य कानूनों के तहत पुलिस शिकायत, DM याचिका और हाईकोर्ट रिट दर्ज करने में मदद करता है। Gemma 4 और Sarvam AI द्वारा संचालित। आपातकालीन कानूनी सहायता के लिए NALSA हेल्पलाइन 15100 पर कॉल करें।',
    'en-IN': 'FirstReport, Version 1.0. An AI-powered voice-first legal aid tool for India. Available in 11 Indian languages. Works fully offline on basic smartphones. Helps file police complaints, District Magistrate petitions, and High Court writs under BNSS 2023, POCSO, PWDVA, and other laws. Powered by Gemma 4 and Sarvam AI. For emergency legal aid, call NALSA helpline 15100.',
    'bn-IN': 'ফার্স্টরিপোর্ট, সংস্করণ 1.0। ভারতের জন্য AI-চালিত ভয়েস-ফার্স্ট আইনি সহায়তা। 11টি ভারতীয় ভাষায়। সম্পূর্ণ অফলাইনে কাজ করে। NALSA হেল্পলাইন 15100।',
    'ta-IN': 'ஃபர்ஸ்ட்ரிபோர்ட், பதிப்பு 1.0. 11 இந்திய மொழிகளில் AI சட்ட உதவி. ஆஃப்லைனில் வேலை செய்கிறது. NALSA helpline 15100.',
    'te-IN': 'ఫస్ట్‌రిపోర్ట్, వెర్షన్ 1.0. 11 భారతీయ భాషల్లో AI చట్ట సహాయం. పూర్తిగా ఆఫ్‌లైన్. NALSA helpline 15100.',
    'mr-IN': 'फर्स्टरिपोर्ट, आवृत्ती 1.0. 11 भारतीय भाषांमध्ये AI कायदेशीर सहाय्य. ऑफलाइन. NALSA helpline 15100.',
    'gu-IN': 'ફર્સ્ટ-રિ-પો-ર્ટ, વ-ર્ઝ-ન 1.0. 11 ભારતીય ભાષાઓ. ઓ-ફ-લા-ઇ-ન. NALSA helpline 15100.',
    'kn-IN': 'ಫಸ್ಟ್‌ರಿಪೋರ್ಟ್, ಆವೃತ್ತಿ 1.0. 11 ಭಾರತೀಯ ಭಾಷೆಗಳಲ್ಲಿ AI ಕಾನೂನು ಸಹಾಯ. ಆಫ್‌ಲೈನ್. NALSA 15100.',
    'ml-IN': 'ഫസ്റ്റ്‌റിപ്പോർട്ട്, 1.0. 11 ഭാഷകൾ. ഓഫ്‌ലൈൻ. NALSA 15100.',
    'pa-IN': 'ਫਸਟਰਿਪੋਰਟ, ਵਰਜ਼ਨ 1.0. 11 ਭਾਸ਼ਾਵਾਂ. ਆਫਲਾਈਨ. NALSA 15100.',
    'od-IN': 'ଫଷ୍ଟ‌ରିପୋର୍ଟ, 1.0. 11 ଭାଷା. ଅଫ୍‌ଲାଇନ. NALSA 15100.',
  };
  return map[lang] ?? map['en-IN'];
}

const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={value}
    onClick={() => onChange(!value)}
    className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200
      focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/50
      ${value ? 'bg-teal' : 'bg-cool-gray'}`}
  >
    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200
      ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
  </button>
);

export default function SettingsDrawer({ open, onClose, currentLang, onLangChange }: SettingsDrawerProps) {
  // Profile
  const [name,         setName]         = useState('');
  const [nameJustSet,  setNameJustSet]  = useState(false); // playback hint after mic transcription

  // Voice prefs
  const [autoSpeak,    setAutoSpeak]    = useState(true);
  const [offlineVoice, setOfflineVoice] = useState(true);

  // Delivery & privacy
  const [telegramNotif, setTelegramNotif] = useState(true);
  const [trainingOptOut, setTrainingOptOut] = useState(false);

  // UI state
  const [saved,          setSaved]          = useState(false);
  const [clearConfirm,   setClearConfirm]   = useState(false);
  const [historyCleared, setHistoryCleared] = useState(false);

  // Mic recording state
  const [isRecording,    setIsRecording]    = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [countdown,      setCountdown]      = useState(MIC_LIMIT_SEC);

  const recorderRef   = useRef<MediaRecorder | null>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const chunksRef     = useRef<Blob[]>([]);
  const countdownRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load persisted settings on open ─────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setName(localStorage.getItem('fr_user_name') ?? '');
    setAutoSpeak(localStorage.getItem('fr_auto_speak') !== 'false');
    setOfflineVoice(localStorage.getItem('fr_offline_voice') !== 'false');
    setTelegramNotif(localStorage.getItem('fr_telegram_notif') !== 'false');
    setTrainingOptOut(sessionStorage.getItem('training_optout') === 'true');
    setNameJustSet(false);
    setClearConfirm(false);
    setHistoryCleared(false);
  }, [open]);

  // ── Mic cleanup ──────────────────────────────────────────────────────────
  const releaseStream = useCallback(() => {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    streamRef.current?.getTracks().forEach((t) => { try { t.stop(); } catch { /* noop */ } });
    streamRef.current   = null;
    recorderRef.current = null;
    chunksRef.current   = [];
    setCountdown(MIC_LIMIT_SEC);
  }, []);

  useEffect(() => {
    if (!open) { releaseStream(); setIsRecording(false); setIsTranscribing(false); }
  }, [open, releaseStream]);

  // ── Start mic ────────────────────────────────────────────────────────────
  const startMic = useCallback(async () => {
    if (isRecording || isTranscribing) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true } });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus' : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };

      recorder.onstop = async () => {
        try {
          if (chunksRef.current.length === 0) return;
          setIsTranscribing(true);
          const blob = new Blob(chunksRef.current, { type: mime });
          const fd   = new FormData();
          fd.append('audio',     blob, 'name.webm');
          fd.append('language',  currentLang);
          fd.append('lang_code', currentLang);
          const res  = await fetch('/api/stt', { method: 'POST', body: fd });
          const data = await res.json();
          if (data.transcript) { setName(data.transcript); setNameJustSet(true); }
        } catch { /* offline — ignore */ }
        finally { setIsTranscribing(false); releaseStream(); }
      };

      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
      setCountdown(MIC_LIMIT_SEC);

      // Countdown timer — auto-stop when limit reached
      let remaining = MIC_LIMIT_SEC;
      countdownRef.current = setInterval(() => {
        remaining -= 1;
        setCountdown(remaining);
        if (remaining <= 0) stopMicImmediate(recorder);
      }, 1000);

    } catch { releaseStream(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording, isTranscribing, currentLang, releaseStream]);

  // Used inside closure (avoids stale ref)
  function stopMicImmediate(recorder: MediaRecorder) {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    if (recorder.state !== 'inactive') { try { recorder.stop(); } catch { /* noop */ } }
    setIsRecording(false);
    setCountdown(MIC_LIMIT_SEC);
  }

  const stopMic = useCallback(() => {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    const r = recorderRef.current;
    if (r && r.state !== 'inactive') { try { r.stop(); } catch { /* noop */ } }
    else releaseStream();
    setIsRecording(false);
    setCountdown(MIC_LIMIT_SEC);
  }, [releaseStream]);

  // ── Save ─────────────────────────────────────────────────────────────────
  const save = () => {
    localStorage.setItem('fr_user_name',      name);
    localStorage.setItem('fr_auto_speak',     String(autoSpeak));
    localStorage.setItem('fr_offline_voice',  String(offlineVoice));
    localStorage.setItem('fr_telegram_notif', String(telegramNotif));
    sessionStorage.setItem('training_optout', String(trainingOptOut));
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 900);
  };

  // ── Clear history ────────────────────────────────────────────────────────
  const handleClearHistory = () => {
    if (!clearConfirm) { setClearConfirm(true); return; }
    clearHistory();
    setHistoryCleared(true);
    setClearConfirm(false);
    setTimeout(() => setHistoryCleared(false), 2500);
  };

  // Progress bar width (recording countdown)
  const progressPct = isRecording ? Math.round((countdown / MIC_LIMIT_SEC) * 100) : 100;

  return (
    <>
      {open && <div className="fixed inset-0 z-[80] bg-navy/30 backdrop-blur-sm" onClick={onClose} />}

      <aside
        className={`
          fixed top-0 right-0 bottom-0 z-[90] w-full max-w-sm bg-white shadow-xl
          flex flex-col overflow-hidden
          transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
        aria-label={uiStr('settingsTitle', currentLang)}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-cool-gray">
          <div className="flex items-center gap-2">
            <h2 className="font-serif font-bold text-xl text-navy leading-none">
              {uiStr('settingsTitle', currentLang)}
            </h2>
            <SpeakerButton text={uiStr('settingsTitle', currentLang)} language={currentLang} variant="mini" />
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded text-secondary hover:text-navy hover:bg-ivory transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">

          {/* ── PROFILE ── */}
          <section>
            <SectionHead label={uiStr('profile', currentLang)} lang={currentLang} />

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-navy">{uiStr('yourName', currentLang)}</label>
                <SpeakerButton text={uiStr('yourName', currentLang)} language={currentLang} variant="mini" />
              </div>

              {/* Name input + mic */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setNameJustSet(false); }}
                  placeholder={uiStr('yourNamePlaceholder', currentLang)}
                  className="fr-input flex-1 px-3 py-2.5 text-sm"
                />
                <button
                  type="button"
                  onPointerDown={startMic}
                  onPointerUp={stopMic}
                  onPointerLeave={isRecording ? stopMic : undefined}
                  onPointerCancel={isRecording ? stopMic : undefined}
                  aria-label="Hold to speak your name"
                  title="Hold to speak your name"
                  className={`shrink-0 w-10 h-10 rounded border flex items-center justify-center transition-all
                    ${isRecording
                      ? 'bg-error text-white border-error scale-105'
                      : isTranscribing
                      ? 'bg-cool-gray text-muted border-cool-gray animate-pulse'
                      : 'bg-ivory text-secondary border-cool-gray hover:border-teal hover:text-teal'}`}
                >
                  {isTranscribing ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" strokeDasharray="40 60" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="9" y="3" width="6" height="11" rx="3" />
                      <path d="M5 11a7 7 0 0014 0h-2a5 5 0 01-10 0H5z" />
                      <rect x="11" y="18" width="2" height="3" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Recording countdown bar */}
              {isRecording && (
                <div className="space-y-1">
                  <div className="h-1.5 bg-cool-gray rounded-full overflow-hidden">
                    <div
                      className="h-full bg-error rounded-full transition-all duration-1000 ease-linear"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-error font-medium">
                    ● {uiStr('recordingTimer', currentLang).replace('{n}', String(countdown))}
                  </p>
                </div>
              )}

              {/* Playback confirm after mic transcription */}
              {nameJustSet && name && (
                <div className="flex items-center gap-2 px-3 py-2 bg-teal/8 border border-teal/20 rounded-sm">
                  <SpeakerButton text={name} language={currentLang} variant="mini" />
                  <span className="text-xs text-teal font-medium flex-1">{uiStr('namePlayback', currentLang)}</span>
                  <button
                    onClick={() => setNameJustSet(false)}
                    className="text-xs text-secondary hover:text-navy"
                    aria-label="Dismiss"
                  >✕</button>
                </div>
              )}
            </div>

            {/* Mic test card */}
            <div className="mt-4 p-4 bg-ivory rounded-md border border-cool-gray">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-navy">{uiStr('testMic', currentLang)}</span>
                    <SpeakerButton text={uiStr('testMic', currentLang)} language={currentLang} variant="mini" />
                  </div>
                  <p className="text-xs text-secondary">{uiStr('testMicDesc', currentLang)}</p>
                </div>
                <svg className="w-8 h-8 shrink-0 text-navy/40" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="9" y="3" width="6" height="11" rx="3" />
                  <path d="M5 11a7 7 0 0014 0h-2a5 5 0 01-10 0H5z" />
                  <rect x="11" y="18" width="2" height="3" />
                </svg>
              </div>
            </div>
          </section>

          {/* ── LANGUAGE ── */}
          <section>
            <SectionHead label={uiStr('languagePref', currentLang)} lang={currentLang} />
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((l) => {
                const active = currentLang === l.code;
                // div role="button" — avoids nesting <button> inside <button> (SpeakerButton is a button)
                return (
                  <div
                    key={l.code}
                    role="button"
                    tabIndex={0}
                    lang={l.bcp47}
                    onClick={() => onLangChange(l.code)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onLangChange(l.code); } }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-sm border cursor-pointer select-none transition-colors
                      ${active
                        ? 'bg-navy text-white border-navy'
                        : 'bg-white text-navy border-cool-gray hover:border-teal hover:bg-teal/5'}`}
                  >
                    <span className="font-serif text-xl leading-none pointer-events-none">{l.label}</span>
                    <span className={`font-mono text-[9px] uppercase tracking-widest flex-1 pointer-events-none ${active ? 'text-white/65' : 'text-secondary'}`}>
                      {l.sublabel}
                    </span>
                    <span onClick={(e) => e.stopPropagation()} className="shrink-0">
                      <SpeakerButton text={l.sublabel} language={l.code} variant="mini" />
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── VOICE SETTINGS ── */}
          <section>
            <SectionHead label={uiStr('voiceSettings', currentLang)} lang={currentLang} />
            <div className="space-y-3">
              <ToggleRow
                label={uiStr('autoSpeak', currentLang)}
                desc={uiStr('autoSpeakDesc', currentLang)}
                lang={currentLang}
                value={autoSpeak}
                onChange={setAutoSpeak}
              />
              <ToggleRow
                label={uiStr('offlineVoice', currentLang)}
                desc={uiStr('offlineVoiceDesc', currentLang)}
                lang={currentLang}
                value={offlineVoice}
                onChange={setOfflineVoice}
              />
            </div>
          </section>

          {/* ── DELIVERY & PRIVACY ── */}
          <section>
            <SectionHead label="Delivery & Privacy" lang={currentLang} />
            <div className="space-y-3">
              <ToggleRow
                label={uiStr('telegramNotif', currentLang)}
                desc={uiStr('telegramNotifDesc', currentLang)}
                lang={currentLang}
                value={telegramNotif}
                onChange={setTelegramNotif}
              />
              <ToggleRow
                label={uiStr('trainingOptOut', currentLang)}
                desc={uiStr('trainingOptOutDesc', currentLang)}
                lang={currentLang}
                value={trainingOptOut}
                onChange={setTrainingOptOut}
              />
            </div>
          </section>

          {/* ── DANGER ZONE ── */}
          <section className="pt-2">
            <SectionHead label="Data" lang={currentLang} />
            <div className="rounded-md border border-error/20 bg-error/5 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-navy">{uiStr('clearHistory', currentLang)}</span>
                    <SpeakerButton text={uiStr('clearHistoryConfirm', currentLang)} language={currentLang} variant="mini" />
                  </div>
                  <p className="text-xs text-secondary leading-snug">
                    {clearConfirm
                      ? uiStr('clearHistoryConfirm', currentLang)
                      : 'Remove all past cases from this device.'}
                  </p>
                  {historyCleared && (
                    <p className="text-xs text-teal font-semibold mt-1">{uiStr('clearHistoryDone', currentLang)}</p>
                  )}
                </div>
                <button
                  onClick={handleClearHistory}
                  className={`shrink-0 px-3 py-1.5 rounded text-xs font-semibold border transition-colors
                    ${clearConfirm
                      ? 'bg-error text-white border-error hover:bg-red-700'
                      : 'bg-white text-error border-error/40 hover:bg-error/10'}`}
                >
                  {clearConfirm ? 'Confirm' : uiStr('clearHistory', currentLang)}
                </button>
              </div>
            </div>
          </section>

          {/* ── ABOUT ── */}
          <section className="pt-4 border-t border-cool-gray">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="section-label">{uiStr('aboutApp', currentLang)}</h3>
              <SpeakerButton text={aboutText(currentLang)} language={currentLang} variant="mini" />
            </div>
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <FirstReportLogo variant="full" size={52} theme="light" />
              <div className="space-y-1 text-xs text-secondary">
                <div>Version 1.0 · Gemma 4 · Sarvam AI</div>
                <div>BNSS 2023 · POCSO · PWDVA · MWPSC · DPDP 2023</div>
                <div className="text-[11px] text-muted pt-1">AI legal aid — not a substitute for a licensed lawyer.</div>
              </div>
              <a
                href="tel:15100"
                className="inline-flex items-center gap-2 px-4 py-2 bg-error/10 text-error border border-error/20 rounded font-semibold text-sm hover:bg-error hover:text-white transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-error animate-rec" />
                NALSA Helpline · 15100
              </a>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-4 border-t border-cool-gray bg-white">
          <button
            onClick={save}
            className="w-full py-3 bg-navy text-white rounded font-semibold text-sm
                       hover:bg-navy/90 active:scale-[0.98] transition-all"
          >
            {saved ? '✓ Saved!' : uiStr('saveSettings', currentLang)}
          </button>
        </div>
      </aside>
    </>
  );
}

/** Section heading with speaker */
function SectionHead({ label, lang }: { label: string; lang: LangCode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h3 className="section-label">{label}</h3>
      <SpeakerButton text={label} language={lang} variant="mini" />
    </div>
  );
}

/** Toggle row with label + description + switch */
function ToggleRow({
  label, desc, lang, value, onChange,
}: {
  label: string; desc: string; lang: LangCode;
  value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-ivory rounded-md border border-cool-gray">
      <div className="flex-1 min-w-0 mr-4">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold text-navy">{label}</span>
          <SpeakerButton text={desc} language={lang} variant="mini" />
        </div>
        <p className="text-xs text-secondary leading-snug">{desc}</p>
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}
