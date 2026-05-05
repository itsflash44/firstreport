'use client';

import SpeakerButton from '@/components/SpeakerButton';
import { type LangCode } from '@/lib/i18n';

const SECTION_COPY: Partial<Record<LangCode, { eyebrow: string; title: string; em: string }>> = {
  'en-IN': { eyebrow: 'In their own words',        title: 'Used by people the system ',              em: 'tried to refuse.' },
  'hi-IN': { eyebrow: 'उनके अपने शब्दों में',      title: 'उन लोगों ने इस्तेमाल किया जिन्हें ',     em: 'सिस्टम ने मना करने की कोशिश की।' },
  'bn-IN': { eyebrow: 'তাদের নিজের কথায়',          title: 'সেই মানুষরা ব্যবহার করেছেন যাদের ',      em: 'সিস্টেম প্রত্যাখ্যান করার চেষ্টা করেছিল।' },
  'ta-IN': { eyebrow: 'அவர்கள் சொந்த வார்த்தைகளில்', title: 'கணினி நிராகரிக்க முயன்றவர்கள் ',       em: 'பயன்படுத்தியது.' },
  'te-IN': { eyebrow: 'వారి స్వంత మాటల్లో',        title: 'వ్యవస్థ తిరస్కరించడానికి ప్రయత్నించిన వారు ', em: 'ఉపయోగించారు.' },
  'mr-IN': { eyebrow: 'त्यांच्या स्वतःच्या शब्दांत', title: 'जे लोक वापरतात ज्यांना ',               em: 'व्यवस्थेने नकार देण्याचा प्रयत्न केला.' },
  'gu-IN': { eyebrow: 'તેમના પોતાના શબ્દોમાં',      title: 'જે લોકોએ ઉપયોગ કર્યો જેમને ',            em: 'સિસ્ટમે ના પાડવાનો પ્રયત્ન કર્યો.' },
  'kn-IN': { eyebrow: 'ಅವರ ಸ್ವಂತ ಮಾತುಗಳಲ್ಲಿ',      title: 'ವ್ಯವಸ್ಥೆ ನಿರಾಕರಿಸಲು ಪ್ರಯತ್ನಿಸಿದ ಜನರು ',  em: 'ಬಳಸಿದ್ದಾರೆ.' },
  'ml-IN': { eyebrow: 'അവരുടെ സ്വന്തം വാക്കുകളിൽ',  title: 'സിസ്റ്റം നിരസിക്കാൻ ശ്രമിച്ച ആളുകൾ ',   em: 'ഉപയോഗിച്ചു.' },
  'pa-IN': { eyebrow: 'ਉਨ੍ਹਾਂ ਦੇ ਆਪਣੇ ਸ਼ਬਦਾਂ ਵਿੱਚ', title: 'ਉਨ੍ਹਾਂ ਲੋਕਾਂ ਦੁਆਰਾ ਵਰਤਿਆ ਗਿਆ ਜਿਨ੍ਹਾਂ ਨੂੰ ', em: 'ਸਿਸਟਮ ਨੇ ਮਨ੍ਹਾ ਕਰਨ ਦੀ ਕੋਸ਼ਿਸ਼ ਕੀਤੀ।' },
  'od-IN': { eyebrow: 'ସେମାନଙ୍କ ନିଜ ଶବ୍ଦରେ',       title: 'ଯେଉଁ ଲୋକମାନଙ୍କୁ ସିଷ୍ଟମ ପ୍ରତ୍ୟାଖ୍ୟାନ କରିବାକୁ ଚେଷ୍ଟା କଲା ', em: 'ସେମାନେ ବ୍ୟବହାର କଲେ।' },
};

interface TrustSignalsProps {
  selectedLang?: LangCode;
}

const TESTIMONIALS = [
  {
    quote: 'मैंने थाने में तीन बार जाकर FIR मांगी, हर बार लौटा दिया। इस ऐप ने हिंदी में सुना और SP को भेजने का पत्र बनाया। दूसरे दिन फ़ोन आया।',
    name: 'Sunita D.',
    locale: 'Ghaziabad, UP',
    lang: 'hi-IN',
    accentColor: '#5FA8A0',
  },
  {
    quote: 'My mother is 72. The Tribunal application under MWPSC §23 to revoke the gift deed was prepared in Marathi and explained out loud. We did not need a lawyer for the first hearing.',
    name: 'Advocate Rao',
    locale: 'Pune, MH',
    lang: 'en-IN',
    accentColor: '#B8962E',
  },
  {
    quote: 'कैगल के लिए ही नहीं, असली काम के लिए भी। मैंने अपनी छोटी बहन के POCSO केस में Childline 1098 वाला पत्र इसी से बनवाया।',
    name: 'Anonymous',
    locale: 'Bihar',
    lang: 'hi-IN',
    accentColor: '#D9534F',
  },
];

const COMPLIANCE = [
  'BNSS 2023',
  'BNS 2023',
  'POCSO 2012',
  'PWDVA 2005',
  'MWPSC 2007',
  'DPDP Act 2023',
  'NALSA Workflow',
];

const TRUST_STATS = [
  { fig: '11', label: 'Indic Languages' },
  { fig: '5',  label: 'Specialist Modes' },
  { fig: '4',  label: 'Document Types' },
];

export default function TrustSignals({ selectedLang = 'en-IN' }: TrustSignalsProps) {
  const copy = SECTION_COPY[selectedLang] ?? SECTION_COPY['en-IN']!;
  const speakText = `${copy.title}${copy.em}`;

  return (
    <section id="trust" className="py-20 sm:py-28 lg:py-36 bg-ivory">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Eyebrow + title */}
        <div className="max-w-3xl mb-16 scroll-reveal">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-10 h-px bg-teal/50" />
            <span className="section-label" lang={selectedLang}>{copy.eyebrow}</span>
          </div>
          <div className="flex items-start gap-4">
            <h2 lang={selectedLang} className="font-serif font-bold text-4xl sm:text-5xl lg:text-[3.25rem] text-navy-deep leading-[1.06] tracking-tight flex-1">
              {copy.title}
              <em className="not-italic text-teal">{copy.em}</em>
            </h2>
            <div className="mt-1 shrink-0">
              <SpeakerButton text={speakText} language={selectedLang} variant="inline" />
            </div>
          </div>
        </div>

        {/* Testimonial wall — 3-column */}
        <div className="grid md:grid-cols-3 gap-5 lg:gap-6 mb-16">
          {TESTIMONIALS.map((t, idx) => (
            <figure
              key={t.name}
              className="scroll-reveal court-order-card p-8 flex flex-col"
              style={{ transitionDelay: `${idx * 80}ms` }}
            >
              {/* Accent corner marker */}
              <span
                className="absolute top-0 right-0 w-8 h-8"
                style={{
                  background: t.accentColor,
                  clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
                }}
              />

              {/* Big serif quote mark */}
              <span className="font-serif text-7xl leading-none mb-1" style={{ color: `${t.accentColor}40` }}>"</span>

              <blockquote
                lang={t.lang}
                className="font-serif italic text-base text-navy-deep leading-relaxed flex-1"
              >
                {t.quote}
              </blockquote>

              <hr className="hairline my-6" />

              <figcaption className="flex items-end justify-between gap-3">
                <div>
                  <div className="font-semibold text-sm text-navy-deep">{t.name}</div>
                  <div className="authority-strip mt-1">{t.locale}</div>
                </div>
                <SpeakerButton
                  text={t.quote}
                  language={t.lang as LangCode}
                  variant="mini"
                />
              </figcaption>
            </figure>
          ))}
        </div>

        {/* Trust stats */}
        <div className="grid grid-cols-3 gap-6 mb-16 scroll-reveal">
          {TRUST_STATS.map((s) => (
            <div key={s.fig} className="text-center">
              <div className="stat-counter text-5xl sm:text-6xl font-bold leading-none mb-1"
                   style={{ color: '#B8962E' }}>{s.fig}</div>
              <div className="text-xs sm:text-sm text-secondary font-medium mt-2">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Compliance strip */}
        <div
          className="scroll-reveal border-t border-b border-cool-gray py-6
                     flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
        >
          <span className="authority-strip mr-2">Operating Framework</span>
          <span className="w-px h-4 bg-cool-gray" />
          {COMPLIANCE.map((c) => (
            <span key={c} className="citation-chip citation-chip-gold">§ {c}</span>
          ))}
        </div>

        {/* NALSA strip */}
        <div className="mt-10 flex items-center justify-center gap-3 scroll-reveal">
          <a
            href="tel:15100"
            className="inline-flex items-center gap-2.5 px-6 py-3 border border-error/30
                       rounded-sm text-sm font-semibold text-error hover:bg-error/5
                       transition-all duration-500"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-60"/>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-error"/>
            </span>
            NALSA Free Legal Aid · 15100
          </a>
        </div>
      </div>
    </section>
  );
}
