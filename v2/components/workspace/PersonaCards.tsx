'use client';

import type { PersonaId, LangCode } from '../../types/index';
import { t } from '../../types/i18n';

interface PersonaCardsProps {
  selected: PersonaId | null;
  onSelect: (id: PersonaId) => void;
  language: LangCode;
}

interface PersonaDef {
  id: PersonaId;
  labelKey: string;
  icon: string;
  color: string;
}

const PERSONAS: PersonaDef[] = [
  { id: 'standard', labelKey: 'persona_standard', icon: '📋', color: 'border-teal' },
  { id: 'women_dv', labelKey: 'persona_women', icon: '🛡️', color: 'border-purple-400' },
  { id: 'pocso', labelKey: 'persona_pocso', icon: '🧒', color: 'border-orange-400' },
  { id: 'senior', labelKey: 'persona_senior', icon: '🙏', color: 'border-blue-400' },
  { id: 'advisor', labelKey: 'persona_advisor', icon: '⚖️', color: 'border-navy' },
];

const PERSONA_LABELS: Record<PersonaId, Record<LangCode, string>> = {
  standard: {
    'hi-IN': 'सामान्य शिकायत', 'en-IN': 'General Complaint', 'bn-IN': 'সাধারণ অভিযোগ',
    'ta-IN': 'பொது புகார்', 'te-IN': 'సాధారణ ఫిర్యాదు', 'mr-IN': 'सामान्य तक्रार',
    'gu-IN': 'સામાન્ય ફરિયાદ', 'kn-IN': 'ಸಾಮಾನ್ಯ ದೂರು', 'ml-IN': 'പൊതു പരാതി',
    'pa-IN': 'ਆਮ ਸ਼ਿਕਾਇਤ', 'od-IN': 'ସାଧାରଣ ଅଭିଯୋଗ',
  },
  women_dv: {
    'hi-IN': 'महिला / घरेलू हिंसा', 'en-IN': 'Women / Domestic Violence', 'bn-IN': 'মহিলা / গার্হস্থ্য হিংসা',
    'ta-IN': 'பெண்கள் / குடும்ப வன்முறை', 'te-IN': 'మహిళలు / గృహ హింస', 'mr-IN': 'महिला / घरगुती हिंसा',
    'gu-IN': 'મહિલા / ઘરેલુ હિંસા', 'kn-IN': 'ಮಹಿಳೆ / ಗೃಹ ಹಿಂಸೆ', 'ml-IN': 'സ്ത്രീ / ഗാർഹിക പീഡനം',
    'pa-IN': 'ਔਰਤ / ਘਰੇਲੂ ਹਿੰਸਾ', 'od-IN': 'ମହିଳା / ଗୃହ ହିଂସା',
  },
  pocso: {
    'hi-IN': 'बच्चों की सुरक्षा (POCSO)', 'en-IN': 'Child Safety (POCSO)', 'bn-IN': 'শিশু সুরক্ষা (POCSO)',
    'ta-IN': 'குழந்தை பாதுகாப்பு (POCSO)', 'te-IN': 'బాలల భద్రత (POCSO)', 'mr-IN': 'बालसंरक्षण (POCSO)',
    'gu-IN': 'બાળ સુરક્ષા (POCSO)', 'kn-IN': 'ಮಕ್ಕಳ ಸುರಕ್ಷತೆ (POCSO)', 'ml-IN': 'ശിശു സുരക്ഷ (POCSO)',
    'pa-IN': 'ਬੱਚਿਆਂ ਦੀ ਸੁਰੱਖਿਆ (POCSO)', 'od-IN': 'ଶିଶୁ ସୁରକ୍ଷା (POCSO)',
  },
  senior: {
    'hi-IN': 'वरिष्ठ नागरिक', 'en-IN': 'Senior Citizen', 'bn-IN': 'প্রবীণ নাগরিক',
    'ta-IN': 'மூத்த குடிமக்கள்', 'te-IN': 'సీనియర్ సిటిజన్', 'mr-IN': 'ज्येष्ठ नागरिक',
    'gu-IN': 'વરિષ્ઠ નાગરિક', 'kn-IN': 'ಹಿರಿಯ ನಾಗರಿಕ', 'ml-IN': 'മുതിർന്ന പൗരൻ',
    'pa-IN': 'ਸੀਨੀਅਰ ਸਿਟੀਜ਼ਨ', 'od-IN': 'ବରିଷ୍ଠ ନାଗରିକ',
  },
  advisor: {
    'hi-IN': 'कानूनी सलाहकार', 'en-IN': 'Legal Advisor', 'bn-IN': 'আইন উপদেষ্টা',
    'ta-IN': 'சட்ட ஆலோசகர்', 'te-IN': 'న్యాయ సలహాదారు', 'mr-IN': 'कायदेशीर सल्लागार',
    'gu-IN': 'કાનૂની સલાહકાર', 'kn-IN': 'ಕಾನೂನು ಸಲಹೆಗಾರ', 'ml-IN': 'നിയമോപദേശകൻ',
    'pa-IN': 'ਕਾਨੂੰਨੀ ਸਲਾਹਕਾਰ', 'od-IN': 'ଆଇନ ଉପଦେଷ୍ଟା',
  },
};

function personaLabel(id: PersonaId, lang: LangCode): string {
  return PERSONA_LABELS[id]?.[lang] ?? PERSONA_LABELS[id]?.['en-IN'] ?? id;
}

export function PersonaCards({ selected, onSelect, language }: PersonaCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {PERSONAS.map((p) => {
        const isActive = selected === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            aria-pressed={isActive}
            className={`
              flex items-center gap-3 p-4 rounded-xl
              border-2 transition-all duration-150 text-left
              focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2
              active:scale-[0.98]
              ${isActive
                ? `${p.color} bg-teal/5 shadow-sm`
                : 'border-cool-gray bg-white hover:border-teal/40'}
            `}
          >
            <span className="text-2xl shrink-0" role="img" aria-hidden="true">{p.icon}</span>
            <span className="text-sm font-medium text-navy leading-snug">
              {personaLabel(p.id, language)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
