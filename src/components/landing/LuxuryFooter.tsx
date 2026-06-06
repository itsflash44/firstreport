'use client';

import Link from 'next/link';
import FirstReportLogo from '@/components/FirstReportLogo';
import { type LangCode } from '@/lib/i18n';

interface LuxuryFooterProps {
  selectedLang?: LangCode;
}

const FOOTER_COPY: Partial<Record<LangCode, {
  brand: string;
  practice: string;
  helplines: string;
  legal: string;
  copyright: string;
}>> = {
  'en-IN': {
    brand: 'Voice-first legal aid. Built on Gemma 4 + Sarvam AI. Available in 11 Indic languages. Fully offline capable.',
    practice: 'Practice', helplines: 'Helplines', legal: 'Legal',
    copyright: '© 2026 FirstReport · Bharatiya Legal Aid Project · Kaggle Gemma 2026',
  },
  'hi-IN': {
    brand: 'आवाज़ आधारित कानूनी सहायता। Gemma 4 + Sarvam AI पर बना। 11 भारतीय भाषाओं में उपलब्ध। पूरी तरह ऑफ़लाइन सक्षम।',
    practice: 'अभ्यास क्षेत्र', helplines: 'हेल्पलाइन', legal: 'कानूनी',
    copyright: '© 2026 फ़र्स्टरिपोर्ट · भारतीय कानूनी सहायता परियोजना · Kaggle Gemma 2026',
  },
  'bn-IN': {
    brand: 'ভয়েস-ফার্স্ট আইনি সহায়তা। Gemma 4 + Sarvam AI-এ নির্মিত। ১১টি ভারতীয় ভাষায় উপলব্ধ।',
    practice: 'অনুশীলন', helplines: 'হেল্পলাইন', legal: 'আইনি',
    copyright: '© 2026 ফার্স্টরিপোর্ট · ভারতীয় আইনি সহায়তা প্রকল্প',
  },
  'ta-IN': {
    brand: 'குரல் முதல் சட்ட உதவி. Gemma 4 + Sarvam AI இல் கட்டப்பட்டது. 11 இந்திய மொழிகளில்.',
    practice: 'பயிற்சி', helplines: 'உதவி எண்கள்', legal: 'சட்டம்',
    copyright: '© 2026 FirstReport · இந்திய சட்ட உதவி திட்டம்',
  },
  'te-IN': {
    brand: 'వాయిస్ ఆధారిత న్యాయ సహాయం. Gemma 4 + Sarvam AI. 11 భారతీయ భాషల్లో.',
    practice: 'ప్రాక్టీస్', helplines: 'హెల్ప్‌లైన్లు', legal: 'న్యాయ',
    copyright: '© 2026 FirstReport · భారతీయ న్యాయ సహాయ ప్రాజెక్ట్',
  },
  'mr-IN': {
    brand: 'व्हॉइस-फर्स्ट कायदेशीर मदत. Gemma 4 + Sarvam AI वर बनवले. ११ भारतीय भाषांमध्ये.',
    practice: 'सराव', helplines: 'हेल्पलाइन', legal: 'कायदेशीर',
    copyright: '© 2026 फर्स्टरिपोर्ट · भारतीय कायदेशीर मदत प्रकल्प',
  },
  'gu-IN': {
    brand: 'વૉઇસ-ફર્સ્ટ કાનૂની સહાય. Gemma 4 + Sarvam AI. 11 ભારતીય ભાષાઓમાં.',
    practice: 'પ્રેક્ટિસ', helplines: 'હેલ્પલાઇન', legal: 'કાનૂની',
    copyright: '© 2026 ફર્સ્ટરિપોર્ટ · ભારતીય કાનૂની સહાય પ્રોજેક્ટ',
  },
  'kn-IN': {
    brand: 'ವಾಯ್ಸ್-ಫರ್ಸ್ಟ್ ಕಾನೂನು ಸಹಾಯ. Gemma 4 + Sarvam AI. 11 ಭಾರತೀಯ ಭಾಷೆಗಳಲ್ಲಿ.',
    practice: 'ಅಭ್ಯಾಸ', helplines: 'ಸಹಾಯವಾಣಿ', legal: 'ಕಾನೂನು',
    copyright: '© 2026 FirstReport · ಭಾರತೀಯ ಕಾನೂನು ಸಹಾಯ ಯೋಜನೆ',
  },
  'ml-IN': {
    brand: 'വോയ്‌സ്-ഫസ്റ്റ് നിയമ സഹായം. Gemma 4 + Sarvam AI. 11 ഇന്ത്യൻ ഭാഷകളിൽ.',
    practice: 'പ്രാക്ടീസ്', helplines: 'ഹെൽപ്പ്‌ലൈനുകൾ', legal: 'നിയമ',
    copyright: '© 2026 FirstReport · ഇന്ത്യൻ നിയമ സഹായ പദ്ധതി',
  },
  'pa-IN': {
    brand: 'ਵੌਇਸ-ਫਰਸਟ ਕਾਨੂੰਨੀ ਸਹਾਇਤਾ। Gemma 4 + Sarvam AI। 11 ਭਾਰਤੀ ਭਾਸ਼ਾਵਾਂ ਵਿੱਚ.',
    practice: 'ਪ੍ਰੈਕਟਿਸ', helplines: 'ਹੈਲਪਲਾਈਨ', legal: 'ਕਾਨੂੰਨੀ',
    copyright: '© 2026 ਫਰਸਟਰਿਪੋਰਟ · ਭਾਰਤੀ ਕਾਨੂੰਨੀ ਸਹਾਇਤਾ ਪ੍ਰੋਜੈਕਟ',
  },
  'od-IN': {
    brand: 'ଭଏସ-ଫର୍ଷ୍ଟ ଆଇନ ସହାୟତା। Gemma 4 + Sarvam AI। 11ଟି ଭାରତୀୟ ଭାଷାରେ।',
    practice: 'ଅଭ୍ୟାସ', helplines: 'ହେଲ୍ପଲାଇନ', legal: 'ଆଇନ',
    copyright: '© 2026 ଫର୍ଷ୍ଟରିପୋର୍ଟ · ଭାରତୀୟ ଆଇନ ସହାୟତା ପ୍ରକଳ୍ପ',
  },
};

const LANG_CHIP: Partial<Record<LangCode, string>> = {
  'en-IN': '11 Languages', 'hi-IN': '11 भाषाएँ', 'bn-IN': '১১ ভাষা', 'ta-IN': '11 மொழிகள்',
  'te-IN': '11 భాషలు', 'mr-IN': '११ भाषा', 'gu-IN': '11 ભાષા', 'kn-IN': '11 ಭಾಷೆ',
  'ml-IN': '11 ഭാഷ', 'pa-IN': '11 ਭਾਸ਼ਾ', 'od-IN': '11 ଭାଷା',
};

export default function LuxuryFooter({ selectedLang = 'en-IN' }: LuxuryFooterProps) {
  const copy = FOOTER_COPY[selectedLang] ?? FOOTER_COPY['en-IN']!;
  const langChip = LANG_CHIP[selectedLang] ?? LANG_CHIP['en-IN']!;

  return (
    <footer
      style={{ background: 'linear-gradient(180deg, #0F1F3D 0%, #0A1628 100%)' }}
      className="text-white"
    >
      {/* Gold top rule */}
      <div className="h-[3px]"
           style={{ background: 'linear-gradient(90deg, transparent, #B8962E 30%, #5FA8A0 70%, transparent)' }} />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 sm:py-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand block */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FirstReportLogo size={36} variant="wordmark" theme="light" />
            </div>
            <p className="text-sm text-white/60 leading-relaxed mb-5" lang={selectedLang}>
              {copy.brand}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="citation-chip citation-chip-dark">BNSS 2023</span>
              <span className="citation-chip citation-chip-dark" lang={selectedLang}>{langChip}</span>
            </div>
          </div>

          {/* Practice */}
          <div>
            <div className="authority-strip mb-5" lang={selectedLang}>{copy.practice}</div>
            <ul className="space-y-2.5">
              {[
                'BNSS 2023 escalation',
                'POCSO 2012 (children)',
                'PWDVA 2005 (women)',
                'MWPSC 2007 (seniors)',
                'Legal advisor triage',
              ].map((item) => (
                <li key={item} className="text-sm text-white/60 hover:text-white/90 transition-colors duration-300 cursor-default">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Helplines */}
          <div>
            <div className="authority-strip mb-5" lang={selectedLang}>{copy.helplines}</div>
            <ul className="space-y-2.5">
              {[
                { label: 'NALSA · 15100',    href: 'tel:15100' },
                { label: 'Childline · 1098', href: 'tel:1098'  },
                { label: 'Sakhi · 181',      href: 'tel:181'   },
                { label: 'Elder Line · 14567', href: 'tel:14567' },
                { label: 'Police · 112',     href: 'tel:112'   },
              ].map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-sm text-white/60 hover:text-teal transition-colors duration-300"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <div className="authority-strip mb-5" lang={selectedLang}>{copy.legal}</div>
            <ul className="space-y-2.5">
              {[
                { label: 'Privacy · DPDP 2023', href: '#' },
                { label: 'Terms of Use',         href: '#' },
                { label: 'AI Disclosure',        href: '#' },
                { label: 'Open Source',          href: '#' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/60 hover:text-white/90 transition-colors duration-300"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Gold hairline */}
        <div className="legal-rule my-10" />

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="authority-strip" lang={selectedLang}>
            {copy.copyright}
          </div>
          <div className="flex items-center gap-3">
            <a
              href="tel:15100"
              className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em]
                         text-white/50 hover:text-error transition-colors duration-300"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-60"/>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-error"/>
              </span>
              NALSA · 15100
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
