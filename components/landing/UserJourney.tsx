'use client';

import Link from 'next/link';
import { type LangCode } from '@/lib/i18n';
import SpeakerButton from '@/components/SpeakerButton';

interface UserJourneyProps {
  selectedLang?: LangCode;
}

const JOURNEY_STEPS = [
  {
    step: '01',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
      </svg>
    ),
    titleHi: 'सुनीता के साथ अन्याय हुआ',
    titleEn: 'Sunita faces injustice',
    bodyHi:
      'गाज़ियाबाद की सुनीता देवी, 38 साल, घरेलू सहायिका। पड़ोसी ने उनकी अलमारी से ₹4,000 चुरा लिए। वो थाने गईं — पुलिस ने FIR लिखने से मना कर दिया।',
    bodyEn:
      'Sunita Devi, 38, a domestic worker in Ghaziabad. Her neighbour stole ₹4,000 from her cupboard. She went to the police station — they refused to register an FIR.',
    statute: 'BNSS § 173',
    accentColor: 'rgba(217,83,79,0.6)',
  },
  {
    step: '02',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
    titleHi: 'उसने अपनी आवाज़ में बताया',
    titleEn: 'She spoke in her own voice',
    bodyHi:
      'सुनीता पढ़ नहीं सकतीं। टाइप नहीं कर सकतीं। लेकिन वो बोल सकती हैं। FirstReport खोला — हिंदी में बोला — Gemma AI ने सुना और समझा।',
    bodyEn:
      'Sunita cannot read or type. But she can speak. She opened FirstReport, described what happened in Hindi — Gemma AI listened, understood, and recorded everything in three minutes.',
    statute: 'Sarvam STT',
    accentColor: 'rgba(95,168,160,0.6)',
  },
  {
    step: '03',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
    titleHi: 'क़ानून ने उसका साथ दिया',
    titleEn: 'The law stepped in for her',
    bodyHi:
      'AI ने BNSS धारा 303 पहचानी — संज्ञेय अपराध। तुरंत चार दस्तावेज़ तैयार हुए: SP शिकायत, DM याचिका, High Court रिट, और जवाबदेही पत्र।',
    bodyEn:
      'Gemma identified BNSS Section 303 — cognizable offence. Four documents were instantly generated: SP Complaint, DM Petition, HC Writ, and an Officer Accountability letter. All in Hindi.',
    statute: 'BNSS § 303',
    accentColor: 'rgba(184,150,46,0.6)',
  },
  {
    step: '04',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    titleHi: 'सुनीता ने न्याय माँगा',
    titleEn: 'Sunita demanded justice',
    bodyHi:
      'दस्तावेज़ Telegram पर मिले। पड़ोस की दुकान पर प्रिंट हुए। SP दफ़्तर में जमा किए। अगले दिन — FIR दर्ज हो गई।',
    bodyEn:
      'Documents arrived on Telegram. Printed at the neighbourhood shop. Submitted to the SP office. The next day — the FIR was registered. The law was always on her side.',
    statute: 'Justice Served',
    accentColor: 'rgba(95,168,160,0.9)',
  },
];

const SECTION_COPY: Partial<Record<LangCode, { eyebrow: string; title: string; sub: string; cta: string }>> = {
  'hi-IN': {
    eyebrow: 'एक असली कहानी',
    title: 'जब पुलिस ने मना किया, हमने हाँ कहा।',
    sub: 'सुनीता जैसे करोड़ों लोग हैं जो न्याय के हक़दार हैं — बस रास्ता नहीं जानते।',
    cta: 'मदद लें',
  },
  'en-IN': {
    eyebrow: 'A real story',
    title: 'When the police said no, we said yes.',
    sub: "Millions of people like Sunita deserve justice — they just don't know the way.",
    cta: 'Get Help',
  },
};

export default function UserJourney({ selectedLang = 'en-IN' }: UserJourneyProps) {
  const copy = SECTION_COPY[selectedLang] ?? SECTION_COPY['en-IN']!;
  const isHindi = selectedLang === 'hi-IN';

  const fullSpeakText = JOURNEY_STEPS.map(
    (s) => `${isHindi ? s.titleHi : s.titleEn}. ${isHindi ? s.bodyHi : s.bodyEn}`
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
            {JOURNEY_STEPS.map((step, idx) => (
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
                            {isHindi ? step.titleHi : step.titleEn}
                          </h3>
                          <p lang={selectedLang} className="text-sm sm:text-base text-secondary leading-relaxed">
                            {isHindi ? step.bodyHi : step.bodyEn}
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
                            text={`${isHindi ? step.titleHi : step.titleEn}. ${isHindi ? step.bodyHi : step.bodyEn}`}
                            language={selectedLang}
                            variant="mini"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
            {isHindi
              ? 'पूरी तरह मुफ़्त · कोई टाइपिंग नहीं · हिंदी में बोलें'
              : 'Completely free · No typing required · Speak in your language'}
          </p>
        </div>

        {/* Stat strip */}
        <div className="mt-12 pt-10 border-t border-cool-gray grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-10 scroll-reveal">
          {[
            { fig: '3', unit: 'min', label: isHindi ? 'में दस्तावेज़ तैयार' : 'to generate documents' },
            { fig: '4', unit: '',    label: isHindi ? 'कानूनी दस्तावेज़' : 'legal documents created' },
            { fig: '100', unit: '%', label: isHindi ? 'मुफ़्त · कोई लॉगिन नहीं' : 'free · no login required' },
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
