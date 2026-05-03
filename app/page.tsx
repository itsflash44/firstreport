'use client';

import { useState } from 'react';
import LuxuryNav from '@/components/landing/LuxuryNav';
import HeroLanding from '@/components/landing/HeroLanding';
import PracticeAreas from '@/components/landing/PracticeAreas';
import HowItWorks from '@/components/landing/HowItWorks';
import AssessmentForm from '@/components/landing/AssessmentForm';
import TrustSignals from '@/components/landing/TrustSignals';
import LuxuryFooter from '@/components/landing/LuxuryFooter';
import type { LangCode } from '@/lib/i18n';

/**
 * FirstReport — Landing page.
 * Manages selectedLang state so LuxuryNav language selection updates
 * the page in-place (no navigation) and the CTAs carry the chosen language.
 */
export default function LandingPage() {
  const [selectedLang, setSelectedLang] = useState<LangCode>('hi-IN');

  return (
    <div className="min-h-screen bg-white">
      <LuxuryNav selectedLang={selectedLang} onLangChange={setSelectedLang} />
      <main>
        <HeroLanding selectedLang={selectedLang} />
        <PracticeAreas selectedLang={selectedLang} />
        <HowItWorks />
        <AssessmentForm />
        <TrustSignals />
      </main>
      <LuxuryFooter />
    </div>
  );
}
