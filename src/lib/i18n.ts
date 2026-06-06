/**
 * FirstReport — 11 Language Localization
 *
 * Sarvam AI supported language codes (verified May 2026):
 *   hi-IN, en-IN, bn-IN, ta-IN, te-IN, mr-IN, gu-IN, kn-IN, ml-IN, pa-IN, od-IN
 *
 * Each language has:
 *   - Native script label + Roman sublabel
 *   - Sarvam STT/TTS code
 *   - Per-persona opening message (TTS auto-plays this)
 *   - Core UI strings used throughout the app
 */

export type LangCode =
  | 'hi-IN' | 'en-IN' | 'bn-IN' | 'ta-IN' | 'te-IN'
  | 'mr-IN' | 'gu-IN' | 'kn-IN' | 'ml-IN' | 'pa-IN' | 'od-IN';

export type PersonaId =
  | 'standard' | 'pocso' | 'women_dv' | 'senior' | 'advisor';

export interface LanguageConfig {
  code: LangCode;
  sarvamCode: string;       // sarvam STT/TTS payload code
  bcp47: string;            // browser SpeechSynthesis fallback
  label: string;            // native script
  sublabel: string;         // Roman / English
  fontStack: string;        // Tailwind font fallback class
  shape: 'circle' | 'square' | 'triangle';  // Bauhaus geometric tile
  color: 'red' | 'blue' | 'yellow';
}

/**
 * The 11 Sarvam languages, displayed on the welcome screen as
 * a Bauhaus 11-tile grid (circle / square / triangle rotation).
 */
export const LANGUAGES: LanguageConfig[] = [
  { code: 'hi-IN', sarvamCode: 'hi-IN', bcp47: 'hi-IN', label: 'हिन्दी',     sublabel: 'Hindi',     fontStack: 'font-sans', shape: 'circle',   color: 'red'    },
  { code: 'en-IN', sarvamCode: 'en-IN', bcp47: 'en-IN', label: 'English',    sublabel: 'English',   fontStack: 'font-sans', shape: 'square',   color: 'blue'   },
  { code: 'bn-IN', sarvamCode: 'bn-IN', bcp47: 'bn-IN', label: 'বাংলা',      sublabel: 'Bengali',   fontStack: 'font-sans', shape: 'triangle', color: 'yellow' },
  { code: 'ta-IN', sarvamCode: 'ta-IN', bcp47: 'ta-IN', label: 'தமிழ்',     sublabel: 'Tamil',     fontStack: 'font-sans', shape: 'circle',   color: 'blue'   },
  { code: 'te-IN', sarvamCode: 'te-IN', bcp47: 'te-IN', label: 'తెలుగు',    sublabel: 'Telugu',    fontStack: 'font-sans', shape: 'square',   color: 'yellow' },
  { code: 'mr-IN', sarvamCode: 'mr-IN', bcp47: 'mr-IN', label: 'मराठी',      sublabel: 'Marathi',   fontStack: 'font-sans', shape: 'triangle', color: 'red'    },
  { code: 'gu-IN', sarvamCode: 'gu-IN', bcp47: 'gu-IN', label: 'ગુજરાતી',   sublabel: 'Gujarati',  fontStack: 'font-sans', shape: 'circle',   color: 'yellow' },
  { code: 'kn-IN', sarvamCode: 'kn-IN', bcp47: 'kn-IN', label: 'ಕನ್ನಡ',     sublabel: 'Kannada',   fontStack: 'font-sans', shape: 'square',   color: 'red'    },
  { code: 'ml-IN', sarvamCode: 'ml-IN', bcp47: 'ml-IN', label: 'മലയാളം',   sublabel: 'Malayalam', fontStack: 'font-sans', shape: 'triangle', color: 'blue'   },
  { code: 'pa-IN', sarvamCode: 'pa-IN', bcp47: 'pa-IN', label: 'ਪੰਜਾਬੀ',     sublabel: 'Punjabi',   fontStack: 'font-sans', shape: 'circle',   color: 'red'    },
  { code: 'od-IN', sarvamCode: 'od-IN', bcp47: 'or-IN', label: 'ଓଡ଼ିଆ',      sublabel: 'Odia',      fontStack: 'font-sans', shape: 'square',   color: 'blue'   },
];

export const LANG_BY_CODE: Record<LangCode, LanguageConfig> =
  LANGUAGES.reduce((acc, l) => ({ ...acc, [l.code]: l }), {} as Record<LangCode, LanguageConfig>);

/**
 * Per-persona opening lines (the AI greets the user in their language + persona tone).
 * These auto-play via Sarvam TTS the moment chat opens.
 *
 * Audited and corrected by parallel translator agents.
 * Tone notes:
 *   - standard:  formal-but-warm, neutral adult
 *   - pocso:     soft, friendly, child-safe vocabulary
 *   - women_dv:  reassuring, confidential, trauma-informed
 *   - senior:    respectful (use elder honorifics), slow pace
 *   - advisor:   professional consultant tone, neutral
 */
export const OPENING_LINES: Record<PersonaId, Record<LangCode, string>> = {
  standard: {
    'hi-IN': 'नमस्ते। मैं आपकी मदद के लिए हूँ। बताइए, क्या हुआ?',
    'en-IN': "Hello. I'm here to help. Please tell me what happened.",
    'bn-IN': 'নমস্কার। আমি আপনাকে সাহায্য করতে এসেছি। কী হয়েছে বলুন।',
    'ta-IN': 'வணக்கம். உங்களுக்கு உதவ நான் இருக்கிறேன். என்ன நடந்தது சொல்லுங்கள்.',
    'te-IN': 'నమస్తే. నేను మీకు సహాయం చేయడానికి ఇక్కడ ఉన్నాను. ఏమి జరిగిందో చెప్పండి.',
    'mr-IN': 'नमस्कार. मी तुम्हाला मदत करण्यासाठी आहे. काय झालं ते सांगा.',
    'gu-IN': 'નમસ્તે. હું તમારી મદદ માટે છું. શું થયું તે કહો.',
    'kn-IN': 'ನಮಸ್ಕಾರ. ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ಇದ್ದೇನೆ. ಏನಾಯಿತು ಹೇಳಿ.',
    'ml-IN': 'നമസ്കാരം. ഞാൻ നിങ്ങളെ സഹായിക്കാൻ ഇവിടെയുണ്ട്. എന്താണ് സംഭവിച്ചതെന്ന് പറയൂ.',
    'pa-IN': 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ। ਮੈਂ ਤੁਹਾਡੀ ਮਦਦ ਲਈ ਹਾਂ। ਦੱਸੋ ਕੀ ਹੋਇਆ?',
    'od-IN': 'ନମସ୍କାର। ମୁଁ ଆପଣଙ୍କୁ ସାହାଯ୍ୟ କରିବାକୁ ଆସିଛି। କଣ ହୋଇଛି କୁହନ୍ତୁ।',
  },
  pocso: {
    'hi-IN': 'नमस्ते बेटा। डरो मत, मैं तुम्हारी दोस्त हूँ। तुम जो भी कहोगे वो सुरक्षित रहेगा।',
    'en-IN': "Hello dear. Don't be afraid, I am your friend. Whatever you tell me will be safe.",
    'bn-IN': 'হ্যালো সোনা। ভয় পেয়ো না, আমি তোমার বন্ধু। তুমি যা বলবে সব নিরাপদ থাকবে।',
    'ta-IN': 'வணக்கம் செல்லம். பயப்படாதே, நான் உன் தோழி. நீ சொல்வது எல்லாம் பாதுகாப்பாக இருக்கும்.',
    'te-IN': 'హాయ్ బంగారం. భయపడకు, నేను నీ స్నేహితురాలిని. నువ్వు చెప్పేదంతా సురక్షితంగా ఉంటుంది.',
    'mr-IN': 'नमस्कार बाळा. घाबरू नकोस, मी तुझी मैत्रीण आहे. तू जे सांगशील ते सुरक्षित राहील.',
    'gu-IN': 'નમસ્તે બેટા. ડરીશ નહીં, હું તારી મિત્ર છું. તું જે કહીશ તે સુરક્ષિત રહેશે.',
    'kn-IN': 'ನಮಸ್ಕಾರ ಮಗು. ಭಯಪಡಬೇಡ, ನಾನು ನಿನ್ನ ಸ್ನೇಹಿತೆ. ನೀನು ಹೇಳುವುದೆಲ್ಲಾ ಸುರಕ್ಷಿತವಾಗಿರುತ್ತದೆ.',
    'ml-IN': 'ഹായ് കുട്ടി. പേടിക്കണ്ട, ഞാൻ നിന്റെ കൂട്ടുകാരിയാണ്. നീ പറയുന്നതെല്ലാം സുരക്ഷിതമായിരിക്കും.',
    'pa-IN': 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ ਪੁੱਤ। ਡਰ ਨਾ, ਮੈਂ ਤੇਰੀ ਸਹੇਲੀ ਹਾਂ। ਤੂੰ ਜੋ ਵੀ ਦੱਸੇਂਗਾ ਉਹ ਸੁਰੱਖਿਅਤ ਰਹੇਗਾ।',
    'od-IN': 'ନମସ୍କାର ପିଲା। ଡରନା, ମୁଁ ତୁମର ସାଥୀ। ତୁମେ ଯାହା କହିବ ସବୁ ସୁରକ୍ଷିତ ରହିବ।',
  },
  women_dv: {
    'hi-IN': 'नमस्ते बहन। यहाँ आप सुरक्षित हैं। जो कुछ हुआ, धीरे-धीरे बताइए। मैं आपके साथ हूँ।',
    'en-IN': 'Hello sister. You are safe here. Tell me slowly, in your own words, what happened. I am with you.',
    'bn-IN': 'নমস্কার বোন। এখানে আপনি নিরাপদ। যা হয়েছে ধীরে ধীরে বলুন। আমি আপনার সাথে আছি।',
    'ta-IN': 'வணக்கம் சகோதரி. இங்கே நீங்கள் பாதுகாப்பாக இருக்கிறீர்கள். மெதுவாகச் சொல்லுங்கள். நான் உங்களுடன் இருக்கிறேன்.',
    'te-IN': 'నమస్తే అక్కా. ఇక్కడ మీరు సురక్షితం. ఏం జరిగిందో నెమ్మదిగా చెప్పండి. నేను మీతో ఉన్నాను.',
    'mr-IN': 'नमस्कार ताई. इथे तुम्ही सुरक्षित आहात. जे झालं ते हळू हळू सांगा. मी तुमच्या सोबत आहे.',
    'gu-IN': 'નમસ્તે બહેન. અહીં તમે સુરક્ષિત છો. જે થયું તે ધીરે ધીરે કહો. હું તમારી સાથે છું.',
    'kn-IN': 'ನಮಸ್ಕಾರ ಅಕ್ಕ. ಇಲ್ಲಿ ನೀವು ಸುರಕ್ಷಿತ. ಆಗಿದ್ದನ್ನು ನಿಧಾನವಾಗಿ ಹೇಳಿ. ನಾನು ನಿಮ್ಮೊಂದಿಗಿದ್ದೇನೆ.',
    'ml-IN': 'നമസ്കാരം ചേച്ചി. ഇവിടെ നിങ്ങൾ സുരക്ഷിതരാണ്. എന്താണ് സംഭവിച്ചതെന്ന് സാവധാനം പറയൂ. ഞാൻ നിങ്ങളോടൊപ്പമുണ്ട്.',
    'pa-IN': 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ ਭੈਣ ਜੀ। ਇੱਥੇ ਤੁਸੀਂ ਸੁਰੱਖਿਅਤ ਹੋ। ਜੋ ਹੋਇਆ ਹੌਲੀ ਹੌਲੀ ਦੱਸੋ। ਮੈਂ ਤੁਹਾਡੇ ਨਾਲ ਹਾਂ।',
    'od-IN': 'ନମସ୍କାର ଭଉଣୀ। ଏଠାରେ ଆପଣ ସୁରକ୍ଷିତ। ଯାହା ହୋଇଛି ଧୀରେ ଧୀରେ କୁହନ୍ତୁ। ମୁଁ ଆପଣଙ୍କ ସହିତ ଅଛି।',
  },
  senior: {
    'hi-IN': 'प्रणाम जी। मैं आपकी सेवा में हूँ। आराम से बताइए, क्या परेशानी है?',
    'en-IN': 'Greetings, respected one. I am at your service. Please tell me, calmly, what is troubling you.',
    'bn-IN': 'নমস্কার মাননীয়। আমি আপনার সেবায় আছি। অনুগ্রহ করে শান্তভাবে বলুন, কী সমস্যা?',
    'ta-IN': 'வணக்கம் ஐயா. நான் உங்கள் சேவையில் இருக்கிறேன். நிதானமாக சொல்லுங்கள், என்ன பிரச்சினை?',
    'te-IN': 'నమస్కారం అయ్యా. నేను మీ సేవలో ఉన్నాను. ప్రశాంతంగా చెప్పండి, ఏమి ఇబ్బంది?',
    'mr-IN': 'नमस्कार आदरणीय. मी आपल्या सेवेत आहे. शांतपणे सांगा, काय त्रास आहे?',
    'gu-IN': 'પ્રણામ. હું આપની સેવામાં છું. શાંતિથી કહો, શું તકલીફ છે?',
    'kn-IN': 'ನಮಸ್ಕಾರ ಹಿರಿಯರೇ. ನಾನು ತಮ್ಮ ಸೇವೆಯಲ್ಲಿದ್ದೇನೆ. ಶಾಂತವಾಗಿ ಹೇಳಿ, ಏನು ತೊಂದರೆ?',
    'ml-IN': 'നമസ്കാരം ബഹുമാന്യരേ. ഞാൻ താങ്കളുടെ സേവനത്തിലാണ്. ശാന്തമായി പറയൂ, എന്താണ് പ്രശ്നം?',
    'pa-IN': 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ। ਮੈਂ ਤੁਹਾਡੀ ਸੇਵਾ ਵਿੱਚ ਹਾਂ। ਆਰਾਮ ਨਾਲ ਦੱਸੋ ਕੀ ਪਰੇਸ਼ਾਨੀ ਹੈ?',
    'od-IN': 'ପ୍ରଣାମ। ମୁଁ ଆପଣଙ୍କ ସେବାରେ ଅଛି। ଶାନ୍ତ ଭାବେ କୁହନ୍ତୁ, କଣ ଅସୁବିଧା?',
  },
  advisor: {
    'hi-IN': 'नमस्कार। मैं आपका कानूनी सहायक हूँ। अपनी समस्या विस्तार से बताइए—यह तय करेंगे कि क्या यह सामान्य मामला है या वकील की ज़रूरत है।',
    'en-IN': "Hello. I'm your legal advisor. Describe your situation in detail—I'll assess whether this is routine or needs a real lawyer.",
    'bn-IN': 'নমস্কার। আমি আপনার আইনি পরামর্শদাতা। বিস্তারিত বলুন—আমি দেখব এটি সাধারণ বিষয় নাকি আইনজীবীর দরকার।',
    'ta-IN': 'வணக்கம். நான் உங்கள் சட்ட ஆலோசகர். உங்கள் பிரச்சினையை விரிவாக சொல்லுங்கள்—இது சாதாரணமா அல்லது வழக்கறிஞர் தேவையா என்று சொல்கிறேன்.',
    'te-IN': 'నమస్తే. నేను మీ న్యాయ సలహాదారుని. మీ సమస్యను వివరంగా చెప్పండి—ఇది సాధారణమా లేదా న్యాయవాది అవసరమా చూస్తాను.',
    'mr-IN': 'नमस्कार. मी तुमचा कायदेशीर सल्लागार आहे. तुमची समस्या तपशीलवार सांगा—हे सामान्य प्रकरण आहे की वकीलाची गरज आहे ते बघेन.',
    'gu-IN': 'નમસ્તે. હું તમારો કાનૂની સલાહકાર છું. તમારી સમસ્યા વિગતવાર કહો—હું જોઈશ આ સામાન્ય બાબત છે કે વકીલની જરૂર છે.',
    'kn-IN': 'ನಮಸ್ಕಾರ. ನಾನು ನಿಮ್ಮ ಕಾನೂನು ಸಲಹೆಗಾರ. ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ವಿವರವಾಗಿ ಹೇಳಿ—ಇದು ಸಾಮಾನ್ಯವೋ ವಕೀಲರ ಅಗತ್ಯವೋ ನೋಡುತ್ತೇನೆ.',
    'ml-IN': 'നമസ്കാരം. ഞാൻ നിങ്ങളുടെ നിയമോപദേശകനാണ്. നിങ്ങളുടെ പ്രശ്നം വിശദമായി പറയൂ—ഇത് സാധാരണമാണോ അഭിഭാഷകൻ വേണോ ഞാൻ നോക്കാം.',
    'pa-IN': 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ। ਮੈਂ ਤੁਹਾਡਾ ਕਾਨੂੰਨੀ ਸਲਾਹਕਾਰ ਹਾਂ। ਆਪਣੀ ਸਮੱਸਿਆ ਵਿਸਤਾਰ ਨਾਲ ਦੱਸੋ—ਫੈਸਲਾ ਕਰਾਂਗੇ ਕਿ ਇਹ ਆਮ ਮਾਮਲਾ ਹੈ ਜਾਂ ਵਕੀਲ ਦੀ ਲੋੜ ਹੈ।',
    'od-IN': 'ନମସ୍କାର। ମୁଁ ଆପଣଙ୍କ ଆଇନ ଉପଦେଷ୍ଟା। ଆପଣଙ୍କ ସମସ୍ୟା ବିସ୍ତୃତ ଭାବେ କୁହନ୍ତୁ—ମୁଁ ଦେଖିବି ଏହା ସାଧାରଣ କି ଓକିଲଙ୍କ ଆବଶ୍ୟକତା।',
  },
};

/**
 * Core UI strings — keep small. Anything not localized falls back to English.
 */
export const UI = {
  appName: {
    'hi-IN': 'फ़र्स्टरिपोर्ट', 'en-IN': 'FirstReport', 'bn-IN': 'ফার্স্টরিপোর্ট',
    'ta-IN': 'ஃபர்ஸ்ட்ரிப்போர்ட்', 'te-IN': 'ఫస్ట్‌రిపోర్ట్', 'mr-IN': 'फर्स्टरिपोर्ट',
    'gu-IN': 'ફર્સ્ટરિપોર્ટ', 'kn-IN': 'ಫಸ್ಟ್‌ರಿಪೋರ್ಟ್', 'ml-IN': 'ഫസ്റ്റ്റിപ്പോർട്ട്',
    'pa-IN': 'ਫਸਟਰਿਪੋਰਟ', 'od-IN': 'ଫର୍ଷ୍ଟରିପୋର୍ଟ',
  },
  tagline: {
    'hi-IN': 'आपकी आवाज़, आपका हक़',
    'en-IN': 'Your voice. Your right.',
    'bn-IN': 'আপনার কণ্ঠ, আপনার অধিকার',
    'ta-IN': 'உங்கள் குரல், உங்கள் உரிமை',
    'te-IN': 'మీ స్వరం, మీ హక్కు',
    'mr-IN': 'तुमचा आवाज, तुमचा हक्क',
    'gu-IN': 'તમારો અવાજ, તમારો અધિકાર',
    'kn-IN': 'ನಿಮ್ಮ ಧ್ವನಿ, ನಿಮ್ಮ ಹಕ್ಕು',
    'ml-IN': 'നിങ്ങളുടെ ശബ്ദം, നിങ്ങളുടെ അവകാശം',
    'pa-IN': 'ਤੁਹਾਡੀ ਆਵਾਜ਼, ਤੁਹਾਡਾ ਹੱਕ',
    'od-IN': 'ଆପଣଙ୍କ ସ୍ୱର, ଆପଣଙ୍କ ଅଧିକାର',
  },
  start: {
    'hi-IN': 'शुरू करें', 'en-IN': 'Start', 'bn-IN': 'শুরু করুন',
    'ta-IN': 'தொடங்கு', 'te-IN': 'ప్రారంభించండి', 'mr-IN': 'सुरू करा',
    'gu-IN': 'શરૂ કરો', 'kn-IN': 'ಪ್ರಾರಂಭಿಸಿ', 'ml-IN': 'ആരംഭിക്കുക',
    'pa-IN': 'ਸ਼ੁਰੂ ਕਰੋ', 'od-IN': 'ଆରମ୍ଭ କରନ୍ତୁ',
  },
  speak: {
    'hi-IN': 'बोलिए', 'en-IN': 'Speak', 'bn-IN': 'বলুন',
    'ta-IN': 'பேசு', 'te-IN': 'మాట్లాడండి', 'mr-IN': 'बोला',
    'gu-IN': 'બોલો', 'kn-IN': 'ಮಾತನಾಡಿ', 'ml-IN': 'സംസാരിക്കുക',
    'pa-IN': 'ਬੋਲੋ', 'od-IN': 'କୁହନ୍ତୁ',
  },
  listening: {
    'hi-IN': 'सुन रहा हूँ…', 'en-IN': 'Listening…', 'bn-IN': 'শুনছি…',
    'ta-IN': 'கேட்கிறேன்…', 'te-IN': 'వింటున్నాను…', 'mr-IN': 'ऐकत आहे…',
    'gu-IN': 'સાંભળું છું…', 'kn-IN': 'ಕೇಳುತ್ತಿದ್ದೇನೆ…', 'ml-IN': 'കേൾക്കുന്നു…',
    'pa-IN': 'ਸੁਣ ਰਿਹਾ ਹਾਂ…', 'od-IN': 'ଶୁଣୁଛି…',
  },
  selectLanguage: {
    'hi-IN': 'भाषा चुनें', 'en-IN': 'Select language', 'bn-IN': 'ভাষা বেছে নিন',
    'ta-IN': 'மொழி தேர்வு', 'te-IN': 'భాష ఎంచుకోండి', 'mr-IN': 'भाषा निवडा',
    'gu-IN': 'ભાષા પસંદ કરો', 'kn-IN': 'ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ', 'ml-IN': 'ഭാഷ തിരഞ്ഞെടുക്കുക',
    'pa-IN': 'ਭਾਸ਼ਾ ਚੁਣੋ', 'od-IN': 'ଭାଷା ବାଛନ୍ତୁ',
  },
  selectMode: {
    'hi-IN': 'मोड चुनें', 'en-IN': 'Select mode', 'bn-IN': 'মোড বেছে নিন',
    'ta-IN': 'பயன்முறை தேர்வு', 'te-IN': 'మోడ్ ఎంచుకోండి', 'mr-IN': 'मोड निवडा',
    'gu-IN': 'મોડ પસંદ કરો', 'kn-IN': 'ಮೋಡ್ ಆಯ್ಕೆಮಾಡಿ', 'ml-IN': 'മോഡ് തിരഞ്ഞെടുക്കുക',
    'pa-IN': 'ਮੋਡ ਚੁਣੋ', 'od-IN': 'ମୋଡ୍ ବାଛନ୍ତୁ',
  },
  sendMessage: {
    'hi-IN': 'भेजें', 'en-IN': 'Send', 'bn-IN': 'পাঠান',
    'ta-IN': 'அனுப்பு', 'te-IN': 'పంపండి', 'mr-IN': 'पाठवा',
    'gu-IN': 'મોકલો', 'kn-IN': 'ಕಳುಹಿಸಿ', 'ml-IN': 'അയയ്ക്കുക',
    'pa-IN': 'ਭੇਜੋ', 'od-IN': 'ପଠାନ୍ତୁ',
  },
  sosCall: {
    'hi-IN': 'NALSA हेल्पलाइन — 15100',
    'en-IN': 'NALSA helpline — 15100',
    'bn-IN': 'NALSA হেল্পলাইন — 15100',
    'ta-IN': 'NALSA உதவி எண் — 15100',
    'te-IN': 'NALSA హెల్ప్‌లైన్ — 15100',
    'mr-IN': 'NALSA हेल्पलाइन — 15100',
    'gu-IN': 'NALSA હેલ્પલાઇન — 15100',
    'kn-IN': 'NALSA ಸಹಾಯವಾಣಿ — 15100',
    'ml-IN': 'NALSA ഹെൽപ്പ്‌ലൈൻ — 15100',
    'pa-IN': 'NALSA ਹੈਲਪਲਾਈਨ — 15100',
    'od-IN': 'NALSA ହେଲ୍ପଲାଇନ — 15100',
  },
  preview: {
    'hi-IN': 'पूर्वावलोकन', 'en-IN': 'Preview', 'bn-IN': 'প্রিভিউ',
    'ta-IN': 'முன்னோட்டம்', 'te-IN': 'ప్రివ్యూ', 'mr-IN': 'पूर्वावलोकन',
    'gu-IN': 'પૂર્વાવલોકન', 'kn-IN': 'ಮುನ್ನೋಟ', 'ml-IN': 'പ്രിവ്യൂ',
    'pa-IN': 'ਪ੍ਰੀਵਿਊ', 'od-IN': 'ପୂର୍ବାବଲୋକନ',
  },
  online: {
    'hi-IN': 'ऑनलाइन', 'en-IN': 'Online', 'bn-IN': 'অনলাইন',
    'ta-IN': 'ஆன்லைன்', 'te-IN': 'ఆన్‌లైన్', 'mr-IN': 'ऑनलाइन',
    'gu-IN': 'ઑનલાઇન', 'kn-IN': 'ಆನ್‌ಲೈನ್', 'ml-IN': 'ഓൺലൈൻ',
    'pa-IN': 'ਔਨਲਾਈਨ', 'od-IN': 'ଅନଲାଇନ',
  },
  thinking: {
    'hi-IN': 'सोच रहा हूँ…', 'en-IN': 'Thinking…', 'bn-IN': 'ভাবছি…',
    'ta-IN': 'யோசிக்கிறேன்…', 'te-IN': 'ఆలోచిస్తున్నాను…', 'mr-IN': 'विचार करतो आहे…',
    'gu-IN': 'વિચારી રહ્યો છું…', 'kn-IN': 'ಯೋಚಿಸುತ್ತಿದ್ದೇನೆ…', 'ml-IN': 'ചിന്തിക്കുന്നു…',
    'pa-IN': 'ਸੋਚ ਰਿਹਾ ਹਾਂ…', 'od-IN': 'ଭାବୁଛି…',
  },
  history: {
    'hi-IN': 'पुरानी सलाह', 'en-IN': 'Past Advice', 'bn-IN': 'পুরনো পরামর্শ',
    'ta-IN': 'பழைய ஆலோசனைகள்', 'te-IN': 'మునుపటి సలహాలు', 'mr-IN': 'जुने सल्ले',
    'gu-IN': 'જૂની સલાહ', 'kn-IN': 'ಹಿಂದಿನ ಸಲಹೆಗಳು', 'ml-IN': 'പഴയ ഉപദേശം',
    'pa-IN': 'ਪੁਰਾਣੀ ਸਲਾਹ', 'od-IN': 'ପୁରୁଣା ପରାମର୍ଶ',
  },
  noHistory: {
    'hi-IN': 'अभी कोई पिछला मामला नहीं है।',
    'en-IN': 'No past cases yet.',
    'bn-IN': 'এখনও কোনো পুরোনো মামলা নেই।',
    'ta-IN': 'இதுவரை பழைய வழக்கு இல்லை.',
    'te-IN': 'ఇప్పటికీ గత కేసులు లేవు.',
    'mr-IN': 'अद्याप कोणतेही जुने प्रकरण नाही.',
    'gu-IN': 'હજુ સુધી કોઈ જૂનો કેસ નથી.',
    'kn-IN': 'ಇನ್ನೂ ಯಾವುದೇ ಹಿಂದಿನ ಪ್ರಕರಣಗಳಿಲ್ಲ.',
    'ml-IN': 'ഇതുവരെ പഴയ കേസുകളില്ല.',
    'pa-IN': 'ਅਜੇ ਤੱਕ ਕੋਈ ਪੁਰਾਣਾ ਮਾਮਲਾ ਨਹੀਂ ਹੈ।',
    'od-IN': 'ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ପୁରୁଣା ମାମଲା ନାହିଁ।',
  },
  voiceFirst: {
    'hi-IN': 'आवाज़ पहले · 11 भाषाएँ · ऑफ़लाइन',
    'en-IN': 'Voice-first · 11 languages · Offline-ready',
    'bn-IN': 'ভয়েস-প্রথম · ১১টি ভাষা · অফলাইন',
    'ta-IN': 'குரல் முதன்மை · 11 மொழிகள் · ஆஃப்லைன்',
    'te-IN': 'వాయిస్-ఫస్ట్ · 11 భాషలు · ఆఫ్‌లైన్',
    'mr-IN': 'आवाज प्रथम · ११ भाषा · ऑफलाइन',
    'gu-IN': 'વોઇસ-ફર્સ્ટ · ૧૧ ભાષાઓ · ઑફલાઇન',
    'kn-IN': 'ಧ್ವನಿ ಮೊದಲು · ೧೧ ಭಾಷೆಗಳು · ಆಫ್‌ಲೈನ್',
    'ml-IN': 'വോയ്‌സ്-ഫസ്റ്റ് · 11 ഭാഷകൾ · ഓഫ്‌ലൈൻ',
    'pa-IN': 'ਆਵਾਜ਼ ਪਹਿਲਾਂ · 11 ਭਾਸ਼ਾਵਾਂ · ਔਫਲਾਈਨ',
    'od-IN': 'ସ୍ୱର ପ୍ରଥମ · ୧୧ ଭାଷା · ଅଫ୍‌ଲାଇନ',
  },
  // Three-line poster headline. Each line ≤ 6 letters when possible.
  heroLine1: {
    'hi-IN': 'आपकी', 'en-IN': 'YOUR', 'bn-IN': 'আপনার',
    'ta-IN': 'உங்கள்', 'te-IN': 'మీ', 'mr-IN': 'तुमचा',
    'gu-IN': 'તમારો', 'kn-IN': 'ನಿಮ್ಮ', 'ml-IN': 'നിങ്ങളുടെ',
    'pa-IN': 'ਤੁਹਾਡੀ', 'od-IN': 'ଆପଣଙ୍କ',
  },
  heroLine2: { // big red word
    'hi-IN': 'आवाज़', 'en-IN': 'VOICE.', 'bn-IN': 'কণ্ঠ',
    'ta-IN': 'குரல்', 'te-IN': 'స్వరం', 'mr-IN': 'आवाज',
    'gu-IN': 'અવાજ', 'kn-IN': 'ಧ್ವನಿ', 'ml-IN': 'ശബ്ദം',
    'pa-IN': 'ਆਵਾਜ਼', 'od-IN': 'ସ୍ୱର',
  },
  heroLine3: {
    'hi-IN': 'आपका', 'en-IN': 'YOUR', 'bn-IN': 'আপনার',
    'ta-IN': 'உங்கள்', 'te-IN': 'మీ', 'mr-IN': 'तुमचा',
    'gu-IN': 'તમારો', 'kn-IN': 'ನಿಮ್ಮ', 'ml-IN': 'നിങ്ങളുടെ',
    'pa-IN': 'ਤੁਹਾਡਾ', 'od-IN': 'ଆପଣଙ୍କ',
  },
  heroLine4: { // big blue word
    'hi-IN': 'हक़।', 'en-IN': 'RIGHT.', 'bn-IN': 'অধিকার।',
    'ta-IN': 'உரிமை.', 'te-IN': 'హక్కు.', 'mr-IN': 'हक्क.',
    'gu-IN': 'અધિકાર.', 'kn-IN': 'ಹಕ್ಕು.', 'ml-IN': 'അവകാശം.',
    'pa-IN': 'ਹੱਕ।', 'od-IN': 'ଅଧିକାର।',
  },
  changeLanguage: {
    'hi-IN': 'भाषा बदलें', 'en-IN': 'Change language', 'bn-IN': 'ভাষা পরিবর্তন করুন',
    'ta-IN': 'மொழி மாற்று', 'te-IN': 'భాష మార్చండి', 'mr-IN': 'भाषा बदला',
    'gu-IN': 'ભાષા બદલો', 'kn-IN': 'ಭಾಷೆ ಬದಲಿಸಿ', 'ml-IN': 'ഭാഷ മാറ്റുക',
    'pa-IN': 'ਭਾਸ਼ਾ ਬਦਲੋ', 'od-IN': 'ଭାଷା ବଦଳାନ୍ତୁ',
  },
} as const;

export type UIKey = keyof typeof UI;

export function t(key: UIKey, lang: LangCode): string {
  return (UI[key] as Record<LangCode, string>)[lang] ?? (UI[key] as Record<LangCode, string>)['en-IN'];
}

export function openingFor(persona: PersonaId, lang: LangCode): string {
  return OPENING_LINES[persona]?.[lang] ?? OPENING_LINES.standard['en-IN'];
}

/**
 * Disclaimer that appears on EVERY generated document, in the user's language.
 * Mandated by CLAUDE.md SAFETY rule.
 */
export const LEGAL_DISCLAIMER: Record<LangCode, string> = {
  'hi-IN': 'यह दस्तावेज़ AI द्वारा तैयार किया गया है। यह कानूनी सलाह नहीं है। गंभीर मामलों में वकील से परामर्श करें। NALSA हेल्पलाइन: 15100',
  'en-IN': 'This document is AI-generated. It is not legal advice. For serious matters, consult a lawyer. NALSA helpline: 15100',
  'bn-IN': 'এই নথি AI দ্বারা তৈরি। এটি আইনি পরামর্শ নয়। গুরুতর বিষয়ে আইনজীবীর সাথে পরামর্শ করুন। NALSA: 15100',
  'ta-IN': 'இந்த ஆவணம் AI-ஆல் உருவாக்கப்பட்டது. இது சட்ட ஆலோசனை அல்ல. தீவிர விஷயங்களில் வழக்கறிஞரை அணுகவும். NALSA: 15100',
  'te-IN': 'ఈ పత్రం AI ద్వారా రూపొందించబడింది. ఇది చట్టపరమైన సలహా కాదు. తీవ్రమైన విషయాల్లో న్యాయవాదిని సంప్రదించండి. NALSA: 15100',
  'mr-IN': 'हे दस्तऐवज AI ने तयार केले आहे. हा कायदेशीर सल्ला नाही. गंभीर बाबींमध्ये वकिलाचा सल्ला घ्या. NALSA: 15100',
  'gu-IN': 'આ દસ્તાવેજ AI દ્વારા તૈયાર કરવામાં આવ્યો છે. આ કાનૂની સલાહ નથી. ગંભીર બાબતોમાં વકીલની સલાહ લો. NALSA: 15100',
  'kn-IN': 'ಈ ದಾಖಲೆಯನ್ನು AI ಸಿದ್ಧಪಡಿಸಿದೆ. ಇದು ಕಾನೂನು ಸಲಹೆಯಲ್ಲ. ಗಂಭೀರ ವಿಷಯಗಳಲ್ಲಿ ವಕೀಲರನ್ನು ಸಂಪರ್ಕಿಸಿ. NALSA: 15100',
  'ml-IN': 'ഈ രേഖ AI തയ്യാറാക്കിയതാണ്. ഇത് നിയമോപദേശമല്ല. ഗുരുതരമായ കാര്യങ്ങളിൽ അഭിഭാഷകനെ സമീപിക്കുക. NALSA: 15100',
  'pa-IN': 'ਇਹ ਦਸਤਾਵੇਜ਼ AI ਦੁਆਰਾ ਤਿਆਰ ਕੀਤਾ ਗਿਆ ਹੈ। ਇਹ ਕਾਨੂੰਨੀ ਸਲਾਹ ਨਹੀਂ ਹੈ। ਗੰਭੀਰ ਮਾਮਲਿਆਂ ਵਿੱਚ ਵਕੀਲ ਨਾਲ ਸਲਾਹ ਕਰੋ। NALSA: 15100',
  'od-IN': 'ଏହି ଦଲିଲ AI ଦ୍ୱାରା ପ୍ରସ୍ତୁତ। ଏହା ଆଇନଗତ ପରାମର୍ଶ ନୁହେଁ। ଗୁରୁତର ବିଷୟରେ ଓକିଲଙ୍କୁ ସମ୍ପର୍କ କରନ୍ତୁ। NALSA: 15100',
};
