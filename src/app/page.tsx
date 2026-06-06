'use client';

import { Suspense, useState, useEffect } from 'react';
import LuxuryNav from '@/components/landing/LuxuryNav';
import HeroLanding from '@/components/landing/HeroLanding';
import UserJourney from '@/components/landing/UserJourney';
import PracticeAreas from '@/components/landing/PracticeAreas';
import HowItWorks from '@/components/landing/HowItWorks';
import AssessmentForm from '@/components/landing/AssessmentForm';
import TrustSignals from '@/components/landing/TrustSignals';
import LuxuryFooter from '@/components/landing/LuxuryFooter';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import type { LangCode } from '@/lib/i18n';

function LandingContent() {
  const [selectedLang, setSelectedLang] = useState<LangCode>('hi-IN');

  // Read persisted preference once on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fr_lang') as LangCode | null;
      if (saved) setSelectedLang(saved);
    } catch { /* ignore */ }
  }, []);

  const handleLangChange = (lang: LangCode) => {
    setSelectedLang(lang);
    try { localStorage.setItem('fr_lang', lang); } catch { /* ignore */ }
  };

  // Wire IntersectionObserver — fires .revealed on every .scroll-reveal element
  useScrollReveal();

  return (
    <div className="min-h-screen bg-ivory">
      <LuxuryNav selectedLang={selectedLang} onLangChange={handleLangChange} />
      <main>
        <HeroLanding selectedLang={selectedLang} />
        <UserJourney selectedLang={selectedLang} />
        <PracticeAreas selectedLang={selectedLang} />
        <HowItWorks selectedLang={selectedLang} />
        <AssessmentForm selectedLang={selectedLang} />
        <TrustSignals selectedLang={selectedLang} />
      </main>
      <LuxuryFooter selectedLang={selectedLang} />
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ivory" />}>
      <LandingContent />
    </Suspense>
  );
}
