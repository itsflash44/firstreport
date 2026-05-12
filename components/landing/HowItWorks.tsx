'use client';

import SpeakerButton from '@/components/SpeakerButton';
import { type LangCode } from '@/lib/i18n';

interface HowItWorksProps {
  selectedLang?: LangCode;
}

import { HOW_IT_WORKS_STEPS as RAW_STEPS } from '@/lib/landing-strings';

const STEPS = [
  {
    ...RAW_STEPS[0],
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    ...RAW_STEPS[1],
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
  },
  {
    ...RAW_STEPS[2],
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

const SECTION_COPY: Partial<Record<LangCode, { eyebrow: string; title: string; em: string; pursuant: string }>> = {
  'en-IN': { eyebrow: 'The Procedure', title: 'Three deliberate steps — ', em: 'no English required.', pursuant: 'Pursuant to' },
  'hi-IN': { eyebrow: 'प्रक्रिया',     title: 'तीन सुनिश्चित चरण — ',   em: 'कोई अंग्रेज़ी ज़रूरी नहीं।', pursuant: 'के अनुसार' },
  'bn-IN': { eyebrow: 'পদ্ধতি',         title: 'তিনটি সুনির্দিষ্ট ধাপ — ', em: 'ইংরেজি ছাড়াই।', pursuant: 'অনুসারে' },
  'ta-IN': { eyebrow: 'நடைமுறை',        title: 'மூன்று படிகள் — ',         em: 'ஆங்கிலம் தேவையில்லை.', pursuant: 'இன் படி' },
  'te-IN': { eyebrow: 'విధానం',          title: 'మూడు దశలు — ',             em: 'ఇంగ్లీష్ అవసరం లేదు.', pursuant: 'ప్రకారం' },
  'mr-IN': { eyebrow: 'प्रक्रिया',       title: 'तीन निश्चित टप्पे — ',     em: 'इंग्रजी आवश्यक नाही.', pursuant: 'अनुसार' },
  'gu-IN': { eyebrow: 'પ્રક્રિયા',       title: 'ત્રણ નક્કી પગલાં — ',      em: 'અંગ્રેજી જરૂરી નથી.', pursuant: 'અનુસાર' },
  'kn-IN': { eyebrow: 'ಪ್ರಕ್ರಿಯೆ',      title: 'ಮೂರು ನಿರ್ಧಿಷ್ಟ ಹಂತಗಳು — ', em: 'ಇಂಗ್ಲಿಷ್ ಬೇಕಿಲ್ಲ.', pursuant: 'ಅನುಸಾರ' },
  'ml-IN': { eyebrow: 'നടപടിക്രമം',     title: 'മൂന്ന് ഘട്ടങ്ങൾ — ',        em: 'ഇംഗ്ലീഷ് വേണ്ട.', pursuant: 'അനുസരിച്ച്' },
  'pa-IN': { eyebrow: 'ਪ੍ਰਕਿਰਿਆ',       title: 'ਤਿੰਨ ਕਦਮ — ',              em: 'ਅੰਗਰੇਜ਼ੀ ਦੀ ਲੋੜ ਨਹੀਂ।', pursuant: 'ਅਨੁਸਾਰ' },
  'od-IN': { eyebrow: 'ପ୍ରକ୍ରିୟା',      title: 'ତିନୋଟି ନିର୍ଦ୍ଦିଷ୍ଟ ପଦକ୍ଷେପ — ', em: 'ଇଂରାଜୀ ଆବଶ୍ୟକ ନାହିଁ।', pursuant: 'ଅନୁସାରେ' },
};

export default function HowItWorks({ selectedLang = 'en-IN' }: HowItWorksProps) {
  const copy = SECTION_COPY[selectedLang] ?? SECTION_COPY['en-IN']!;

  const fullSpeakText = STEPS.map(
    (s) => `${s.title[selectedLang] ?? s.title['en-IN']}. ${s.body[selectedLang] ?? s.body['en-IN']}`
  ).join(' ');

  return (
    <section
      id="how-it-works"
      className="relative py-20 sm:py-28 lg:py-36 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0F1F3D 0%, #1A2A44 60%, #0E2530 100%)' }}
    >
      {/* Faint § watermark */}
      <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-center opacity-[0.02]">
        <span className="font-serif text-[28rem] font-black text-white leading-none">§</span>
      </div>

      {/* Left accent */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px]"
           style={{ background: 'linear-gradient(180deg, transparent, #B8962E 30%, #5FA8A0 70%, transparent)' }} />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10">

        {/* Section header */}
        <div className="max-w-3xl mb-16 sm:mb-20 scroll-reveal">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-10 h-px bg-teal/50" />
            <span className="section-label-dark" lang={selectedLang}>{copy.eyebrow}</span>
          </div>
          <div className="flex items-start gap-4">
            <h2 lang={selectedLang} className="font-serif font-bold text-4xl sm:text-5xl lg:text-[3.25rem] text-white leading-[1.06] tracking-tight flex-1">
              {copy.title}
              <em className="not-italic" style={{ color: '#5FA8A0' }}>{copy.em}</em>
            </h2>
            <div className="mt-1 shrink-0">
              <SpeakerButton text={fullSpeakText} language={selectedLang} variant="inline" />
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="grid lg:grid-cols-3 gap-5 lg:gap-6">
          {STEPS.map((step, i) => {
            const title = step.title[selectedLang] ?? step.title['en-IN'];
            const body  = step.body[selectedLang] ?? step.body['en-IN'];
            return (
              <article
                key={step.num}
                className="scroll-reveal relative glass rounded-sm shadow-glass overflow-hidden
                           hover:shadow-glass-lift transition-all duration-500 hover:-translate-y-0.5"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="h-[3px] w-full"
                     style={{ background: `linear-gradient(90deg, ${step.accentColor}, rgba(255,255,255,0.2))` }} />

                <div className="p-7 sm:p-8">
                  <div className="flex items-start justify-between mb-7">
                    <span className="font-serif text-6xl font-bold leading-none" style={{ color: step.accentColor }}>
                      {step.num}
                    </span>
                    <div className="w-12 h-12 rounded-sm flex items-center justify-center text-white shrink-0"
                         style={{ background: step.accentColor }}>
                      {step.icon}
                    </div>
                  </div>

                  <div className="mb-3">
                     <h3 lang={selectedLang} className="font-serif font-bold text-2xl text-white inline">{title}</h3>
                    <span className="text-white/45 text-sm ml-2 font-normal">
                      · {selectedLang === 'en-IN' ? step.title['hi-IN'] : step.title['en-IN']}
                    </span>
                  </div>

                  <p lang={selectedLang} className="text-sm text-white/80 leading-relaxed">{body}</p>

                  <div className="mt-6 flex items-center justify-between">
                    <span className="citation-chip citation-chip-dark">{step.statute}</span>
                    <SpeakerButton text={`${title}. ${body}`} language={selectedLang} variant="mini" />
                  </div>
                </div>

                {i < STEPS.length - 1 && (
                  <div className="hidden lg:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10
                                  w-10 h-10 rounded-full items-center justify-center"
                       style={{
                         background: 'rgba(95,168,160,0.22)',
                         border: '1.5px solid rgba(95,168,160,0.65)',
                         boxShadow: '0 0 0 4px rgba(95,168,160,0.08)',
                       }}>
                    <svg className="w-4 h-4" fill="none" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" stroke="#5FA8A0" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <div className="mt-16 pt-10 border-t border-white/8">
          <div className="authority-strip text-center" lang={selectedLang}>
            {copy.pursuant} BNSS 2023 &nbsp;·&nbsp; BNS 2023 &nbsp;·&nbsp; POCSO 2012 &nbsp;·&nbsp; PWDVA 2005 &nbsp;·&nbsp; MWPSC 2007 &nbsp;·&nbsp; DPDP 2023
          </div>
        </div>
      </div>
    </section>
  );
}
