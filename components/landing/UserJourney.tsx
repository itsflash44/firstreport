'use client';

import Link from 'next/link';
import { type LangCode } from '@/lib/i18n';
import SpeakerButton from '@/components/SpeakerButton';

interface UserJourneyProps {
  selectedLang?: LangCode;
}

import { JOURNEY_STEPS_TL as RAW_STEPS } from '@/lib/landing-strings';

const JOURNEY_STEPS = [
  {
    ...RAW_STEPS[0],
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
      </svg>
    ),
  },
  {
    ...RAW_STEPS[1],
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    ...RAW_STEPS[2],
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
  },
  {
    ...RAW_STEPS[3],
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const SECTION_COPY: Partial<Record<LangCode, { eyebrow: string; title: string; sub: string; cta: string; tagline: string; stat1: string; stat2: string; stat3: string }>> = {
  'hi-IN': {
    eyebrow: 'एक असली कहानी',
    title: 'जब पुलिस ने मना किया, हमने हाँ कहा।',
    sub: 'सुनीता जैसे करोड़ों लोग हैं जो न्याय के हक़दार हैं — बस रास्ता नहीं जानते।',
    cta: 'मदद लें',
    tagline: 'पूरी तरह मुफ़्त · कोई टाइपिंग नहीं · अपनी भाषा में बोलें',
    stat1: 'में दस्तावेज़ तैयार', stat2: 'कानूनी दस्तावेज़', stat3: 'मुफ़्त · कोई लॉगिन नहीं',
  },
  'en-IN': {
    eyebrow: 'A real story',
    title: 'When the police said no, we said yes.',
    sub: "Millions of people like Sunita deserve justice — they just don't know the way.",
    cta: 'Get Help',
    tagline: 'Completely free · No typing required · Speak in your language',
    stat1: 'to generate documents', stat2: 'legal documents created', stat3: 'free · no login required',
  },
  'bn-IN': {
    eyebrow: 'একটি সত্য ঘটনা', title: 'পুলিশ যখন না বলল, আমরা হ্যাঁ বললাম।',
    sub: 'সুনীতার মতো কোটি কোটি মানুষ ন্যায়বিচারের যোগ্য — তারা শুধু পথ জানে না।',
    cta: 'সাহায্য নিন', tagline: 'সম্পূর্ণ বিনামূল্যে · টাইপ করার দরকার নেই · আপনার ভাষায় বলুন',
    stat1: 'এ নথি তৈরি', stat2: 'আইনি নথি তৈরি', stat3: 'বিনামূল্যে · লগইন দরকার নেই',
  },
  'ta-IN': {
    eyebrow: 'ஒரு உண்மையான கதை', title: 'போலீஸ் மறுத்தபோது, நாங்கள் சரி என்றோம்.',
    sub: 'சுனிதா போன்ற கோடிக்கணக்கான மக்கள் நீதிக்கு தகுதியானவர்கள்.',
    cta: 'உதவி பெறு', tagline: 'முற்றிலும் இலவசம் · டைப்பிங் தேவையில்லை · உங்கள் மொழியில் பேசுங்கள்',
    stat1: 'இல் ஆவணம் தயார்', stat2: 'சட்ட ஆவணங்கள்', stat3: 'இலவசம் · உள்நுழைவு தேவையில்லை',
  },
  'te-IN': {
    eyebrow: 'ఒక నిజమైన కథ', title: 'పోలీసులు వద్దన్నప్పుడు, మేము అవుననన్నాం.',
    sub: 'సునీతా లాంటి కోట్లమంది న్యాయానికి అర్హులు — వారికి మార్గం తెలియదు.',
    cta: 'సహాయం పొందండి', tagline: 'పూర్తిగా ఉచితం · టైపింగ్ అవసరం లేదు · మీ భాషలో మాట్లాడండి',
    stat1: 'లో పత్రాలు సిద్ధం', stat2: 'చట్టపరమైన పత్రాలు', stat3: 'ఉచితం · లాగిన్ అవసరం లేదు',
  },
  'mr-IN': {
    eyebrow: 'एक खरी कथा', title: 'पोलीसांनी नकार दिला तेव्हा, आम्ही हो म्हणालो.',
    sub: 'सुनीतासारख्या कोट्यवधी लोक न्यायासाठी पात्र आहेत.',
    cta: 'मदत घ्या', tagline: 'पूर्णपणे मोफत · टायपिंगची गरज नाही · तुमच्या भाषेत बोला',
    stat1: 'मध्ये कागदपत्रे तयार', stat2: 'कायदेशीर कागदपत्रे', stat3: 'मोफत · लॉगिन नाही',
  },
  'gu-IN': {
    eyebrow: 'એક સાચી વાર્તા', title: 'પોલીસે ના પાડી ત્યારે, અમે હા પાડી.',
    sub: 'સુનિતા જેવા કરોડો લોકો ન્યાયના હક્કદાર છે.',
    cta: 'મદદ મેળવો', tagline: 'સંપૂર્ણપણે મફત · ટાઇપ કરવાની જરૂર નથી · તમારી ભાષામાં બોલો',
    stat1: 'માં દસ્તાવેજો તૈયાર', stat2: 'કાનૂની દસ્તાવેજો', stat3: 'મફત · લોગિન જરૂરી નથી',
  },
  'kn-IN': {
    eyebrow: 'ಒಂದು ನಿಜವಾದ ಕಥೆ', title: 'ಪೊಲೀಸರು ಇಲ್ಲ ಎಂದಾಗ, ನಾವು ಹೌದು ಎಂದೆವು.',
    sub: 'ಸುನೀತಾ ಅಂಥ ಕೋಟ್ಯಂತರ ಜನರು ನ್ಯಾಯಕ್ಕೆ ಅರ್ಹರು.',
    cta: 'ಸಹಾಯ ಪಡೆಯಿರಿ', tagline: 'ಸಂಪೂರ್ಣ ಉಚಿತ · ಟೈಪಿಂಗ್ ಅಗತ್ಯವಿಲ್ಲ · ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಮಾತನಾಡಿ',
    stat1: 'ನಲ್ಲಿ ದಾಖಲೆಗಳು ಸಿದ್ಧ', stat2: 'ಕಾನೂನು ದಾಖಲೆಗಳು', stat3: 'ಉಚಿತ · ಲಾಗಿನ್ ಅಗತ್ಯವಿಲ್ಲ',
  },
  'ml-IN': {
    eyebrow: 'ഒരു യഥാർത്ഥ കഥ', title: 'പോലീസ് വേണ്ടെന്ന് പറഞ്ഞപ്പോൾ, ഞങ്ങൾ ശരി എന്ന് പറഞ്ഞു.',
    sub: 'സുനിതയെപ്പോലുള്ള കോടിക്കണക്കിന് ആളുകൾ നീതിക്ക് അർഹരാണ്.',
    cta: 'സഹായം നേടുക', tagline: 'പൂർണ്ണമായും സൗജന്യം · ടൈപ്പിംഗ് വേണ്ട · നിങ്ങളുടെ ഭാഷയിൽ സംസാരിക്കൂ',
    stat1: 'ൽ രേഖകൾ തയ്യാർ', stat2: 'നിയമ രേഖകൾ', stat3: 'സൗജന്യം · ലോഗിൻ ആവശ്യമില്ല',
  },
  'pa-IN': {
    eyebrow: 'ਇੱਕ ਅਸਲੀ ਕਹਾਣੀ', title: 'ਜਦੋਂ ਪੁਲਿਸ ਨੇ ਨਾਂ ਕਿਹਾ, ਅਸੀਂ ਹਾਂ ਕਿਹਾ।',
    sub: 'ਸੁਨੀਤਾ ਵਰਗੇ ਕਰੋੜਾਂ ਲੋਕ ਇਨਸਾਫ਼ ਦੇ ਹੱਕਦਾਰ ਹਨ।',
    cta: 'ਮਦਦ ਲਓ', tagline: 'ਪੂਰੀ ਤਰ੍ਹਾਂ ਮੁਫ਼ਤ · ਟਾਈਪ ਕਰਨ ਦੀ ਲੋੜ ਨਹੀਂ · ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਬੋਲੋ',
    stat1: 'ਵਿੱਚ ਦਸਤਾਵੇਜ਼ ਤਿਆਰ', stat2: 'ਕਾਨੂੰਨੀ ਦਸਤਾਵੇਜ਼', stat3: 'ਮੁਫ਼ਤ · ਲਾਗਇਨ ਦੀ ਲੋੜ ਨਹੀਂ',
  },
  'od-IN': {
    eyebrow: 'ଏକ ପ୍ରକୃତ ଘଟଣା', title: 'ପୋଲିସ ଯେତେବେଳେ ନା କହିଲେ, ଆମେ ହଁ କହିଲୁ।',
    sub: 'ସୁନୀତା ଭଳି କୋଟି କୋଟି ଲୋକ ନ୍ୟାୟ ପାଇଁ ଯୋଗ୍ୟ।',
    cta: 'ସାହାଯ୍ୟ ନିଅ', tagline: 'ସଂପୂର୍ଣ୍ଣ ମାଗଣା · ଟାଇପ କରିବା ଦରକାର ନାହିଁ · ଆପଣଙ୍କ ଭାଷାରେ କଥାବାର୍ତ୍ତା କରନ୍ତୁ',
    stat1: 'ରେ ଦଲିଲ ପ୍ରସ୍ତୁତ', stat2: 'ଆଇନଗତ ଦଲିଲ', stat3: 'ମାଗଣା · ଲଗଇନ ଦରକାର ନାହିଁ',
  },
};

export default function UserJourney({ selectedLang = 'en-IN' }: UserJourneyProps) {
  const copy = SECTION_COPY[selectedLang] ?? SECTION_COPY['en-IN']!;

  const fullSpeakText = JOURNEY_STEPS.map(
    (s) => `${s.title[selectedLang] ?? s.title['en-IN']}. ${s.body[selectedLang] ?? s.body['en-IN']}`
  ).join(' ');

  return (
    <section
      id="story"
      className="py-20 sm:py-28 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #F5F2EC 0%, #EDE9E0 100%)' }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Section header */}
        <div className="max-w-3xl mb-16 scroll-reveal">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-10 h-px bg-teal/50" />
            <span className="section-label">{copy.eyebrow}</span>
          </div>
          <div className="flex items-start gap-4">
            <h2
              lang={selectedLang}
              className="font-serif font-bold text-4xl sm:text-5xl lg:text-[3.25rem] text-navy-deep leading-[1.06] tracking-tight flex-1"
            >
              {copy.title}
            </h2>
            <div className="mt-1 shrink-0">
              <SpeakerButton text={fullSpeakText} language={selectedLang} variant="inline" />
            </div>
          </div>
          <p lang={selectedLang} className="mt-5 text-lg text-secondary leading-relaxed max-w-xl">
            {copy.sub}
          </p>
        </div>

        {/* Journey — vertical timeline */}
        <div className="relative">

          {/* Vertical connector line — desktop */}
          <div className="hidden lg:block absolute left-[2.75rem] top-10 bottom-10 w-px"
               style={{ background: 'linear-gradient(180deg, rgba(95,168,160,0.3) 0%, rgba(184,150,46,0.3) 100%)' }} />

          <div className="space-y-5">
            {JOURNEY_STEPS.map((step, idx) => {
              const title = step.title[selectedLang] ?? step.title['en-IN'];
              const body  = step.body[selectedLang] ?? step.body['en-IN'];
              return (
              <div
                key={step.step}
                className="scroll-reveal relative flex gap-6 lg:gap-10 items-start"
                style={{ transitionDelay: `${idx * 80}ms` }}
              >
                {/* Step circle — desktop */}
                <div
                  className="hidden lg:flex w-[5.5rem] shrink-0 flex-col items-center gap-2 pt-6"
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold font-mono text-xs shrink-0"
                    style={{ background: `linear-gradient(135deg, #5FA8A0, #B8962E)`, boxShadow: '0 2px 8px rgba(15,31,61,0.12)' }}
                  >
                    {step.step}
                  </div>
                </div>

                {/* Card */}
                <div
                  className="flex-1 bg-white border border-cool-gray rounded-sm shadow-card
                             hover:shadow-lift transition-all duration-500 hover:-translate-y-0.5
                             overflow-hidden"
                >
                  {/* Left accent bar */}
                  <div className="flex">
                    <div className="w-[3px] shrink-0 rounded-l-sm" style={{ background: step.accentColor }} />
                    <div className="flex-1 p-6 sm:p-7">
                      {/* Mobile step badge */}
                      <div className="flex items-center gap-3 mb-3 lg:hidden">
                        <span
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold font-mono text-[10px]"
                          style={{ background: 'linear-gradient(135deg, #5FA8A0, #B8962E)' }}
                        >
                          {step.step}
                        </span>
                        <span className="citation-chip citation-chip-light">{step.statute}</span>
                      </div>

                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3
                            lang={selectedLang}
                            className="font-serif font-bold text-xl sm:text-2xl text-navy-deep mb-2 leading-snug"
                          >
                            {title}
                          </h3>
                          <p lang={selectedLang} className="text-sm sm:text-base text-secondary leading-relaxed">
                            {body}
                          </p>
                        </div>
                        {/* Icon + statute + speaker — desktop */}
                        <div className="hidden lg:flex flex-col items-end gap-2 shrink-0">
                          <div
                            className="w-10 h-10 rounded-sm flex items-center justify-center text-white"
                            style={{ background: step.accentColor }}
                          >
                            {step.icon}
                          </div>
                          <span className="citation-chip citation-chip-light">{step.statute}</span>
                          <SpeakerButton
                            text={`${title}. ${body}`}
                            language={selectedLang}
                            variant="mini"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )})}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-14 flex flex-col sm:flex-row items-center gap-5 scroll-reveal">
          <Link
            href={`/home?lang=${selectedLang}`}
            className="inline-flex items-center justify-center gap-2 px-8 py-4
                       bg-navy-deep text-white text-sm font-semibold uppercase tracking-[0.18em]
                       rounded-sm transition-all duration-500 hover:bg-navy hover:shadow-md
                       hover:-translate-y-px active:scale-[0.98]"
          >
            {copy.cta} →
          </Link>
          <p className="text-sm text-secondary max-w-xs text-center sm:text-left" lang={selectedLang}>
            {copy.tagline}
          </p>
        </div>

        {/* Stat strip */}
        <div className="mt-12 pt-10 border-t border-cool-gray grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-10 scroll-reveal">
          {[
            { fig: '3', unit: 'min', label: copy.stat1 },
            { fig: '4', unit: '',    label: copy.stat2 },
            { fig: '100', unit: '%', label: copy.stat3 },
          ].map((s) => (
            <div key={s.fig}>
              <div className="flex items-baseline gap-0.5">
                <span className="stat-counter text-4xl sm:text-5xl font-bold leading-none"
                      style={{ color: '#B8962E' }}>{s.fig}</span>
                {s.unit && <span className="font-serif text-xl text-gold ml-0.5">{s.unit}</span>}
              </div>
              <div className="text-xs sm:text-sm text-secondary mt-1.5 font-medium" lang={selectedLang}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
