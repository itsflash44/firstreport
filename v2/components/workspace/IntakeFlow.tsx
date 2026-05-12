'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '../../stores/app-store';
import { useSessionStore } from '../../stores/session-store';
import { t } from '../../types/i18n';
import { LanguageGrid } from './LanguageGrid';
import { PersonaCards } from './PersonaCards';
import { UrgencySelector } from './UrgencySelector';
import type { LangCode, PersonaId, Urgency } from '../../types/index';

type Step = 'language' | 'persona' | 'urgency';

export function IntakeFlow() {
  const router = useRouter();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);

  const [step, setStep] = useState<Step>('language');
  const [selectedLang, setSelectedLang] = useState<LangCode | null>(language);
  const [selectedPersona, setSelectedPersona] = useState<PersonaId | null>(null);
  const [selectedUrgency, setSelectedUrgency] = useState<Urgency | null>(null);

  const activeLang = selectedLang ?? language;

  const handleLangSelect = useCallback((code: LangCode) => {
    setSelectedLang(code);
    setLanguage(code);
    setStep('persona');
  }, [setLanguage]);

  const handlePersonaSelect = useCallback((id: PersonaId) => {
    setSelectedPersona(id);
    setStep('urgency');
  }, []);

  const handleUrgencySelect = useCallback((urgency: Urgency) => {
    setSelectedUrgency(urgency);
  }, []);

  const handleStart = useCallback(() => {
    if (!selectedLang || !selectedPersona || !selectedUrgency) return;

    useSessionStore.getState().createSession(selectedLang, selectedPersona, selectedUrgency);
    router.push('/v2/chat');
  }, [selectedLang, selectedPersona, selectedUrgency, router]);

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-navy">
          {t('selectLanguage', activeLang)}
        </h1>
      </div>

      <LanguageGrid selected={selectedLang} onSelect={handleLangSelect} />

      {(step === 'persona' || step === 'urgency') && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <h2 className="text-lg font-semibold text-navy">
            {t('selectMode', activeLang)}
          </h2>
          <PersonaCards
            selected={selectedPersona}
            onSelect={handlePersonaSelect}
            language={activeLang}
          />
        </div>
      )}

      {step === 'urgency' && selectedPersona && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <UrgencySelector
            selected={selectedUrgency}
            onSelect={handleUrgencySelect}
            language={activeLang}
          />

          {selectedUrgency && (
            <button
              onClick={handleStart}
              className="
                w-full py-3.5 rounded-xl bg-teal text-white font-semibold text-base
                transition-all duration-150 shadow-sm
                hover:bg-teal/90 active:scale-[0.98]
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal
              "
            >
              {t('start', activeLang)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
