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
  persona: string;
  icon: React.ReactNode;
  titleHi: string;
  titleEn: string;
  subHi: string;
  subEn: string;
  whoHi: string;
  whoEn: string;
  questionsHi: string[];
  questionsEn: string[];
  documentsEn: string[];
  statutes: string[];
  accentBg: string;
  accentText: string;
}

const PRACTICE_CARDS: PersonaCard[] = [
  {
    id: 'standard',
    persona: 'standard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    titleHi: 'सामान्य FIR',
    titleEn: 'FIR Refusal',
    subHi: 'जब पुलिस ने FIR लिखने से मना किया',
    subEn: 'When police refuse to register your complaint',
    whoHi: 'हर वो नागरिक जिसकी FIR दर्ज नहीं हुई',
    whoEn: 'Any citizen whose FIR has been refused by police',
    questionsHi: ['क्या हुआ?', 'कब और कहाँ?', 'पुलिस ने क्या कहा?'],
    questionsEn: ['What happened?', 'When and where?', 'What did the police say?'],
    documentsEn: ['SP Complaint (BNSS §166)', 'DM Petition (BNSS §175)', 'HC Writ (Art. 226)', 'Officer Accountability'],
    statutes: ['BNSS 2023', 'BNS 2023'],
    accentBg: 'bg-navy-deep',
    accentText: 'text-navy-deep',
  },
  {
    id: 'pocso',
    persona: 'pocso',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    titleHi: 'बाल संरक्षण',
    titleEn: 'Child Protection',
    subHi: 'बच्चों के यौन उत्पीड़न के मामले — POCSO',
    subEn: 'Child sexual abuse — mandatory reporting under POCSO',
    whoHi: 'बच्चे के माता-पिता, अभिभावक, या कोई भी जानकार व्यक्ति',
    whoEn: 'Parents, guardians, or any person aware of child abuse',
    questionsHi: ['बच्चे की उम्र?', 'घटना कब हुई?', 'आरोपी कौन है?'],
    questionsEn: ["Child's age?", 'When did it happen?', 'Who is the accused?'],
    documentsEn: ['POCSO Police Complaint', 'CWC Referral Letter', 'SP Escalation', 'Medical Exam Request'],
    statutes: ['POCSO 2012', 'BNSS 2023', 'JJ Act 2015'],
    accentBg: 'bg-error',
    accentText: 'text-error',
  },
  {
    id: 'women_dv',
    persona: 'women_dv',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    titleHi: 'घरेलू हिंसा',
    titleEn: 'Women & Domestic Violence',
    subHi: 'घरेलू हिंसा, दहेज उत्पीड़न, महिला अधिकार',
    subEn: "Domestic violence, dowry harassment, women's rights",
    whoHi: 'पीड़ित महिलाएं, उनके परिवार, या समर्थन करने वाले',
    whoEn: 'Survivors, their families, or support persons',
    questionsHi: ['हिंसा का प्रकार?', 'क्या दहेज की माँग थी?', 'क्या बच्चे प्रभावित हैं?'],
    questionsEn: ['Type of violence?', 'Was dowry involved?', 'Are children affected?'],
    documentsEn: ['Protection Order (PWDVA)', 'DV Complaint (PWDVA)', 'SP Complaint (BNS §85)', 'Shelter Home Request'],
    statutes: ['PWDVA 2005', 'BNS §85', 'BNSS 2023'],
    accentBg: 'bg-teal',
    accentText: 'text-teal',
  },
  {
    id: 'senior',
    persona: 'senior',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    titleHi: 'वरिष्ठ नागरिक',
    titleEn: 'Senior Citizen',
    subHi: 'बुज़ुर्गों के लिए — संपत्ति विवाद, उपेक्षा, देखभाल का अधिकार',
    subEn: 'Property disputes, abandonment, maintenance rights for elders',
    whoHi: '60 वर्ष से अधिक आयु के बुज़ुर्ग या उनके प्रतिनिधि',
    whoEn: 'Citizens aged 60+ or their representatives',
    questionsHi: ['उम्र और संपत्ति?', 'देखभाल कौन कर रहा था?', 'क्या धमकी मिली?'],
    questionsEn: ['Age and property status?', 'Who was the caretaker?', 'Were threats made?'],
    documentsEn: ['Tribunal Application (MWPSC)', 'Police Complaint', 'Maintenance Demand', 'SP Escalation'],
    statutes: ['MWPSC 2007', 'BNSS 2023'],
    accentBg: 'bg-gold',
    accentText: 'text-gold',
  },
  {
    id: 'advisor',
    persona: 'advisor',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    titleHi: 'वकील / NGO',
    titleEn: 'Legal Advisor Mode',
    subHi: 'वकीलों, पत्रकारों और NGO कार्यकर्ताओं के लिए पूर्ण पहुँच',
    subEn: 'Full access for lawyers, journalists, and NGO field workers',
    whoHi: 'कानूनी सहायता कार्यकर्ता जो दूसरों की मदद कर रहे हैं',
    whoEn: 'Legal aid workers helping clients navigate the justice system',
    questionsHi: ['केस की पृष्ठभूमि?', 'पहले क्या प्रयास हुए?', 'तत्काल राहत चाहिए?'],
    questionsEn: ['Case background?', 'Prior attempts?', 'Immediate relief needed?'],
    documentsEn: ['All 4 document types', 'Multi-language output', 'Bulk case support', 'Escalation timeline'],
    statutes: ['BNSS 2023', 'All Acts', 'Constitution'],
    accentBg: 'bg-secondary',
    accentText: 'text-secondary',
  },
  {
    id: 'others',
    persona: 'standard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    titleHi: 'अन्य',
    titleEn: 'Others',
    subHi: 'कुछ और हुआ है जो ऊपर की किसी श्रेणी में नहीं आता',
    subEn: "Something else happened that doesn't fit the categories above",
    whoHi: 'हर वो इंसान जिसे न्याय चाहिए — चाहे मामला कुछ भी हो',
    whoEn: 'Anyone who needs justice — regardless of the type of case',
    questionsHi: ['क्या हुआ?', 'कब और कहाँ?', 'आपको क्या चाहिए?'],
    questionsEn: ['What happened?', 'When and where?', 'What do you need?'],
    documentsEn: ['AI classifies your case', 'Correct BNSS section', 'Documents drafted', 'Escalation mapped'],
    statutes: ['All Acts', 'BNSS 2023', 'Constitution'],
    accentBg: 'bg-gold',
    accentText: 'text-gold',
  },
];

const SECTION_LABELS: Partial<Record<LangCode, { title: string; sub: string; cta: string; who: string; asks: string; produces: string }>> = {
  'hi-IN': {
    title: 'हम किसकी मदद करते हैं',
    sub: 'छह विशेष क्षेत्र',
    cta: 'मदद लें →',
    who: 'किसके लिए',
    asks: 'Gemma पूछेगा',
    produces: 'दस्तावेज़',
  },
  'en-IN': {
    title: 'Who We Help',
    sub: 'Six specialist practice areas',
    cta: 'Get Help →',
    who: "Who it's for",
    asks: 'Gemma will ask',
    produces: 'Documents produced',
  },
  'bn-IN': { title: 'আমরা কাকে সাহায্য করি', sub: 'ছয়টি বিশেষজ্ঞ ক্ষেত্র', cta: 'সাহায্য নিন →', who: 'কার জন্য', asks: 'Gemma জিজ্ঞেস করবে', produces: 'নথি' },
  'ta-IN': { title: 'யாரை உதவுகிறோம்', sub: 'ஆறு சிறப்பு பிரிவுகள்', cta: 'உதவி பெறுங்கள் →', who: 'யாருக்கு', asks: 'Gemma கேட்கும்', produces: 'ஆவணங்கள்' },
  'te-IN': { title: 'మేము ఎవరికి సహాయం చేస్తాం', sub: 'ఆరు ప్రత్యేక రంగాలు', cta: 'సహాయం పొందండి →', who: 'ఎవరికి', asks: 'Gemma అడుగుతుంది', produces: 'పత్రాలు' },
  'mr-IN': { title: 'आम्ही कोणाला मदत करतो', sub: 'सहा विशेष क्षेत्र', cta: 'मदत घ्या →', who: 'कोणासाठी', asks: 'Gemma विचारेल', produces: 'कागदपत्रे' },
  'gu-IN': { title: 'અમે કોને મદદ કરીએ', sub: 'છ વિશેષ ક્ષેત્ર', cta: 'મદદ મેળવો →', who: 'કોના માટે', asks: 'Gemma પૂછશે', produces: 'દસ્તાવેજ' },
  'kn-IN': { title: 'ನಾವು ಯಾರಿಗೆ ಸಹಾಯ ಮಾಡುತ್ತೇವೆ', sub: 'ಆರು ವಿಶೇಷ ಕ್ಷೇತ್ರಗಳು', cta: 'ಸಹಾಯ ಪಡೆಯಿರಿ →', who: 'ಯಾರಿಗಾಗಿ', asks: 'Gemma ಕೇಳುತ್ತದೆ', produces: 'ದಾಖಲೆಗಳು' },
  'ml-IN': { title: 'ആർക്ക് സഹായിക്കുന്നു', sub: 'ആറ് പ്രത്യേക മേഖലകൾ', cta: 'സഹായം നേടൂ →', who: 'ആർക്ക്', asks: 'Gemma ചോദിക്കും', produces: 'രേഖകൾ' },
  'pa-IN': { title: 'ਅਸੀਂ ਕਿਸ ਦੀ ਮਦਦ ਕਰਦੇ ਹਾਂ', sub: 'ਛੇ ਵਿਸ਼ੇਸ਼ ਖੇਤਰ', cta: 'ਮਦਦ ਲਓ →', who: 'ਕਿਸ ਲਈ', asks: 'Gemma ਪੁੱਛੇਗਾ', produces: 'ਦਸਤਾਵੇਜ਼' },
  'od-IN': { title: 'ଆମ୍ଭେ କାହାକୁ ସାହାଯ୍ୟ କରୁ', sub: 'ଛଅଟି ବିଶେଷ କ୍ଷେତ୍ର', cta: 'ସାହାଯ୍ୟ ନିଅନ୍ତୁ →', who: 'କାହା ପାଇଁ', asks: 'Gemma ପଚାରିବ', produces: 'ଦଲିଲ' },
};

export default function PracticeAreas({ selectedLang = 'en-IN' }: PracticeAreasProps) {
  const labels = SECTION_LABELS[selectedLang] ?? SECTION_LABELS['en-IN']!;
  const isHindi = selectedLang === 'hi-IN';

  return (
    <section id="practice" className="py-20 sm:py-28 bg-ivory">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Section header */}
        <div className="max-w-3xl mb-14 sm:mb-16 scroll-reveal">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-10 h-px bg-teal/50" />
            <span className="section-label">{labels.sub}</span>
          </div>
          <div className="flex items-start gap-4">
            <h2
              lang={selectedLang}
              className="font-serif font-bold text-4xl sm:text-5xl lg:text-[3.25rem] text-navy-deep leading-[1.06] tracking-tight flex-1"
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

        {/* Cards grid — 2 col on md, 3 on lg */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PRACTICE_CARDS.map((card, idx) => {
            const isOthers = card.id === 'others';
            return (
              <article
                key={card.id}
                className={`scroll-reveal group relative bg-white border border-cool-gray rounded-sm
                             shadow-card hover:shadow-lift transition-all duration-500
                             hover:-translate-y-0.5 overflow-hidden flex flex-col
                             ${isOthers ? 'border-dashed' : ''}`}
                style={{ transitionDelay: `${(idx % 3) * 60}ms` }}
              >
                {/* Gold + color gradient top bar */}
                <div className={`h-[3px] w-full ${card.accentBg}`} />

                <div className="p-6 flex-1 flex flex-col">
                  {/* Icon + speaker row */}
                  <div className="flex items-start justify-between mb-5">
                    <div className={`w-10 h-10 rounded-sm flex items-center justify-center text-white ${card.accentBg}`}>
                      {card.icon}
                    </div>
                    <SpeakerButton
                      text={`${card.titleEn}. ${card.subEn}. For: ${card.whoEn}`}
                      language={selectedLang}
                      variant="mini"
                    />
                  </div>

                  {/* Title */}
                  <h3 lang={selectedLang} className="font-serif font-bold text-xl text-navy-deep mb-1 leading-snug">
                    {isHindi ? card.titleHi : card.titleEn}
                  </h3>

                  {/* Subtitle */}
                  <p lang={selectedLang} className="text-sm text-secondary leading-relaxed mb-4">
                    {isHindi ? card.subHi : card.subEn}
                  </p>

                  {/* Who it's for */}
                  <div className="mb-3">
                    <span className="authority-strip block mb-1">{labels.who}</span>
                    <p className="text-xs text-secondary leading-snug">
                      {isHindi ? card.whoHi : card.whoEn}
                    </p>
                  </div>

                  {/* What Gemma asks */}
                  <div className="mb-3">
                    <span className="authority-strip block mb-2">{labels.asks}</span>
                    <ul className="space-y-1">
                      {(isHindi ? card.questionsHi : card.questionsEn).map((q) => (
                        <li key={q} className="flex items-center gap-2 text-xs text-secondary">
                          <span className={`font-bold shrink-0 ${card.accentText}`}>·</span>
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Documents produced */}
                  <div className="mb-4">
                    <span className="authority-strip block mb-2">{labels.produces}</span>
                    <div className="flex flex-wrap gap-1">
                      {card.documentsEn.map((d) => (
                        <span key={d} className="citation-chip citation-chip-light text-[8px]">{d}</span>
                      ))}
                    </div>
                  </div>

                  {/* Statute chips */}
                  <div className="flex flex-wrap gap-1.5 mt-auto mb-5">
                    {card.statutes.map((s) => (
                      <span key={s} className="citation-chip citation-chip-gold">§ {s}</span>
                    ))}
                  </div>

                  {/* CTA */}
                  <Link
                    href={`/home?lang=${selectedLang}&persona=${card.persona}`}
                    className={`
                      mt-auto flex items-center justify-center gap-2
                      px-4 py-2.5 rounded-sm text-xs font-semibold uppercase tracking-[0.14em]
                      transition-all duration-500 hover:shadow-md hover:-translate-y-px
                      ${card.accentBg} text-white
                    `}
                  >
                    {labels.cta}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {/* NALSA helpline */}
        <div className="mt-12 flex items-center justify-center gap-2.5 text-sm text-secondary">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-60"/>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-error"/>
          </span>
          <span>NALSA Free Legal Aid Helpline:</span>
          <a href="tel:15100" className="font-semibold text-error hover:underline transition-colors">15100</a>
        </div>
      </div>
    </section>
  );
}
