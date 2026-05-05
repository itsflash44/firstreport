'use client';

import { useState } from 'react';
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

export default function LandingPage() {
  const [selectedLang, setSelectedLang] = useState<LangCode>('hi-IN');

  // Wire IntersectionObserver — fires .revealed on every .scroll-reveal element
  useScrollReveal();

  return (
    <div className="min-h-screen bg-ivory">
      <LuxuryNav selectedLang={selectedLang} onLangChange={setSelectedLang} />
      <main>
        <HeroLanding selectedLang={selectedLang} />
        <UserJourney selectedLang={selectedLang} />
        <PracticeAreas selectedLang={selectedLang} />
        <HowItWorks selectedLang={selectedLang} />
        <AssessmentForm selectedLang={selectedLang} />
        <TrustSignals selectedLang={selectedLang} />
      </main>
      <LuxuryFooter />
    </div>
  );
}
