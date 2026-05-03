'use client';

import Link from 'next/link';
import AgentAvatar from '@/components/AgentAvatar';
import SpeakerButton from '@/components/SpeakerButton';
import { PERSONAS } from '@/lib/personas';
import { type LangCode } from '@/lib/i18n';

const HERO_TEXT: Record<LangCode, { headline: string; lede: string }> = {
  'hi-IN': {
    headline: 'जब पुलिस न सुने, हम सुनेंगे।',
    lede: 'फ़र्स्टरिपोर्ट एक आवाज़ी कानूनी सहायता है। अपनी भाषा में बोलें, जो हुआ बताएं, और कानून के तहत सही शिकायत दस्तावेज़ पाएं।',
  },
  'en-IN': {
    headline: 'When the police won\'t listen, we will.',
    lede: 'FirstReport is a voice-first legal aid tool for India. Speak in your language, describe what happened, and get the exact document the law gives you the right to file.',
  },
  'bn-IN': {
    headline: 'যখন পুলিশ শুনবে না, আমরা শুনব।',
    lede: 'ফার্স্টরিপোর্ট ভারতের জন্য একটি ভয়েস-ফার্স্ট আইনি সহায়তা। আপনার ভাষায় কথা বলুন এবং সঠিক নথি পান।',
  },
  'ta-IN': {
    headline: 'போலீஸ் கேட்காதபோது, நாங்கள் கேட்போம்.',
    lede: 'FirstReport இந்தியாவிற்கான குரல் சட்ட உதவி கருவி. உங்கள் மொழியில் பேசி சரியான ஆவணம் பெறுங்கள்.',
  },
  'te-IN': {
    headline: 'పోలీసులు వినకపోతే, మేము వింటాం.',
    lede: 'FirstReport భారతదేశం కోసం వాయిస్ లీగల్ ఎయిడ్. మీ భాషలో మాట్లాడి సరైన పత్రం పొందండి.',
  },
  'mr-IN': {
    headline: 'पोलीस न ऐकल्यास, आम्ही ऐकतो.',
    lede: 'फर्स्टरिपोर्ट भारतासाठी व्हॉइस लीगल एड आहे. तुमच्या भाषेत बोला आणि योग्य कागदपत्र मिळवा.',
  },
  'gu-IN': {
    headline: 'પોલીસ ન સાંભળે ત્યારે, અમે સાંભળીએ છીએ.',
    lede: 'ફર્સ્ટરિપોર્ટ ભારત માટે વૉઇસ કાનૂની સહાય છે. તમારી ભાષામાં બોલો અને સાચો દસ્તાવેજ મેળવો.',
  },
  'kn-IN': {
    headline: 'ಪೊಲೀಸರು ಕೇಳದಿದ್ದಾಗ, ನಾವು ಕೇಳುತ್ತೇವೆ.',
    lede: 'FirstReport ಭಾರತಕ್ಕಾಗಿ ವಾಯ್ಸ್ ಕಾನೂನು ಸಹಾಯ. ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಮಾತನಾಡಿ ಸರಿಯಾದ ದಾಖಲೆ ಪಡೆಯಿರಿ.',
  },
  'ml-IN': {
    headline: 'പോലീസ് കേൾക്കാത്തപ്പോൾ, ഞങ്ങൾ കേൾക്കും.',
    lede: 'FirstReport ഇന്ത്യക്കായുള്ള വോയ്‌സ് നിയമ സഹായമാണ്. നിങ്ങളുടെ ഭാഷയിൽ സംസാരിച്ച് ശരിയായ രേഖ നേടുക.',
  },
  'pa-IN': {
    headline: 'ਜਦੋਂ ਪੁਲਿਸ ਨਾ ਸੁਣੇ, ਅਸੀਂ ਸੁਣਾਂਗੇ।',
    lede: 'ਫਰਸਟਰਿਪੋਰਟ ਭਾਰਤ ਲਈ ਵੌਇਸ ਕਾਨੂੰਨੀ ਸਹਾਇਤਾ ਹੈ। ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਬੋਲੋ ਅਤੇ ਸਹੀ ਦਸਤਾਵੇਜ਼ ਪ੍ਰਾਪਤ ਕਰੋ।',
  },
  'od-IN': {
    headline: 'ପୋଲିସ ଯଦି ନ ଶୁଣନ୍ତି, ଆମ୍ଭେ ଶୁଣିବୁ।',
    lede: 'ଫ‌ର‌୍ଷ‌ଟ‌ ରି‌ପ‌ୋ‌ର‌୍ଟ ଭ‌ାର‌ତ ପ‌ାଇ‌ଁ ଭ‌ଏ‌ସ ‌ ଆ‌ଇ‌ନ‌ ‌ ସ‌ହ‌ା‌ଯ‌ ‌ ।',
  },
};

interface HeroLandingProps {
  selectedLang: LangCode;
}

export default function HeroLanding({ selectedLang }: HeroLandingProps) {
  const heroPersona = PERSONAS.find((p) => p.id === 'standard') ?? PERSONAS[0];
  const copy = HERO_TEXT[selectedLang] ?? HERO_TEXT['en-IN'];
  const speakText = `${copy.headline} ${copy.lede}`;

  return (
    <section className="relative bg-white" id="hero">
      {/* Subtle left accent line */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-teal/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 sm:pt-24 lg:pt-32 pb-16 sm:pb-24">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-start">

          {/* LEFT — editorial copy */}
          <div className="lg:col-span-7 space-y-8">
            {/* Eyebrow */}
            <div className="flex items-center gap-3">
              <span className="w-10 h-px bg-teal" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-secondary">
                Established 2026 · Bharatiya Nagarik Suraksha Sanhita
              </span>
            </div>

            {/* Headline + inline speaker button */}
            <div className="flex items-start gap-4">
              <h1
                lang={selectedLang}
                className="font-serif font-bold text-navy leading-[1.05] tracking-tight text-[2.6rem] sm:text-6xl lg:text-[5rem] flex-1"
              >
                {copy.headline}
              </h1>
              <div className="mt-2 shrink-0">
                <SpeakerButton
                  text={speakText}
                  language={selectedLang}
                  variant="inline"
                />
              </div>
            </div>

            {/* Lede */}
            <p
              lang={selectedLang}
              className="max-w-xl text-lg sm:text-xl font-medium text-secondary leading-relaxed"
            >
              {copy.lede}
            </p>

            {/* CTA cluster */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-3">
              <Link
                href={`/home?lang=${selectedLang}`}
                className="inline-flex items-center justify-center px-7 py-4 bg-navy text-white rounded-sm
                           text-sm font-semibold uppercase tracking-[0.16em]
                           hover:bg-navy/90 active:scale-[0.98] transition-all"
              >
                Speak in Your Language →
              </Link>
              <a
                href="#practice"
                className="inline-flex items-center justify-center px-7 py-4 bg-white text-navy rounded-sm
                           text-sm font-semibold uppercase tracking-[0.16em]
                           border border-cool-gray hover:border-navy transition-all"
              >
                See Practice Areas
              </a>
            </div>

            {/* Statute strip */}
            <div className="pt-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-secondary/70 mb-2">
                Operates under
              </div>
              <div className="flex flex-wrap gap-2">
                {['BNSS 2023', 'BNS 2023', 'POCSO 2012', 'PWDVA 2005', 'MWPSC 2007', 'DPDP 2023'].map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]
                               bg-off-white border border-cool-gray text-navy rounded-sm"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — stats card + agent */}
          <aside className="lg:col-span-5">
            <div className="relative bg-white border border-cool-gray rounded-md shadow-sm p-7 sm:p-8">
              {/* Teal accent top bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-teal rounded-t-md" />

              <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-secondary mb-6 mt-2">
                The FirstReport Practice
              </div>

              {/* Stats */}
              <ul className="space-y-5">
                {[
                  { fig: '11', cap: 'Indic Languages', sub: 'Sarvam STT + TTS' },
                  { fig: '5',  cap: 'Specialist Modes', sub: 'POCSO · PWDVA · MWPSC · Standard · Advisor' },
                  { fig: '100%', cap: 'Offline Capable', sub: 'Works on Galaxy A03, Jio 4G' },
                ].map((s, i, arr) => (
                  <li key={s.fig}>
                    <div className="flex items-baseline gap-4">
                      <span className="font-serif text-5xl sm:text-6xl text-teal leading-none font-bold">
                        {s.fig}
                      </span>
                      <div>
                        <div className="font-semibold text-base text-navy">{s.cap}</div>
                        <div className="text-xs font-medium text-secondary mt-0.5">{s.sub}</div>
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="mt-5 h-px bg-cool-gray" />
                    )}
                  </li>
                ))}
              </ul>

              {/* Agent peek */}
              <div className="mt-7 pt-7 border-t border-cool-gray flex items-end gap-4">
                <AgentAvatar persona={heroPersona} compact />
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-secondary">
                    Your Counsel
                  </div>
                  <div className="font-serif text-lg text-teal font-semibold">Already on the line.</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="h-px bg-cool-gray" />
      </div>
    </section>
  );
}
