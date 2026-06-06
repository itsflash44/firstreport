'use client';

import Link from 'next/link';
import AgentAvatar from '@/components/chat/AgentAvatar';
import SpeakerButton from '@/components/chat/SpeakerButton';
import { PERSONAS } from '@/lib/personas';
import { type LangCode } from '@/lib/i18n';

const HERO_TEXT: Record<LangCode, {
  headline: string;
  lede: string;
  ctaHelp: string;
  ctaPractice: string;
  established: string;
  operatesUnder: string;
  statsHeadline: string;
  statLang: string;
  statModes: string;
  statOffline: string;
  yourCounsel: string;
  onTheLine: string;
}> = {
  'hi-IN': {
    headline: 'जब पुलिस न सुने, हम सुनेंगे।',
    lede: 'फ़र्स्टरिपोर्ट एक आवाज़ी कानूनी सहायता है। अपनी भाषा में बोलें, जो हुआ बताएं, और कानून के तहत सही शिकायत दस्तावेज़ पाएं।',
    ctaHelp: 'सहायता प्राप्त करें →',
    ctaPractice: 'अभ्यास क्षेत्र देखें',
    established: 'स्थापित 2026 · भारतीय नागरिक सुरक्षा संहिता',
    operatesUnder: 'के अंतर्गत संचालित',
    statsHeadline: 'फ़र्स्टरिपोर्ट प्रैक्टिस',
    statLang: 'भारतीय भाषाएँ',
    statModes: 'विशेषज्ञ मोड',
    statOffline: 'ऑफ़लाइन सक्षम',
    yourCounsel: 'आपका वकील',
    onTheLine: 'पहले से ही लाइन पर।'
  },
  'en-IN': {
    headline: "When the police won't listen, we will.",
    lede: 'FirstReport is a voice-first legal aid tool for India. Speak in your language, describe what happened, and get the exact document the law gives you the right to file.',
    ctaHelp: 'Get Help →',
    ctaPractice: 'See Practice Areas',
    established: 'Established 2026 · Bharatiya Nagarik Suraksha Sanhita',
    operatesUnder: 'Operates under',
    statsHeadline: 'The FirstReport Practice',
    statLang: 'Indic Languages',
    statModes: 'Specialist Modes',
    statOffline: 'Offline Capable',
    yourCounsel: 'Your Counsel',
    onTheLine: 'Already on the line.'
  },
  'bn-IN': { 
    headline: 'যখন পুলিশ শুনবে না, আমরা শুনব।', 
    lede: 'ফার্স্টরিপোর্ট ভারতের জন্য একটি ভয়েস-ফার্স্ট আইনি সহায়তা। আপনার ভাষায় কথা বলুন এবং সঠিক নথি পান।',
    ctaHelp: 'সাহায্য নিন →', ctaPractice: 'অনুশীলন ক্ষেত্র দেখুন', established: 'প্রতিষ্ঠিত ২০২৬ · ভারতীয় নাগরিক সুরক্ষা সংহিতা',
    operatesUnder: 'অধীনে পরিচালিত', statsHeadline: 'ফার্স্টরিপোর্ট প্র্যাকটিস', statLang: 'ভারতীয় ভাষা',
    statModes: 'বিশেষজ্ঞ মোড', statOffline: 'অফলাইন সক্ষম', yourCounsel: 'আপনার পরামর্শদাতা', onTheLine: 'ইতিমধ্যেই লাইনে আছে।'
  },
  'ta-IN': { 
    headline: 'போலீஸ் கேட்காதபோது, நாங்கள் கேட்போம்.', 
    lede: 'FirstReport இந்தியாவிற்கான குரல் சட்ட உதவி கருவி. உங்கள் மொழியில் பேசி சரியான ஆவணம் பெறுங்கள்.',
    ctaHelp: 'உதவி பெறுங்கள் →', ctaPractice: 'பயிற்சி பகுதிகளை காண்க', established: 'நிறுவப்பட்டது 2026 · பாரதிய நாகரிக் சுரக்ஷா சன்ஹிதா',
    operatesUnder: 'கீழ் இயங்குகிறது', statsHeadline: 'FirstReport பயிற்சி', statLang: 'இந்திய மொழிகள்',
    statModes: 'நிபுணர் பயன்முறைகள்', statOffline: 'ஆஃப்லைன் திறன்', yourCounsel: 'உங்கள் ஆலோசகர்', onTheLine: 'ஏற்கனவே வரியில்.'
  },
  'te-IN': { 
    headline: 'పోలీసులు వినకపోతే, మేము వింటాం.', 
    lede: 'FirstReport భారతదేశం కోసం వాయిస్ లీగల్ ఎయిడ్. మీ భాషలో మాట్లాడి సరైన పత్రం పొందండి.',
    ctaHelp: 'సహాయం పొందండి →', ctaPractice: 'ప్రాక్టీస్ ప్రాంతాలను చూడండి', established: 'స్థాపించబడింది 2026 · భారతీయ నాగరిక్ సురక్షా సంహిత',
    operatesUnder: 'కింద పనిచేస్తుంది', statsHeadline: 'FirstReport ప్రాక్టీస్', statLang: 'భారతీయ భాషలు',
    statModes: 'నిపుణుల మోడ్‌లు', statOffline: 'ఆఫ్‌లైన్ సామర్థ్యం', yourCounsel: 'మీ న్యాయవాది', onTheLine: 'ఇప్పటికే లైన్‌లో ఉన్నారు.'
  },
  'mr-IN': { 
    headline: 'पोलीस न ऐकल्यास, आम्ही ऐकतो.', 
    lede: 'फर्स्टरिपोर्ट भारतासाठी व्हॉइस लीगल एड आहे. तुमच्या भाषेत बोला आणि योग्य कागदपत्र मिळवा.',
    ctaHelp: 'मदत मिळवा →', ctaPractice: 'सराव क्षेत्रे पहा', established: 'स्थापित 2026 · भारतीय नागरिक सुरक्षा संहिता',
    operatesUnder: 'अंतर्गत चालते', statsHeadline: 'फर्स्टरिपोर्ट प्रॅक्टिस', statLang: 'भारतीय भाषा',
    statModes: 'तज्ञ मोड', statOffline: 'ऑफलाइन सक्षम', yourCounsel: 'तुमचा वकील', onTheLine: 'आधीच लाईनवर.'
  },
  'gu-IN': { 
    headline: 'પોલીસ ન સાંભળે ત્યારે, અમે સાંભળીએ છીએ.', 
    lede: 'ફર્સ્ટરિપોર્ટ ભારત માટે વૉઇસ કાનૂની સહાય છે. તમારી ભાષામાં બોલો અને સાચો દસ્તાવેજ મેળવો.',
    ctaHelp: 'મદદ મેળવો →', ctaPractice: 'પ્રેક્ટિસ ક્ષેત્રો જુઓ', established: 'સ્થાપિત 2026 · ભારતીય નાગરિક સુરક્ષા સંહિતા',
    operatesUnder: 'હેઠળ કાર્ય કરે છે', statsHeadline: 'ફર્સ્ટરિપોર્ટ પ્રેક્ટિસ', statLang: 'ભારતીય ભાષાઓ',
    statModes: 'નિષ્ણાત મોડ્સ', statOffline: 'ઑફલાઇન સક્ષમ', yourCounsel: 'તમારા વકીલ', onTheLine: 'પહેલેથી જ લાઇન પર.'
  },
  'kn-IN': { 
    headline: 'ಪೊಲೀಸರು ಕೇಳದಿದ್ದಾಗ, ನಾವು ಕೇಳುತ್ತೇವೆ.', 
    lede: 'FirstReport ಭಾರತಕ್ಕಾಗಿ ವಾಯ್ಸ್ ಕಾನೂನು ಸಹಾಯ. ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಮಾತನಾಡಿ ಸರಿಯಾದ ದಾಖಲೆ ಪಡೆಯಿರಿ.',
    ctaHelp: 'ಸಹಾಯ ಪಡೆಯಿರಿ →', ctaPractice: 'ಅಭ್ಯಾಸ ಕ್ಷೇತ್ರಗಳನ್ನು ನೋಡಿ', established: 'ಸ್ಥಾಪಿಸಲಾಗಿದೆ 2026 · ಭಾರತೀಯ ನಾಗರಿಕ್ ಸುರಕ್ಷಾ ಸಂಹಿತಾ',
    operatesUnder: 'ಅಡಿಯಲ್ಲಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ', statsHeadline: 'FirstReport ಅಭ್ಯಾಸ', statLang: 'ಭಾರತೀಯ ಭಾಷೆಗಳು',
    statModes: 'ತಜ್ಞ ಮೋಡ್‌ಗಳು', statOffline: 'ಆಫ್‌ಲೈನ್ ಸಾಮರ್ಥ್ಯ', yourCounsel: 'ನಿಮ್ಮ ವಕೀಲರು', onTheLine: 'ಈಗಾಗಲೇ ಲೈನ್‌ನಲ್ಲಿದ್ದಾರೆ.'
  },
  'ml-IN': { 
    headline: 'പോലീസ് കേൾക്കാത്തപ്പോൾ, ഞങ്ങൾ കേൾക്കും.', 
    lede: 'FirstReport ഇന്ത്യക്കായുള്ള വോയ്‌സ് നിയമ സഹായമാണ്. നിങ്ങളുടെ ഭാഷയിൽ സംസാരിച്ച് ശരിയായ രേഖ നേടുക.',
    ctaHelp: 'സഹായം നേടുക →', ctaPractice: 'പ്രാക്ടീസ് ഏരിയകൾ കാണുക', established: 'സ്ഥാപിതമായത് 2026 · ഭാരതീയ നാഗരിക് സുരക്ഷാ സൻഹിത',
    operatesUnder: 'കീഴിൽ പ്രവർത്തിക്കുന്നു', statsHeadline: 'FirstReport പ്രാക്ടീസ്', statLang: 'ഇന്ത്യൻ ഭാഷകൾ',
    statModes: 'വിദഗ്ദ്ധ മോഡുകൾ', statOffline: 'ഓഫ്‌ലൈൻ ശേഷി', yourCounsel: 'നിങ്ങളുടെ ഉപദേഷ്ടാവ്', onTheLine: 'ഇതിനകം വരിയിലുണ്ട്.'
  },
  'pa-IN': { 
    headline: 'ਜਦੋਂ ਪੁਲਿਸ ਨਾ ਸੁਣੇ, ਅਸੀਂ ਸੁਣਾਂਗੇ।', 
    lede: 'ਫਰਸਟਰਿਪੋਰਟ ਭਾਰਤ ਲਈ ਵੌਇਸ ਕਾਨੂੰਨੀ ਸਹਾਇਤਾ ਹੈ। ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਬੋਲੋ ਅਤੇ ਸਹੀ ਦਸਤਾਵੇਜ਼ ਪ੍ਰਾਪਤ ਕਰੋ।',
    ctaHelp: 'ਮਦਦ ਪ੍ਰਾਪਤ ਕਰੋ →', ctaPractice: 'ਅਭਿਆਸ ਖੇਤਰ ਦੇਖੋ', established: 'ਸਥਾਪਿਤ 2026 · ਭਾਰਤੀ ਨਾਗਰਿਕ ਸੁਰੱਖਿਆ ਸੰਹਿਤਾ',
    operatesUnder: 'ਅਧੀਨ ਕੰਮ ਕਰਦਾ ਹੈ', statsHeadline: 'ਫਰਸਟਰਿਪੋਰਟ ਪ੍ਰੈਕਟਿਸ', statLang: 'ਭਾਰਤੀ ਭਾਸ਼ਾਵਾਂ',
    statModes: 'ਮਾਹਿਰ ਮੋਡ', statOffline: 'ਔਫਲਾਈਨ ਸਮਰੱਥ', yourCounsel: 'ਤੁਹਾਡਾ ਵਕੀਲ', onTheLine: 'ਪਹਿਲਾਂ ਹੀ ਲਾਈਨ ਤੇ।'
  },
  'od-IN': { 
    headline: 'ପୋଲିସ ଯଦି ନ ଶୁଣନ୍ତି, ଆମ୍ଭେ ଶୁଣିବୁ।', 
    lede: 'ଫ‌ର‌୍ଷ‌ଟ‌ ରି‌ପ‌ୋ‌ର‌୍ଟ ଭ‌ାର‌ତ ପ‌ାଇ‌ଁ ଭ‌ଏ‌ସ ‌ ଆ‌ଇ‌ନ‌ ‌ ସ‌ହ‌ା‌ଯ‌। ଆପଣଙ୍କ ଭାଷାରେ କଥାବାର୍ତ୍ତା କରନ୍ତୁ ଓ ସଠିକ ଦଲିଲ ପାଆନ୍ତୁ।',
    ctaHelp: 'ସାହାଯ୍ୟ ପାଆନ୍ତୁ →', ctaPractice: 'ଅଭ୍ୟାସ କ୍ଷେତ୍ର ଦେଖନ୍ତୁ', established: 'ପ୍ରତିଷ୍ଠିତ ୨୦୨୬ · ଭାରତୀୟ ନାଗରିକ ସୁରକ୍ଷା ସଂହିତା',
    operatesUnder: 'ଅଧୀନରେ କାର୍ଯ୍ୟ କରେ', statsHeadline: 'ଫର୍ଷ୍ଟରିପୋର୍ଟ ପ୍ରାକ୍ଟିସ୍', statLang: 'ଭାରତୀୟ ଭାଷା',
    statModes: 'ବିଶେଷଜ୍ଞ ମୋଡ୍', statOffline: 'ଅଫଲାଇନ୍ ସକ୍ଷମ', yourCounsel: 'ଆପଣଙ୍କ ପରାମର୍ଶଦାତା', onTheLine: 'ପୂର୍ବରୁ ଲାଇନରେ ଅଛନ୍ତି।'
  },
};

const STATUTES = ['§ BNSS 2023', '§ BNS 2023', '§ POCSO 2012', '§ PWDVA 2005', '§ MWPSC 2007', '§ DPDP 2023'];

interface HeroLandingProps { selectedLang: LangCode; }

export default function HeroLanding({ selectedLang }: HeroLandingProps) {
  const heroPersona = PERSONAS.find((p) => p.id === 'standard') ?? PERSONAS[0];
  const copy = HERO_TEXT[selectedLang] ?? HERO_TEXT['en-IN'];

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0F1F3D 0%, #1A2A44 60%, #0E2530 100%)' }}
      id="hero"
    >
      {/* Faint scales watermark */}
      <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-end overflow-hidden opacity-[0.025]">
        <svg viewBox="0 0 120 180" className="w-[420px] h-[420px] text-white mr-10" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="60" y1="0" x2="60" y2="180"/>
          <line x1="30" y1="10" x2="90" y2="10"/>
          <line x1="30" y1="175" x2="90" y2="175"/>
          <line x1="60" y1="10" x2="20" y2="60"/>
          <line x1="60" y1="10" x2="100" y2="60"/>
          <path d="M20 60 Q10 80 20 90 Q35 100 60 90 Q85 80 100 90 Q110 80 100 60"/>
          <path d="M20 110 Q10 130 20 140 Q35 150 60 140 Q85 130 100 140 Q110 130 100 110"/>
          <line x1="60" y1="90" x2="20" y2="110"/>
          <line x1="60" y1="90" x2="100" y2="110"/>
        </svg>
      </div>

      {/* Left gold accent */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px]"
           style={{ background: 'linear-gradient(180deg, transparent, #B8962E 30%, #5FA8A0 70%, transparent)' }} />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-20">

        {/* Authority strip */}
        <div className="authority-strip mb-6" lang={selectedLang}>
          {copy.operatesUnder} BNSS 2023 &nbsp;·&nbsp; BNS 2023 &nbsp;·&nbsp; POCSO 2012 &nbsp;·&nbsp; PWDVA 2005 &nbsp;·&nbsp; MWPSC 2007
        </div>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-start">

          {/* LEFT */}
          <div className="lg:col-span-7 space-y-7">

            {/* Eyebrow */}
            <div className="flex items-center gap-3">
              <span className="w-10 h-px bg-teal/50" />
              <span className="section-label-dark" lang={selectedLang}>{copy.established}</span>
            </div>

            {/* Headline — gradient text ONLY on this element */}
            <div className="flex items-start gap-4">
              <h1
                lang={selectedLang}
                className="font-serif font-bold leading-[1.04] tracking-tight
                           text-[2.4rem] sm:text-5xl lg:text-[4.75rem] flex-1 gradient-headline"
              >
                {copy.headline}
              </h1>
              <div className="mt-2 shrink-0">
                <SpeakerButton text={`${copy.headline} ${copy.lede}`} language={selectedLang} variant="inline" />
              </div>
            </div>

            {/* Lede — plain white, no colour accent */}
            <p lang={selectedLang} className="max-w-xl text-lg sm:text-xl text-white/[0.82] leading-relaxed font-normal">
              {copy.lede}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href={`/home?lang=${selectedLang}`}
                lang={selectedLang}
                className="inline-flex items-center justify-center px-7 py-4 bg-teal text-white
                           text-sm font-semibold uppercase tracking-[0.16em] rounded-sm
                           transition-all duration-500 hover:bg-[#4D9990] hover:shadow-md
                           hover:-translate-y-px active:scale-[0.98]"
              >
                {copy.ctaHelp}
              </Link>
              <a
                href="#practice"
                lang={selectedLang}
                className="fr-btn-ghost inline-flex items-center justify-center px-7 py-4
                           text-sm font-semibold uppercase tracking-[0.16em] rounded-sm"
              >
                {copy.ctaPractice}
              </a>
            </div>

            {/* Statute chips */}
            <div className="pt-1">
              <div className="authority-strip mb-3" lang={selectedLang}>{copy.operatesUnder}</div>
              <div className="flex flex-wrap gap-2">
                {STATUTES.map((s) => (
                  <span key={s} className="citation-chip citation-chip-dark">{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — official stats card */}
          <aside className="lg:col-span-5">
            <div className="glass rounded-sm shadow-glass relative p-7 sm:p-8">
              {/* Gold + teal gradient top bar */}
              <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-sm"
                   style={{ background: 'linear-gradient(90deg, #B8962E 0%, #5FA8A0 50%, #B8962E 100%)' }} />

              <div className="section-label-dark mb-6 mt-2" lang={selectedLang}>{copy.statsHeadline}</div>

              <ul className="space-y-5">
                {[
                  { fig: '11',   cap: copy.statLang,  sub: 'Sarvam STT · Bulbul TTS' },
                  { fig: '5',    cap: copy.statModes,  sub: 'POCSO · PWDVA · MWPSC · Standard · Advisor' },
                  { fig: '100%', cap: copy.statOffline,   sub: 'Works on Galaxy A03, Jio 4G' },
                ].map((s, i, arr) => (
                  <li key={s.fig}>
                    <div className="flex items-baseline gap-4">
                      <span className="stat-counter text-5xl sm:text-6xl leading-none font-bold"
                            style={{ color: '#B8962E' }}>
                        {s.fig}
                      </span>
                      <div>
                        <div className="font-semibold text-base text-white/88" lang={selectedLang}>{s.cap}</div>
                        <div className="font-mono text-[10px] text-white/[0.55] mt-0.5 tracking-wider">{s.sub}</div>
                      </div>
                    </div>
                    {i < arr.length - 1 && <div className="mt-5 hairline-dark" />}
                  </li>
                ))}
              </ul>

              {/* Agent with gradient ring */}
              <div className="mt-7 pt-6 border-t border-white/10 flex items-center gap-4">
                <div className="shrink-0 p-[2px] rounded-full"
                     style={{ background: 'linear-gradient(135deg, #5FA8A0, #B8962E)' }}>
                  <div className="rounded-full bg-[#0F1F3D] p-[2px]">
                    <AgentAvatar persona={heroPersona} compact />
                  </div>
                </div>
                <div>
                  <div className="section-label-dark text-[9px]" lang={selectedLang}>{copy.yourCounsel}</div>
                  <div className="font-serif text-lg text-white/85 italic mt-0.5" lang={selectedLang}>{copy.onTheLine}</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="h-px"
           style={{ background: 'linear-gradient(90deg, transparent, rgba(95,168,160,0.25), transparent)' }} />
    </section>
  );
}
