'use client';

import SpeakerButton from '@/components/SpeakerButton';
import { type LangCode } from '@/lib/i18n';

interface HowItWorksProps {
  selectedLang?: LangCode;
}

const STEPS = [
  {
    num: 'I',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
    titleEn: 'Speak',       titleHi: 'बोलें',
    bodyEn:  'Hold the mic and describe what happened — in Hindi, Tamil, Punjabi, or any of 9 other Indic languages. Sarvam STT transcribes it in real time. No English typing. Ever.',
    bodyHi:  'माइक पकड़ें और बताएं क्या हुआ — हिंदी, तमिल, पंजाबी या किसी भी 9 अन्य भारतीय भाषाओं में। Sarvam STT रियल टाइम में लिखता है। कभी भी अंग्रेज़ी टाइप नहीं।',
    statute: 'Sarvam STT · 11 Languages',
    accentColor: '#5FA8A0',
  },
  {
    num: 'II',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
    titleEn: 'Triage',      titleHi: 'वर्गीकरण',
    bodyEn:  'Gemma 4 cross-references your account against BNSS 2023, POCSO, PWDVA, and MWPSC. It determines cognizable vs. non-cognizable and the correct escalation chain.',
    bodyHi:  'Gemma 4 आपकी बात को BNSS 2023, POCSO, PWDVA और MWPSC के खिलाफ क्रॉस-रेफरेंस करता है। यह संज्ञेय बनाम असंज्ञेय और सही escalation chain निर्धारित करता है।',
    statute: 'Gemma 4 · BNSS 2023',
    accentColor: '#B8962E',
  },
  {
    num: 'III',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    titleEn: 'File',        titleHi: 'दर्ज करें',
    bodyEn:  'Receive ready-to-file documents — SP complaint today, DM petition in 3 days, High Court writ in 18. Delivered via Telegram. Printable at any neighbourhood shop.',
    bodyHi:  'तैयार-to-file दस्तावेज़ प्राप्त करें — आज SP शिकायत, 3 दिन में DM याचिका, 18 में High Court रिट। Telegram पर पहुँचाए गए। किसी भी पास की दुकान पर प्रिंट करें।',
    statute: 'Telegram · Offline-Ready',
    accentColor: '#0F1F3D',
  },
];

const SECTION_COPY: Partial<Record<LangCode, { eyebrow: string; title: string; em: string }>> = {
  'en-IN': { eyebrow: 'The Procedure', title: 'Three deliberate steps — ', em: 'no English required.' },
  'hi-IN': { eyebrow: 'प्रक्रिया',     title: 'तीन सुनिश्चित चरण — ',   em: 'कोई अंग्रेज़ी ज़रूरी नहीं।' },
  'bn-IN': { eyebrow: 'পদ্ধতি',         title: 'তিনটি সুনির্দিষ্ট ধাপ — ', em: 'ইংরেজি ছাড়াই।' },
  'ta-IN': { eyebrow: 'நடைமுறை',        title: 'மூன்று படிகள் — ',         em: 'ஆங்கிலம் தேவையில்லை.' },
  'te-IN': { eyebrow: 'విధానం',          title: 'మూడు దశలు — ',             em: 'ఇంగ్లీష్ అవసరం లేదు.' },
  'mr-IN': { eyebrow: 'प्रक्रिया',       title: 'तीन निश्चित टप्पे — ',     em: 'इंग्रजी आवश्यक नाही.' },
  'gu-IN': { eyebrow: 'પ્રક્રિયા',       title: 'ત્રણ નક્કી પગલાં — ',      em: 'અંગ્રેજી જરૂરી નથી.' },
  'kn-IN': { eyebrow: 'ಪ್ರಕ್ರಿಯೆ',      title: 'ಮೂರು ನಿರ್ಧಿಷ್ಟ ಹಂತಗಳು — ', em: 'ಇಂಗ್ಲಿಷ್ ಬೇಕಿಲ್ಲ.' },
  'ml-IN': { eyebrow: 'നടപടിക്രമം',     title: 'മൂന്ന് ഘട്ടങ്ങൾ — ',        em: 'ഇംഗ്ലീഷ് വേണ്ട.' },
  'pa-IN': { eyebrow: 'ਪ੍ਰਕਿਰਿਆ',       title: 'ਤਿੰਨ ਕਦਮ — ',              em: 'ਅੰਗਰੇਜ਼ੀ ਦੀ ਲੋੜ ਨਹੀਂ।' },
  'od-IN': { eyebrow: 'ପ୍ରକ୍ରିୟା',      title: 'ତିନୋଟି ନିର୍ଦ୍ଦିଷ୍ଟ ପଦକ୍ଷେପ — ', em: 'ଇଂରାଜୀ ଆବଶ୍ୟକ ନାହିଁ।' },
};

export default function HowItWorks({ selectedLang = 'en-IN' }: HowItWorksProps) {
  const isHindi = selectedLang === 'hi-IN';
  const copy = SECTION_COPY[selectedLang] ?? SECTION_COPY['en-IN']!;

  const fullSpeakText = STEPS.map(
    (s) => `${isHindi ? s.titleHi : s.titleEn}. ${isHindi ? s.bodyHi : s.bodyEn}`
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
            const title = isHindi ? step.titleHi : step.titleEn;
            const body  = isHindi ? step.bodyHi  : step.bodyEn;
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
                      · {isHindi ? step.titleEn : step.titleHi}
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
          <div className="authority-strip text-center">
            Pursuant to BNSS 2023 &nbsp;·&nbsp; BNS 2023 &nbsp;·&nbsp; POCSO 2012 &nbsp;·&nbsp; PWDVA 2005 &nbsp;·&nbsp; MWPSC 2007 &nbsp;·&nbsp; DPDP 2023
          </div>
        </div>
      </div>
    </section>
  );
}
