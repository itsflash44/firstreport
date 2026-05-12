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

const TRUST_STATS_LABELS: Partial<Record<LangCode, [string, string, string]>> = {
  'hi-IN': ['भारतीय भाषाएँ', 'विशेषज्ञ मोड', 'दस्तावेज़ प्रकार'],
  'en-IN': ['Indic Languages', 'Specialist Modes', 'Document Types'],
  'bn-IN': ['ভারতীয় ভাষা', 'বিশেষজ্ঞ মোড', 'নথির ধরন'],
  'ta-IN': ['இந்திய மொழிகள்', 'நிபுணர் பயன்முறைகள்', 'ஆவண வகைகள்'],
  'te-IN': ['భారతీయ భాషలు', 'నిపుణుల మోడ్‌లు', 'పత్ర రకాలు'],
  'mr-IN': ['भारतीय भाषा', 'तज्ञ मोड', 'कागदपत्र प्रकार'],
  'gu-IN': ['ભારતીય ભાષાઓ', 'નિષ્ણાત મોડ', 'દસ્તાવેજ પ્રકારો'],
  'kn-IN': ['ಭಾರತೀಯ ಭಾಷೆಗಳು', 'ತಜ್ಞ ಮೋಡ್‌ಗಳು', 'ದಾಖಲೆ ಪ್ರಕಾರಗಳು'],
  'ml-IN': ['ഇന്ത്യൻ ഭാഷകൾ', 'വിദഗ്ദ്ധ മോഡുകൾ', 'രേഖ തരങ്ങൾ'],
  'pa-IN': ['ਭਾਰਤੀ ਭਾਸ਼ਾਵਾਂ', 'ਮਾਹਿਰ ਮੋਡ', 'ਦਸਤਾਵੇਜ਼ ਕਿਸਮਾਂ'],
  'od-IN': ['ଭାରତୀୟ ଭାଷା', 'ବିଶେଷଜ୍ଞ ମୋଡ', 'ଦଲିଲ ପ୍ରକାର'],
};
const OPERATING_LABEL: Partial<Record<LangCode, string>> = {
  'hi-IN': 'संचालन ढांचा', 'en-IN': 'Operating Framework', 'bn-IN': 'পরিচালন কাঠামো',
  'ta-IN': 'இயக்கும் கட்டமைப்பு', 'te-IN': 'నిర్వహణ ఫ్రేమ్‌వర్క్', 'mr-IN': 'कार्यकारी चौकट',
  'gu-IN': 'ઓપરેટિંગ ફ્રેમવર્ક', 'kn-IN': 'ಕಾರ್ಯಾಚರಣೆ ಚೌಕಟ್ಟು', 'ml-IN': 'പ്രവർത്തന ചട്ടക്കൂട്',
  'pa-IN': 'ਸੰਚਾਲਨ ਢਾਂਚਾ', 'od-IN': 'ପରିଚାଳନା ଢାଞ୍ଚ',
};
const NALSA_CTA: Partial<Record<LangCode, string>> = {
  'hi-IN': 'NALSA मुफ्त कानूनी सहायता · 15100', 'en-IN': 'NALSA Free Legal Aid · 15100',
  'bn-IN': 'NALSA বিনামূল্যে আইনি সহায়তা · 15100', 'ta-IN': 'NALSA இலவச சட்ட உதவி · 15100',
  'te-IN': 'NALSA ఉచిత న్యాయ సహాయం · 15100', 'mr-IN': 'NALSA मोफत कायदेशीर मदत · 15100',
  'gu-IN': 'NALSA મફત કાનૂની સહાય · 15100', 'kn-IN': 'NALSA ಉಚಿತ ಕಾನೂನು ನೆರವು · 15100',
  'ml-IN': 'NALSA സൗജന്യ നിയമ സഹായം · 15100', 'pa-IN': 'NALSA ਮੁਫ਼ਤ ਕਾਨੂੰਨੀ ਮਦਦ · 15100',
  'od-IN': 'NALSA ମାଗଣା ଆଇନ ସହାୟତା · 15100',
};

export default function TrustSignals({ selectedLang = 'en-IN' }: TrustSignalsProps) {
  const copy        = SECTION_COPY[selectedLang]        ?? SECTION_COPY['en-IN']!;
  const statsLabels = TRUST_STATS_LABELS[selectedLang]  ?? TRUST_STATS_LABELS['en-IN']!;
  const opLabel     = OPERATING_LABEL[selectedLang]     ?? OPERATING_LABEL['en-IN']!;
  const nalsaCta    = NALSA_CTA[selectedLang]           ?? NALSA_CTA['en-IN']!;
  const speakText   = `${copy.title}${copy.em}`;
  const TRUST_STATS = [
    { fig: '11', label: statsLabels[0] },
    { fig: '5',  label: statsLabels[1] },
    { fig: '4',  label: statsLabels[2] },
  ];

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
          <span className="authority-strip mr-2">{opLabel}</span>
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
            {nalsaCta}
          </a>
        </div>
      </div>
    </section>
  );
}
