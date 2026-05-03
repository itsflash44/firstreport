'use client';

import React from 'react';
import Link from 'next/link';
import SpeakerButton from '@/components/SpeakerButton';
import { type LangCode } from '@/lib/i18n';

interface PracticeAreasProps {
  selectedLang?: LangCode;
}

interface PersonaCard {
  id: string;
  icon: React.ReactNode;
  titleHi: string;
  titleEn: string;
  subHi: string;
  subEn: string;
  statutes: string[];
  accentColor: string;
  borderColor: string;
}

const PRACTICE_CARDS: PersonaCard[] = [
  {
    id: 'standard',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    titleHi: 'सामान्य',
    titleEn: 'Standard',
    subHi: 'किसी भी घटना की रिपोर्ट',
    subEn: 'General incident report',
    statutes: ['BNSS 2023', 'BNS 2023'],
    accentColor: 'bg-navy',
    borderColor: 'hover:border-navy',
  },
  {
    id: 'pocso',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    titleHi: 'पोक्सो',
    titleEn: 'POCSO',
    subHi: 'बाल यौन उत्पीड़न के मामले',
    subEn: 'Child sexual abuse cases',
    statutes: ['POCSO 2012', 'BNSS 2023'],
    accentColor: 'bg-error',
    borderColor: 'hover:border-error',
  },
  {
    id: 'women_dv',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    titleHi: 'घरेलू हिंसा',
    titleEn: 'Women & DV',
    subHi: 'घरेलू हिंसा और महिला अधिकार',
    subEn: 'Domestic violence & women\'s rights',
    statutes: ['PWDVA 2005', 'BNS 2023'],
    accentColor: 'bg-teal',
    borderColor: 'hover:border-teal',
  },
  {
    id: 'senior',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    titleHi: 'वरिष्ठ नागरिक',
    titleEn: 'Senior Citizen',
    subHi: 'बुज़ुर्गों के लिए कानूनी सुरक्षा',
    subEn: 'Legal protection for elders',
    statutes: ['MWPSC 2007', 'BNSS 2023'],
    accentColor: 'bg-[#7B5EA7]',
    borderColor: 'hover:border-[#7B5EA7]',
  },
  {
    id: 'advisor',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    titleHi: 'सलाहकार मोड',
    titleEn: 'Legal Advisor',
    subHi: 'वकीलों और NGO के लिए',
    subEn: 'For lawyers & NGO workers',
    statutes: ['BNSS 2023', 'All Acts'],
    accentColor: 'bg-secondary',
    borderColor: 'hover:border-secondary',
  },
];

const SECTION_LABELS: Partial<Record<LangCode, { title: string; sub: string; cta: string }>> = {
  'hi-IN': { title: 'हम किसकी मदद करते हैं', sub: 'पाँच विशेष क्षेत्र', cta: 'मूल्यांकन शुरू करें →' },
  'en-IN': { title: 'Who We Help', sub: 'Five specialist practice areas', cta: 'Begin Assessment →' },
  'bn-IN': { title: 'আমরা কাকে সাহায্য করি', sub: 'পাঁচটি বিশেষজ্ঞ ক্ষেত্র', cta: 'মূল্যায়ন শুরু করুন →' },
  'ta-IN': { title: 'யாரை உதவுகிறோம்', sub: 'ஐந்து சிறப்பு பிரிவுகள்', cta: 'மதிப்பீடு தொடங்கு →' },
  'te-IN': { title: 'మేము ఎవరికి సహాయం చేస్తాం', sub: 'ఐదు ప్రత్యేక రంగాలు', cta: 'మూల్యాంకనం ప్రారంభించండి →' },
  'mr-IN': { title: 'आम्ही कोणाला मदत करतो', sub: 'पाच विशेष क्षेत्र', cta: 'मूल्यांकन सुरू करा →' },
  'gu-IN': { title: 'અમે કોને મદદ કરીએ', sub: 'પાંચ વિશેષ ક્ષેત્ર', cta: 'મૂલ્યાંકન શરૂ કરો →' },
  'kn-IN': { title: 'ನಾವು ಯಾರಿಗೆ ಸಹಾಯ ಮಾಡುತ್ತೇವೆ', sub: 'ಐದು ವಿಶೇಷ ಕ್ಷೇತ್ರಗಳು', cta: 'ಮೌಲ್ಯಮಾಪನ ಪ್ರಾರಂಭಿಸಿ →' },
  'ml-IN': { title: 'ആർക്ക് സഹായിക്കുന്നു', sub: 'അഞ്ച് പ്രത്യേക മേഖലകൾ', cta: 'മൂല്യനിർണ്ണയം ആരംഭിക്കുക →' },
  'pa-IN': { title: 'ਅਸੀਂ ਕਿਸ ਦੀ ਮਦਦ ਕਰਦੇ ਹਾਂ', sub: 'ਪੰਜ ਵਿਸ਼ੇਸ਼ ਖੇਤਰ', cta: 'ਮੁਲਾਂਕਣ ਸ਼ੁਰੂ ਕਰੋ →' },
  'od-IN': { title: 'ଆମ୍ଭେ କାହାକୁ ସାହାଯ୍ୟ କରୁ', sub: 'ପାଞ୍ଚଟି ବିଶେଷ କ୍ଷେତ୍ର', cta: 'ମୂଲ୍ୟାଙ୍କନ ଆରମ୍ଭ କରନ୍ତୁ →' },
};

export default function PracticeAreas({ selectedLang = 'en-IN' }: PracticeAreasProps) {
  const labels = SECTION_LABELS[selectedLang] ?? SECTION_LABELS['en-IN']!;

  return (
    <section id="practice" className="py-20 sm:py-28 bg-off-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Section header */}
        <div className="max-w-3xl mb-14 sm:mb-16">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-px bg-teal" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-secondary">
              {labels.sub}
            </span>
          </div>
          <div className="flex items-start gap-4">
            <h2
              lang={selectedLang}
              className="font-serif text-4xl sm:text-5xl lg:text-6xl text-navy leading-[1.05] tracking-tight flex-1"
            >
              {labels.title}
            </h2>
            <div className="mt-1 shrink-0">
              <SpeakerButton
                text={`${labels.title}. ${PRACTICE_CARDS.map(c => `${c.titleEn}: ${c.subEn}`).join('. ')}`}
                language={selectedLang}
                variant="inline"
              />
            </div>
          </div>
        </div>

        {/* Cards grid — 2 col on md, 3 on lg, last card centered */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PRACTICE_CARDS.map((card) => (
            <article
              key={card.id}
              className="group relative bg-white border border-cool-gray rounded-md shadow-sm
                         hover:shadow-md transition-all duration-200 overflow-hidden
                         flex flex-col"
            >
              {/* Top accent strip */}
              <div className={`h-1 w-full ${card.accentColor}`} />

              <div className="p-6 flex-1 flex flex-col">
                {/* Icon + title row */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-sm flex items-center justify-center text-white ${card.accentColor}`}>
                    {card.icon}
                  </div>
                  <SpeakerButton
                    text={`${card.titleEn}. ${card.subEn}. Statutes: ${card.statutes.join(', ')}.`}
                    language={selectedLang}
                    variant="mini"
                  />
                </div>

                {/* Title */}
                <div className="mb-1">
                  <span lang={selectedLang} className="font-serif text-xl font-bold text-navy">
                    {card.titleHi}
                  </span>
                  <span className="font-semibold text-sm text-secondary ml-2">
                    {card.titleEn}
                  </span>
                </div>

                {/* Subtitle */}
                <p lang={selectedLang} className="text-sm text-secondary leading-relaxed mb-4 flex-1">
                  {card.subHi}
                  <span className="block text-xs text-secondary/70 mt-0.5">{card.subEn}</span>
                </p>

                {/* Statute tags */}
                <div className="flex flex-wrap gap-1.5 mt-auto">
                  {card.statutes.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em]
                                 bg-off-white border border-cool-gray text-secondary rounded-sm"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Hover border overlay */}
              <div className={`absolute inset-0 border-2 border-transparent rounded-md transition-colors duration-200 pointer-events-none ${card.borderColor}`} />
            </article>
          ))}
        </div>

        {/* Begin Assessment CTA */}
        <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="#assessment"
            className="inline-flex items-center justify-center px-10 py-4 bg-navy text-white rounded-sm
                       text-sm font-semibold uppercase tracking-[0.18em]
                       hover:bg-navy/90 active:scale-[0.98] transition-all shadow-sm"
          >
            {labels.cta}
          </Link>
          <div className="flex items-center gap-2">
            <SpeakerButton
              text={labels.cta}
              language={selectedLang}
              variant="mini"
            />
            <span className="text-xs text-secondary">
              {selectedLang === 'hi-IN' ? 'सुनने के लिए दबाएं' : 'Tap to hear'}
            </span>
          </div>
        </div>

        {/* NALSA helpline */}
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-secondary">
          <span className="w-1.5 h-1.5 rounded-full bg-error animate-rec shrink-0" />
          <span>NALSA Helpline:</span>
          <a href="tel:15100" className="font-semibold text-error hover:underline">15100</a>
        </div>
      </div>
    </section>
  );
}
