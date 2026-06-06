/**
 * FirstReport — Persona Specifications
 *
 * Each persona is a complete legal-aid mode with:
 *   - Tone & vocabulary constraints for Gemma 4
 *   - Statute references the AI is allowed to cite
 *   - Severity router (decides: handle in-app vs. escalate to real lawyer)
 *   - Bauhaus visual identity (color + geometric shape)
 *   - Local & national resources
 */

import type { PersonaId, LangCode } from './i18n';

export type Severity = 'normal' | 'serious' | 'critical';

export interface SeverityVerdict {
  level: Severity;
  rationale: string;
  action:
    | 'continue_in_app'
    | 'recommend_lawyer'
    | 'escalate_lawyer_now'
    | 'sos_now';
  resources: string[];
}

export interface PersonaSpec {
  id: PersonaId;
  /** Bauhaus visual identity */
  color: 'red' | 'blue' | 'yellow';
  shape: 'circle' | 'square' | 'triangle';
  /** Native-script title and subtitle (Hindi primary, English secondary) */
  titleHi: string;
  titleEn: string;
  subHi: string;
  subEn: string;
  /** When to show this mode to the user */
  whoIsThisFor: { hi: string; en: string };
  /** Statutes the AI may cite in this mode */
  statutes: string[];
  /** System prompt fragment fed to Gemma 4 */
  systemPrompt: string;
  /** Patterns in the user's narrative that escalate severity */
  criticalKeywords: string[];
  seriousKeywords: string[];
  /** Resources to surface when user matches this persona */
  resources: { label: string; phone?: string; url?: string }[];
}

export const PERSONAS: PersonaSpec[] = [
  {
    id: 'standard',
    color: 'blue',
    shape: 'square',
    titleHi: 'सामान्य',
    titleEn: 'Standard',
    subHi: 'किसी भी घटना की रिपोर्ट',
    subEn: 'General incident report',
    whoIsThisFor: {
      hi: 'चोरी, धोखाधड़ी, मारपीट, संपत्ति विवाद — कोई भी सामान्य मामला',
      en: 'Theft, fraud, assault, property dispute — any general matter',
    },
    statutes: ['BNSS 2023', 'BNS 2023', 'BSA 2023'],
    systemPrompt:
      'You are a calm, neutral legal assistant. Reference Bharatiya Nagarik Suraksha Sanhita 2023 (BNSS) — never CrPC. Use formal Hindi/English. Identify the BNSS chapter, recommend the right authority (SHO → SP → DM → HC writ), and prepare an escalation document.',
    criticalKeywords: ['weapon', 'gun', 'knife', 'हथियार', 'चाकू', 'बंदूक', 'death', 'मौत'],
    seriousKeywords: ['assault', 'मारपीट', 'fraud', 'धोखा', 'theft', 'चोरी'],
    resources: [
      { label: 'NALSA Helpline', phone: '15100' },
      { label: 'Police', phone: '112' },
    ],
  },
  {
    id: 'pocso',
    color: 'yellow',
    shape: 'triangle',
    titleHi: 'बच्चों के लिए',
    titleEn: 'POCSO (Child)',
    subHi: 'बच्चों के साथ हुई किसी भी घटना के लिए — सुरक्षित बातचीत',
    subEn: 'For incidents involving minors — child-safe interview mode',
    whoIsThisFor: {
      hi: '18 साल से कम उम्र के बच्चे, या उनके माता-पिता / अभिभावक',
      en: 'Children under 18, or their parent / guardian',
    },
    statutes: ['POCSO Act 2012', 'JJ Act 2015', 'BNSS 2023', 'BNS 2023'],
    systemPrompt:
      'You are a child-protection specialist. Use simple, gentle, age-appropriate language. NEVER use graphic terms. Reference POCSO Act 2012 sections (3, 5, 7, 9, 11). Mandatory reporter duties under Section 19. The Special Court route under Section 28. Recommend Childline 1098 immediately. Auto-escalate to "critical" the moment any contact offence is described.',
    criticalKeywords: [
      'touched', 'inappropriate', 'naked', 'photo',
      'छुआ', 'गलत', 'फोटो', 'अकेले',
      'photograph', 'video', 'private parts',
    ],
    seriousKeywords: ['scared', 'डर', 'teacher', 'शिक्षक', 'uncle', 'चाचा'],
    resources: [
      { label: 'Childline', phone: '1098' },
      { label: 'POCSO eBox', url: 'https://pocso.ncpcr.gov.in' },
      { label: 'NCPCR', phone: '+911123478250' },
    ],
  },
  {
    id: 'women_dv',
    color: 'red',
    shape: 'circle',
    titleHi: 'महिला सुरक्षा',
    titleEn: 'Women / DV',
    subHi: 'घरेलू हिंसा, दहेज़ उत्पीड़न, यौन उत्पीड़न',
    subEn: 'Domestic violence, dowry harassment, sexual offences',
    whoIsThisFor: {
      hi: 'घरेलू हिंसा या उत्पीड़न झेल रही कोई भी महिला',
      en: 'Any woman experiencing domestic violence or harassment',
    },
    statutes: [
      'BNSS 2023',
      'BNS 2023 (Sec 85, 86)',  // cruelty by husband / relatives
      'PWDVA 2005',
      'Dowry Prohibition Act 1961',
      'POSH Act 2013',
    ],
    systemPrompt:
      'You are a trauma-informed women-rights advisor. Tone: warm, patient, never judgmental. Cite BNS Section 85 (cruelty), PWDVA 2005 (Protection Order, Residence Order), Dowry Prohibition Act. Recommend the One Stop Centre + Protection Officer route. If sexual assault is described, immediately classify as critical and surface Section 354/376 BNS routing + Section 173(1) BNSS Zero FIR rights. Always offer Sakhi 181 + NCW number.',
    criticalKeywords: [
      'rape', 'molested', 'forced', 'beat',
      'बलात्कार', 'जबरदस्ती', 'मारा',
      'acid', 'kerosene', 'मिट्टी का तेल',
    ],
    seriousKeywords: [
      'dowry', 'दहेज़', 'in-laws', 'सास', 'ससुर',
      'taunt', 'ताने', 'kicked out', 'घर से निकाल',
    ],
    resources: [
      { label: 'Women Helpline (Sakhi)', phone: '181' },
      { label: 'NCW', phone: '7827170170' },
      { label: 'Police', phone: '112' },
      { label: 'NALSA', phone: '15100' },
    ],
  },
  {
    id: 'senior',
    color: 'blue',
    shape: 'circle',
    titleHi: 'वरिष्ठ नागरिक',
    titleEn: 'Senior Citizen',
    subHi: 'बुज़ुर्गों के साथ दुर्व्यवहार, संपत्ति विवाद',
    subEn: 'Elder abuse, property grabbing, neglect',
    whoIsThisFor: {
      hi: '60 वर्ष से अधिक आयु के व्यक्ति या उनके परिजन',
      en: 'Persons aged 60+ or their family members',
    },
    statutes: [
      'Maintenance & Welfare of Parents and Senior Citizens Act 2007',
      'BNSS 2023',
      'BNS 2023',
      'Transfer of Property Act 1882',
    ],
    systemPrompt:
      'You are a respectful elder-rights advisor. Use formal honorifics (आप / आदरणीय / Sir / Madam). Never rush. Reference MWPSC Act 2007 Sections 4 (maintenance), 5 (Tribunal), 23 (revoke gift deed). For property grabbing by children, the Tribunal can order revocation of transfer under Section 23. For neglect, the District Magistrate has powers. Always offer Elder Line 14567.',
    criticalKeywords: [
      'beat', 'मारा', 'starve', 'खाना नहीं',
      'kick out', 'घर से निकाल', 'medicine', 'दवा बंद',
    ],
    seriousKeywords: [
      'property', 'जायदाद', 'gift deed', 'gift',
      'son', 'बेटा', 'daughter-in-law', 'बहू',
    ],
    resources: [
      { label: 'Elder Line', phone: '14567' },
      { label: 'NALSA', phone: '15100' },
      { label: 'Senior Citizens Tribunal (DM Office)', url: 'https://socialjustice.gov.in' },
    ],
  },
  {
    id: 'advisor',
    color: 'red',
    shape: 'square',
    titleHi: 'कानूनी सलाहकार',
    titleEn: 'Legal Advisor',
    subHi: 'किसी भी मामले की प्रारंभिक जाँच — क्या वकील की ज़रूरत है?',
    subEn: 'Triage any matter — do you need a real lawyer?',
    whoIsThisFor: {
      hi: 'व्यवसायी, संपत्ति विवाद, अनुबंध, या कोई भी जटिल मामला',
      en: 'Businesses, property, contracts, or any complex matter',
    },
    statutes: [
      'BNSS 2023', 'BNS 2023', 'BSA 2023',
      'Indian Contract Act 1872',
      'Companies Act 2013',
      'Consumer Protection Act 2019',
      'IT Act 2000',
      'Specific Relief Act 1963',
    ],
    systemPrompt:
      'You are a legal triage advisor. Your job is to assess complexity and decide: (1) routine matter the user can handle with our app, (2) recommend a real lawyer, or (3) escalate immediately. For any commercial dispute > ₹10 lakh, IPR matter, criminal matter with arrest risk, family court matter, writ petition, or anything involving multiple jurisdictions — recommend a real lawyer. Otherwise, generate the appropriate document. Always cite the specific statute and section. End every reply with a Severity Verdict: NORMAL / SERIOUS / CRITICAL.',
    criticalKeywords: [
      'arrest', 'गिरफ्तार', 'jail', 'जेल',
      'court summons', 'समन', 'warrant', 'वारंट',
      'IPR', 'patent', 'trademark infringement',
    ],
    seriousKeywords: [
      'contract', 'अनुबंध', 'crore', 'करोड़',
      'lakh', 'लाख', 'company', 'कंपनी',
      'tax', 'GST', 'income tax',
    ],
    resources: [
      { label: 'Bar Council Lawyer Search', url: 'https://www.barcouncilofindia.org' },
      { label: 'NALSA Free Legal Aid', phone: '15100' },
      { label: 'eFiling Portal', url: 'https://efiling.ecourts.gov.in' },
    ],
  },
];

export const PERSONA_BY_ID: Record<PersonaId, PersonaSpec> =
  PERSONAS.reduce((acc, p) => ({ ...acc, [p.id]: p }), {} as Record<PersonaId, PersonaSpec>);

/**
 * Severity router: deterministic keyword scan + persona-specific rules.
 * In production this is augmented by Gemma 4 classification, but the
 * keyword pass is the safety net.
 */
export function classifySeverity(
  personaId: PersonaId,
  userText: string,
): SeverityVerdict {
  const persona = PERSONA_BY_ID[personaId];
  const text = userText.toLowerCase();

  const hasCritical = persona.criticalKeywords.some(k => text.includes(k.toLowerCase()));
  const hasSerious = persona.seriousKeywords.some(k => text.includes(k.toLowerCase()));

  if (hasCritical) {
    // POCSO + Women DV critical = SOS path with mandatory reporting cue
    const isMandatedReporting = personaId === 'pocso' || personaId === 'women_dv';
    return {
      level: 'critical',
      rationale: persona.criticalKeywords.find(k => text.includes(k.toLowerCase())) ?? 'critical pattern detected',
      action: isMandatedReporting ? 'sos_now' : 'escalate_lawyer_now',
      resources: persona.resources.map(r => `${r.label}${r.phone ? `: ${r.phone}` : ''}`),
    };
  }

  if (hasSerious || personaId === 'advisor') {
    return {
      level: 'serious',
      rationale: persona.seriousKeywords.find(k => text.includes(k.toLowerCase())) ?? 'complexity detected',
      action: 'recommend_lawyer',
      resources: persona.resources.map(r => `${r.label}${r.phone ? `: ${r.phone}` : ''}`),
    };
  }

  return {
    level: 'normal',
    rationale: 'routine matter',
    action: 'continue_in_app',
    resources: [persona.resources[0]?.label ?? 'NALSA: 15100'],
  };
}

/**
 * Map severity → user-facing copy in any language.
 */
export function severityCopy(level: Severity, lang: LangCode): { title: string; sub: string } {
  const copy: Record<Severity, Record<LangCode, { title: string; sub: string }>> = {
    normal: {
      'hi-IN': { title: 'सामान्य मामला', sub: 'आप इस ऐप के द्वारा आगे बढ़ सकते हैं' },
      'en-IN': { title: 'Routine matter', sub: 'You can proceed with this app' },
      'bn-IN': { title: 'সাধারণ বিষয়', sub: 'আপনি এই অ্যাপ দিয়ে এগিয়ে যেতে পারেন' },
      'ta-IN': { title: 'சாதாரண விஷயம்', sub: 'இந்த ஆப் மூலம் தொடரலாம்' },
      'te-IN': { title: 'సాధారణ విషయం', sub: 'ఈ యాప్‌తో కొనసాగవచ్చు' },
      'mr-IN': { title: 'सामान्य प्रकरण', sub: 'या ॲपद्वारे पुढे जाऊ शकता' },
      'gu-IN': { title: 'સામાન્ય બાબત', sub: 'આ ઍપ સાથે આગળ વધી શકો છો' },
      'kn-IN': { title: 'ಸಾಮಾನ್ಯ ವಿಷಯ', sub: 'ಈ ಆ್ಯಪ್‌ನೊಂದಿಗೆ ಮುಂದುವರಿಯಬಹುದು' },
      'ml-IN': { title: 'സാധാരണ കാര്യം', sub: 'ഈ ആപ്പിലൂടെ തുടരാം' },
      'pa-IN': { title: 'ਆਮ ਮਾਮਲਾ', sub: 'ਤੁਸੀਂ ਇਸ ਐਪ ਨਾਲ ਅੱਗੇ ਵੱਧ ਸਕਦੇ ਹੋ' },
      'od-IN': { title: 'ସାଧାରଣ ବିଷୟ', sub: 'ଆପଣ ଏହି ଆପ୍ ସହିତ ଆଗକୁ ବଢ଼ି ପାରନ୍ତି' },
    },
    serious: {
      'hi-IN': { title: 'गंभीर मामला', sub: 'वकील से सलाह लेना अच्छा रहेगा' },
      'en-IN': { title: 'Serious matter', sub: 'Consulting a real lawyer is recommended' },
      'bn-IN': { title: 'গুরুতর বিষয়', sub: 'আইনজীবীর পরামর্শ নেওয়া ভালো' },
      'ta-IN': { title: 'தீவிர விஷயம்', sub: 'வழக்கறிஞரை அணுகுவது நல்லது' },
      'te-IN': { title: 'తీవ్రమైన విషయం', sub: 'న్యాయవాదిని సంప్రదించడం మంచిది' },
      'mr-IN': { title: 'गंभीर प्रकरण', sub: 'वकिलाचा सल्ला घेणे चांगले' },
      'gu-IN': { title: 'ગંભીર બાબત', sub: 'વકીલની સલાહ લેવી સારી' },
      'kn-IN': { title: 'ಗಂಭೀರ ವಿಷಯ', sub: 'ವಕೀಲರ ಸಲಹೆ ಪಡೆಯುವುದು ಒಳ್ಳೆಯದು' },
      'ml-IN': { title: 'ഗുരുതരമായ കാര്യം', sub: 'അഭിഭാഷകന്റെ ഉപദേശം എടുക്കുന്നത് നല്ലത്' },
      'pa-IN': { title: 'ਗੰਭੀਰ ਮਾਮਲਾ', sub: 'ਵਕੀਲ ਦੀ ਸਲਾਹ ਲੈਣੀ ਚਾਹੀਦੀ ਹੈ' },
      'od-IN': { title: 'ଗୁରୁତର ବିଷୟ', sub: 'ଓକିଲଙ୍କ ପରାମର୍ଶ ନେବା ଭଲ' },
    },
    critical: {
      'hi-IN': { title: 'अत्यंत गंभीर', sub: 'तुरंत वकील या हेल्पलाइन से संपर्क करें' },
      'en-IN': { title: 'Critical', sub: 'Contact a lawyer or helpline immediately' },
      'bn-IN': { title: 'অত্যন্ত গুরুতর', sub: 'এখনই আইনজীবী বা হেল্পলাইনের সাথে যোগাযোগ করুন' },
      'ta-IN': { title: 'மிகவும் தீவிரம்', sub: 'உடனடியாக வழக்கறிஞரை அல்லது உதவி எண்ணை தொடர்பு கொள்ளுங்கள்' },
      'te-IN': { title: 'అత్యంత తీవ్రం', sub: 'వెంటనే న్యాయవాది లేదా హెల్ప్‌లైన్‌ని సంప్రదించండి' },
      'mr-IN': { title: 'अत्यंत गंभीर', sub: 'त्वरित वकील किंवा हेल्पलाइनशी संपर्क साधा' },
      'gu-IN': { title: 'અત્યંત ગંભીર', sub: 'તરત જ વકીલ અથવા હેલ્પલાઇનનો સંપર્ક કરો' },
      'kn-IN': { title: 'ಅತ್ಯಂತ ಗಂಭೀರ', sub: 'ತಕ್ಷಣ ವಕೀಲ ಅಥವಾ ಸಹಾಯವಾಣಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ' },
      'ml-IN': { title: 'അത്യന്തം ഗുരുതരം', sub: 'ഉടൻ അഭിഭാഷകനെ അല്ലെങ്കിൽ ഹെൽപ്പ്‌ലൈനെ സമീപിക്കുക' },
      'pa-IN': { title: 'ਅਤਿ ਗੰਭੀਰ', sub: 'ਤੁਰੰਤ ਵਕੀਲ ਜਾਂ ਹੈਲਪਲਾਈਨ ਨਾਲ ਸੰਪਰਕ ਕਰੋ' },
      'od-IN': { title: 'ଅତ୍ୟନ୍ତ ଗୁରୁତର', sub: 'ତୁରନ୍ତ ଓକିଲ କିମ୍ବା ହେଲ୍ପଲାଇନ ସହିତ ସମ୍ପର୍କ କରନ୍ତୁ' },
    },
  };
  return copy[level][lang] ?? copy[level]['en-IN'];
}
