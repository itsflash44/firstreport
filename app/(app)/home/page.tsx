'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LANGUAGES, t, openingFor, type LangCode } from '@/lib/i18n';
import { PERSONAS, type PersonaSpec } from '@/lib/personas';
import LanguageTile from '@/components/LanguageTile';
import PersonaCard from '@/components/PersonaCard';
import AgentAvatar from '@/components/AgentAvatar';
import SpeakerButton from '@/components/SpeakerButton';

type Urgency = 1 | 2 | 3;

const URGENCY_OPTIONS: { val: Urgency; labelKey: string; bodyKey: string; accent: string }[] = [
  { val: 1, labelKey: 'Routine',  bodyKey: 'Theft, paperwork, refused FIR',             accent: '#5FA8A0' },
  { val: 2, labelKey: 'Serious',  bodyKey: 'Repeated harassment, financial loss > ₹1L', accent: '#B8962E' },
  { val: 3, labelKey: 'Critical', bodyKey: 'Violence, child safety, immediate threat',  accent: '#D9534F' },
];

const URGENCY_LABEL: Record<LangCode, { title: string; opts: [string, string, string] }> = {
  'hi-IN': { title: 'यह मामला कितना जरूरी है?', opts: ['सामान्य', 'गंभीर', 'अत्यंत गंभीर'] },
  'en-IN': { title: 'How urgent is this matter?', opts: ['Routine', 'Serious', 'Critical'] },
  'bn-IN': { title: 'এই বিষয়টি কতটা জরুরি?', opts: ['সাধারণ', 'গুরুতর', 'অত্যন্ত গুরুতর'] },
  'ta-IN': { title: 'இந்த விஷயம் எவ்வளவு அவசரம்?', opts: ['வழக்கமான', 'தீவிர', 'மிகவும் தீவிர'] },
  'te-IN': { title: 'ఈ విషయం ఎంత అత్యవసరం?', opts: ['సాధారణ', 'తీవ్రమైన', 'అత్యంత తీవ్రమైన'] },
  'mr-IN': { title: 'हे प्रकरण किती तातडीचे आहे?', opts: ['सामान्य', 'गंभीर', 'अत्यंत गंभीर'] },
  'gu-IN': { title: 'આ બાબત કેટલી તાત્કાલિક છે?', opts: ['સામાન્ય', 'ગંભીર', 'અત્યંત ગંભીર'] },
  'kn-IN': { title: 'ಈ ವಿಷಯ ಎಷ್ಟು ತುರ್ತು?', opts: ['ಸಾಮಾನ್ಯ', 'ತೀವ್ರ', 'ಅತ್ಯಂತ ತೀವ್ರ'] },
  'ml-IN': { title: 'ഈ വിഷയം എത്ര അടിയന്തരം?', opts: ['സാധാരണ', 'ഗുരുതര', 'അതീവ ഗുരുതര'] },
  'pa-IN': { title: 'ਇਹ ਮਾਮਲਾ ਕਿੰਨਾ ਜ਼ਰੂਰੀ ਹੈ?', opts: ['ਸਾਧਾਰਨ', 'ਗੰਭੀਰ', 'ਬਹੁਤ ਗੰਭੀਰ'] },
  'od-IN': { title: 'ଏହି ବିଷୟ କେତେ ଜରୁରୀ?', opts: ['ସାଧାରଣ', 'ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ', 'ଅତ୍ୟନ୍ତ ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ'] },
};

const URGENCY_BODIES: Record<LangCode, [string, string, string]> = {
  'hi-IN': ['चोरी, कागज़ी काम, FIR दर्ज न होना', 'बार-बार उत्पीड़न, ₹1L से अधिक नुकसान', 'हिंसा, बच्चों की सुरक्षा, तत्काल खतरा'],
  'en-IN': ['Theft, paperwork, refused FIR', 'Repeated harassment, financial loss > ₹1L', 'Violence, child safety, immediate threat'],
  'bn-IN': ['চুরি, কাগজপত্র, FIR প্রত্যাখ্যান', 'বারবার হয়রানি, আর্থিক ক্ষতি', 'সহিংসতা, শিশু নিরাপত্তা, তাৎক্ষণিক হুমকি'],
  'ta-IN': ['திருட்டு, ஆவணங்கள், FIR மறுப்பு', 'திரும்பத்திரும்ப துன்புறுத்தல், நிதி இழப்பு', 'வன்முறை, குழந்தை பாதுகாப்பு, உடனடி அச்சுறுத்தல்'],
  'te-IN': ['దొంగతనం, పత్రాలు, FIR నిరాకరణ', 'పదే పదే వేధింపు, ఆర్థిక నష్టం', 'హింస, పిల్లల భద్రత, తక్షణ ముప్పు'],
  'mr-IN': ['चोरी, कागदपत्रे, FIR नाकारणे', 'वारंवार त्रास, आर्थिक नुकसान', 'हिंसा, मुलांची सुरक्षा, तत्काळ धोका'],
  'gu-IN': ['ચોરી, દસ્તાવેજ, FIR નકારી', 'વારંવાર હેરાનગતિ, નાણાકીય નુકસાન', 'હિંસા, બાળ સુरक्षा, તાત્કાલિક ખતરો'],
  'kn-IN': ['ಕಳ್ಳತನ, ದಾಖಲೆ, FIR ನಿರಾಕರಣೆ', 'ಪದೇ ಪದೆ ಕಿರುಕುಳ, ಆರ್ಥಿಕ ನಷ್ಟ', 'ಹಿಂಸೆ, ಮಕ್ಕಳ ಸುರಕ್ಷತೆ, ತಕ್ಷಣದ ಅಪಾಯ'],
  'ml-IN': ['മോഷണം, രേഖകൾ, FIR നിരസിക്കൽ', 'ആവർത്തിച്ചുള്ള ഉപദ്രവം, സാമ്പത്തിക നഷ്ടം', 'അക്രമം, ശിശു സുരക്ഷ, ഉടനടി ഭീഷണി'],
  'pa-IN': ['ਚੋਰੀ, ਕਾਗਜ਼ਾਤ, FIR ਤੋਂ ਇਨਕਾਰ', 'ਵਾਰ ਵਾਰ ਪਰੇਸ਼ਾਨੀ, ਵਿੱਤੀ ਨੁਕਸਾਨ', 'ਹਿੰਸਾ, ਬੱਚਿਆਂ ਦੀ ਸੁਰੱਖਿਆ, ਤੁਰੰਤ ਖ਼ਤਰਾ'],
  'od-IN': ['ଚୋରି, ଦଲିଲ, FIR ଅସ୍ୱୀକୃତ', 'ବାରମ୍ବାର ହଇରାଣ, ଆର୍ଥିକ କ୍ଷତି', 'ହିଂସା, ଶିଶୁ ସୁରକ୍ଷା, ତୁରନ୍ତ ବିପଦ'],
};

const DEMO_SUMMARY = 'सुनीता देवी, 38 वर्ष, घरेलू सहायिका, गाज़ियाबाद। थाने में FIR दर्ज करने से मना किया गया।';

export default function HomePage() {
  const router = useRouter();
  const [lang,    setLang]    = useState<LangCode>('hi-IN');
  const [persona, setPersona] = useState<PersonaSpec>(PERSONAS[0]);
  const [urgency, setUrgency] = useState<Urgency>(1);

  const showDemo = process.env.NEXT_PUBLIC_SHOW_DEMO_BUTTON === 'true';

  const startDemo = () => {
    sessionStorage.setItem('language',         'hi-IN');
    sessionStorage.setItem('persona',          'women_dv');
    sessionStorage.setItem('intake_severity',  '2');
    sessionStorage.setItem('incident_summary', DEMO_SUMMARY);
    router.push('/chat?lang=hi-IN&persona=women_dv&demo=true');
  };

  const previewMsg    = useMemo(() => openingFor(persona.id, lang), [persona.id, lang]);
  const speakerKey    = `${persona.id}-${lang}`;
  const urgencyText   = URGENCY_LABEL[lang]   ?? URGENCY_LABEL['en-IN'];
  const urgencyBodies = URGENCY_BODIES[lang]  ?? URGENCY_BODIES['en-IN'];

  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.lang = lang;
  }, [lang]);

  const startChat = () => {
    sessionStorage.setItem('language',        lang);
    sessionStorage.setItem('persona',         persona.id);
    sessionStorage.setItem('intake_severity', String(urgency));
    router.push(`/chat?lang=${lang}&persona=${persona.id}`);
  };

  const urgencyItem = URGENCY_OPTIONS[urgency - 1];

  return (
    <div className="min-h-screen bg-ivory" lang={lang}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">

          {/* LEFT — picker steps */}
          <section className="lg:col-span-7 space-y-10 sm:space-y-12">

            {/* Welcome heading */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-px bg-teal/50" />
                <span className="section-label">Voice-First Legal Aid</span>
              </div>
              <h1 lang={lang} className="font-serif font-bold text-navy-deep text-4xl sm:text-5xl leading-tight tracking-tight">
                {t('heroLine1', lang)}{' '}
                <span className="text-teal">{t('heroLine2', lang)}</span>
              </h1>
              <p lang={lang} className="text-base sm:text-lg text-secondary leading-relaxed max-w-xl">
                {t('selectLanguage', lang)}{' '}
                <span className="text-muted mx-1">→</span>{' '}
                {t('selectMode', lang)}{' '}
                <span className="text-muted mx-1">→</span>{' '}
                {t('start', lang)}.
              </p>
            </div>

            {/* ── STEP 1: LANGUAGE ── */}
            <div>
              <StepHeader num={1} label={t('selectLanguage', lang)} lang={lang} />
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {LANGUAGES.map((l) => (
                  <LanguageTile
                    key={l.code}
                    lang={l}
                    selected={lang === l.code}
                    onSelect={() => setLang(l.code)}
                  />
                ))}
              </div>
            </div>

            {/* ── STEP 2: PERSONA ── */}
            <div>
              <StepHeader num={2} label={t('selectMode', lang)} lang={lang} />
              <div className="grid sm:grid-cols-2 gap-4">
                {PERSONAS.map((p) => (
                  <PersonaCard
                    key={p.id}
                    persona={p}
                    selected={persona.id === p.id}
                    onSelect={() => setPersona(p)}
                    lang={lang}
                  />
                ))}
              </div>
            </div>

            {/* ── STEP 3: URGENCY ── */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="inline-flex w-7 h-7 rounded-full items-center justify-center shrink-0
                                 font-semibold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #5FA8A0, #B8962E)' }}>
                  3
                </span>
                <h2 lang={lang} className="section-label text-sm">{urgencyText.title}</h2>
                <div className="flex-1 h-px bg-cool-gray" />
                <SpeakerButton text={urgencyText.title} language={lang} variant="mini" />
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                {URGENCY_OPTIONS.map((opt, idx) => {
                  const active  = urgency === opt.val;
                  const label   = urgencyText.opts[idx];
                  const body    = urgencyBodies[idx];
                  return (
                    <div
                      key={opt.val}
                      role="button"
                      tabIndex={0}
                      aria-pressed={active}
                      onClick={() => setUrgency(opt.val)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setUrgency(opt.val); } }}
                      className={`relative cursor-pointer select-none rounded-sm p-5
                                  border transition-all duration-300 group
                        ${active
                          ? 'text-white border-transparent shadow-md'
                          : 'bg-white border-cool-gray hover:border-teal hover:bg-teal/3 text-navy-deep'}`}
                      style={active ? { background: opt.accent, borderColor: opt.accent } : {}}
                    >
                      <span
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        className={`absolute top-2 right-2 transition-opacity duration-200
                          ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      >
                        <SpeakerButton text={`${label}. ${body}`} language={lang} variant="mini" />
                      </span>
                      <div className={`font-semibold text-xs uppercase tracking-[0.16em] mb-2
                        ${active ? 'text-white' : 'text-navy-deep'}`}>
                        {label}
                      </div>
                      <div lang={lang} className={`text-xs leading-relaxed
                        ${active ? 'text-white/80' : 'text-secondary'}`}>
                        {body}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* RIGHT — agent + action panel */}
          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-24 space-y-4">
              <AgentAvatar persona={persona} size={460} speaking />

              {/* Preview card */}
              <div className="fr-card p-5">
                <span className="section-label block mb-3">{t('preview', lang)}</span>
                <p lang={lang} className="text-base font-medium leading-relaxed text-primary min-h-[4.5rem]">
                  {previewMsg}
                </p>
                <div className="hairline my-4" />
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-secondary">{persona.titleEn}</span>
                    <span className="text-[10px] text-muted block mt-0.5">{lang}</span>
                  </div>
                  <SpeakerButton
                    key={speakerKey}
                    text={previewMsg}
                    language={lang}
                    persona={persona.id}
                    variant="mini"
                    autoPlay
                  />
                </div>
              </div>

              {/* Urgency summary */}
              <div
                className="flex items-center gap-2.5 px-4 py-3 rounded-sm text-sm font-semibold text-white"
                style={{ background: urgencyItem.accent }}
              >
                <span className="w-2 h-2 rounded-full bg-white/70 animate-rec shrink-0" />
                <span lang={lang}>
                  {urgencyText.opts[urgency - 1]} · {urgencyBodies[urgency - 1]}
                </span>
              </div>

              {/* START */}
              <button
                id="start-chat-btn"
                onClick={startChat}
                lang={lang}
                className="w-full py-4 bg-navy-deep text-white rounded-sm font-semibold text-base
                           uppercase tracking-[0.14em] transition-all duration-500
                           hover:bg-navy hover:shadow-md active:scale-[0.98]"
              >
                {t('start', lang)} →
              </button>

              {/* NALSA */}
              <a
                href="tel:15100"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-sm text-sm font-semibold
                           border border-error/25 text-error hover:bg-error hover:text-white
                           transition-all duration-500"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-60"/>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-error"/>
                </span>
                {t('sosCall', lang)} · 15100
              </a>

              {/* History link */}
              <button
                onClick={() => router.push(`/history?lang=${lang}`)}
                className="block w-full text-center py-2.5 text-sm font-medium text-secondary
                           hover:text-navy-deep transition-colors duration-300"
              >
                § {t('history', lang)}
              </button>

              {/* Demo button */}
              {showDemo && (
                <button
                  onClick={startDemo}
                  className="block w-full text-center py-2 text-xs font-medium text-muted/60
                             hover:text-secondary transition-colors border border-dashed border-cool-gray rounded-sm"
                  title="Demo: Sunita Devi scenario"
                >
                  Demo · Sunita Scenario
                </button>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* Footer strip */}
      <footer className="border-t border-cool-gray bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-5
                        flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="authority-strip">FirstReport · Voice-first legal aid · Gemma 4 + Sarvam AI</p>
          <div className="flex flex-wrap gap-2">
            <span className="citation-chip citation-chip-light">BNSS 2023</span>
            <span className="citation-chip citation-chip-light">POCSO</span>
            <span className="citation-chip citation-chip-light">PWDVA</span>
          </div>
          <a href="tel:15100" className="text-xs font-semibold text-error hover:underline transition-colors">NALSA · 15100</a>
        </div>
      </footer>
    </div>
  );
}

function StepHeader({ num, label, lang }: { num: number; label: string; lang: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span
        className="inline-flex w-7 h-7 rounded-full items-center justify-center shrink-0 font-semibold text-sm text-white"
        style={{ background: 'linear-gradient(135deg, #5FA8A0, #B8962E)' }}
      >
        {num}
      </span>
      <h2 lang={lang} className="section-label text-sm">{label}</h2>
      <div className="flex-1 h-px bg-cool-gray" />
    </div>
  );
}
