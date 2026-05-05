'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LANGUAGES, type LangCode } from '@/lib/i18n';
import { PERSONAS, type PersonaSpec } from '@/lib/personas';
import SpeakerButton from '@/components/SpeakerButton';

const SEVERITY = [
  { val: 1, label: 'Routine',  labelHi: 'सामान्य',  body: 'Theft, paperwork, refused FIR',              bodyHi: 'चोरी, कागज़ात, FIR से इनकार',         accent: '#5FA8A0' },
  { val: 2, label: 'Serious',  labelHi: 'गंभीर',    body: 'Repeated harassment, financial loss > ₹1L',  bodyHi: 'बार-बार उत्पीड़न, ₹1L से ज़्यादा नुकसान', accent: '#B8962E' },
  { val: 3, label: 'Critical', labelHi: 'अति गंभीर', body: 'Violence, child safety, immediate threat',    bodyHi: 'हिंसा, बाल सुरक्षा, तुरंत खतरा',       accent: '#D9534F' },
] as const;

const FORM_COPY: Partial<Record<LangCode, {
  eyebrow: string; title: string; em: string;
  desc: string; bullets: string[];
  q1Label: string; q1Head: string;
  q2Label: string; q2Head: string;
  q3Label: string; q3Head: string;
  submit: string; nalsa: string;
}>> = {
  'en-IN': {
    eyebrow: 'Confidential Triage', title: 'Begin in ', em: '90 seconds.',
    desc: 'Three questions establish the right specialist mode and statute path. Voice takes over from there. Nothing leaves your device until you choose to send.',
    bullets: ['Encrypted in transit · DPDP Act 2023 compliant', 'No registration required for triage', 'Free legal aid escalation via NALSA · 15100'],
    q1Label: 'Question 1 of 3', q1Head: 'In which language do you wish to proceed?',
    q2Label: 'Question 2 of 3', q2Head: 'Which specialist mode applies?',
    q3Label: 'Question 3 of 3', q3Head: 'How urgent is this matter?',
    submit: 'Begin Confidential Triage →', nalsa: 'Or call NALSA · 15100 · free legal aid',
  },
  'hi-IN': {
    eyebrow: 'गोपनीय ट्राइएज', title: 'शुरू करें ', em: '90 सेकंड में।',
    desc: 'तीन प्रश्न सही विशेषज्ञ मोड और कानून का रास्ता तय करते हैं। फिर आवाज़ संभाल लेती है। जब तक आप चुनें, कुछ भी आपके डिवाइस से नहीं जाता।',
    bullets: ['ट्रांज़िट में एन्क्रिप्टेड · DPDP Act 2023 के अनुसार', 'ट्राइएज के लिए कोई रजिस्ट्रेशन नहीं', 'NALSA · 15100 के ज़रिए मुफ्त कानूनी सहायता'],
    q1Label: 'प्रश्न 1 का 3', q1Head: 'आप किस भाषा में आगे बढ़ना चाहते हैं?',
    q2Label: 'प्रश्न 2 का 3', q2Head: 'कौन सा विशेषज्ञ मोड लागू होता है?',
    q3Label: 'प्रश्न 3 का 3', q3Head: 'यह मामला कितना ज़रूरी है?',
    submit: 'गोपनीय ट्राइएज शुरू करें →', nalsa: 'या NALSA · 15100 पर कॉल करें · मुफ्त कानूनी सहायता',
  },
  'bn-IN': {
    eyebrow: 'গোপনীয় ট্রায়াজ', title: 'শুরু করুন ', em: '৯০ সেকেন্ডে।',
    desc: 'তিনটি প্রশ্ন সঠিক বিশেষজ্ঞ মোড ও আইনি পথ নির্ধারণ করে। তারপর কণ্ঠস্বর নিয়ন্ত্রণ নেয়।',
    bullets: ['ট্রান্সিটে এনক্রিপ্টেড · DPDP আইন 2023', 'নিবন্ধন ছাড়াই ট্রায়াজ', 'NALSA · 15100 বিনামূল্যে আইনি সহায়তা'],
    q1Label: '১ নং প্রশ্ন ৩ এর মধ্যে', q1Head: 'আপনি কোন ভাষায় এগিয়ে যেতে চান?',
    q2Label: '২ নং প্রশ্ন ৩ এর মধ্যে', q2Head: 'কোন বিশেষজ্ঞ মোড প্রযোজ্য?',
    q3Label: '৩ নং প্রশ্ন ৩ এর মধ্যে', q3Head: 'বিষয়টি কতটা জরুরি?',
    submit: 'গোপনীয় ট্রায়াজ শুরু করুন →', nalsa: 'অথবা NALSA · 15100 কল করুন',
  },
  'ta-IN': {
    eyebrow: 'இரகசிய மதிப்பீடு', title: 'தொடங்குங்கள் ', em: '90 விநாடிகளில்.',
    desc: 'மூன்று கேள்விகள் சரியான நிபுணர் பயன்முறையையும் சட்ட பாதையையும் தீர்மானிக்கின்றன.',
    bullets: ['போக்குவரத்தில் மறைகுறியாக்கப்பட்டது · DPDP சட்டம் 2023', 'பதிவு தேவையில்லை', 'NALSA · 15100 இலவச சட்ட உதவி'],
    q1Label: 'கேள்வி 1 / 3', q1Head: 'எந்த மொழியில் தொடர விரும்புகிறீர்கள்?',
    q2Label: 'கேள்வி 2 / 3', q2Head: 'எந்த நிபுணர் பயன்முறை பொருந்தும்?',
    q3Label: 'கேள்வி 3 / 3', q3Head: 'இந்த விஷயம் எவ்வளவு அவசரம்?',
    submit: 'இரகசிய மதிப்பீட்டைத் தொடங்கு →', nalsa: 'அல்லது NALSA · 15100 அழைக்கவும்',
  },
  'te-IN': {
    eyebrow: 'రహస్య ట్రయాజ్', title: 'ప్రారంభించండి ', em: '90 సెకన్లలో.',
    desc: 'మూడు ప్రశ్నలు సరైన నిపుణుల మోడ్ మరియు చట్టపరమైన మార్గాన్ని నిర్ణయిస్తాయి.',
    bullets: ['ట్రాన్సిట్‌లో గుప్తీకరించబడింది · DPDP చట్టం 2023', 'నమోదు అవసరం లేదు', 'NALSA · 15100 ఉచిత న్యాయ సహాయం'],
    q1Label: 'ప్రశ్న 1 / 3', q1Head: 'మీరు ఏ భాషలో కొనసాగించాలనుకుంటున్నారు?',
    q2Label: 'ప్రశ్న 2 / 3', q2Head: 'ఏ నిపుణుల మోడ్ వర్తిస్తుంది?',
    q3Label: 'ప్రశ్న 3 / 3', q3Head: 'ఈ విషయం ఎంత అత్యవసరం?',
    submit: 'రహస్య ట్రయాజ్ ప్రారంభించండి →', nalsa: 'లేదా NALSA · 15100 కి కాల్ చేయండి',
  },
  'mr-IN': {
    eyebrow: 'गोपनीय ट्रायज', title: 'सुरू करा ', em: '90 सेकंदात.',
    desc: 'तीन प्रश्न योग्य तज्ञ मोड आणि कायदेशीर मार्ग निर्धारित करतात.',
    bullets: ['ट्रान्झिटमध्ये एन्क्रिप्टेड · DPDP कायदा 2023', 'ट्रायजसाठी नोंदणी आवश्यक नाही', 'NALSA · 15100 मोफत कायदेशीर मदत'],
    q1Label: 'प्रश्न 1 पैकी 3', q1Head: 'तुम्ही कोणत्या भाषेत पुढे जाऊ इच्छिता?',
    q2Label: 'प्रश्न 2 पैकी 3', q2Head: 'कोणता तज्ञ मोड लागू होतो?',
    q3Label: 'प्रश्न 3 पैकी 3', q3Head: 'हा विषय किती तातडीचा आहे?',
    submit: 'गोपनीय ट्रायज सुरू करा →', nalsa: 'किंवा NALSA · 15100 वर कॉल करा',
  },
  'gu-IN': {
    eyebrow: 'ગોપનીય ટ્રિઍજ', title: 'શરૂ કરો ', em: '90 સેકન્ડમાં.',
    desc: 'ત્રણ પ્રશ્નો સાચો નિષ્ણાત મોડ અને કાનૂની માર્ગ નક્કી કરે છે.',
    bullets: ['ટ્રાન્ઝિટમાં એન્ક્રિપ્ટ · DPDP અધિનિયમ 2023', 'ટ્રિઍજ માટે નોંધણી જરૂરી નથી', 'NALSA · 15100 મફત કાનૂની સહાય'],
    q1Label: 'પ્રશ્ન 1 / 3', q1Head: 'તમે કઈ ભાષામાં આગળ વધવા માંગો છો?',
    q2Label: 'પ્રશ્ન 2 / 3', q2Head: 'કઈ નિષ્ણાત મોડ લાગુ પડે છે?',
    q3Label: 'પ્રશ્ન 3 / 3', q3Head: 'આ મામલો કેટલો જરૂરી છે?',
    submit: 'ગોપનીય ટ્રિઍજ શરૂ કરો →', nalsa: 'અથવા NALSA · 15100 પર કૉલ કરો',
  },
  'kn-IN': {
    eyebrow: 'ಗೋಪ್ಯ ಟ್ರಯಾಜ್', title: 'ಪ್ರಾರಂಭಿಸಿ ', em: '90 ಸೆಕೆಂಡುಗಳಲ್ಲಿ.',
    desc: 'ಮೂರು ಪ್ರಶ್ನೆಗಳು ಸರಿಯಾದ ತಜ್ಞ ಮೋಡ್ ಮತ್ತು ಕಾನೂನು ಮಾರ್ಗವನ್ನು ನಿರ್ಧರಿಸುತ್ತವೆ.',
    bullets: ['ಟ್ರಾನ್ಸಿಟ್‌ನಲ್ಲಿ ಎನ್‌ಕ್ರಿಪ್ಟ್ · DPDP ಕಾಯಿದೆ 2023', 'ನೋಂದಣಿ ಅಗತ್ಯವಿಲ್ಲ', 'NALSA · 15100 ಉಚಿತ ಕಾನೂನು ನೆರವು'],
    q1Label: 'ಪ್ರಶ್ನೆ 1 / 3', q1Head: 'ನೀವು ಯಾವ ಭಾಷೆಯಲ್ಲಿ ಮುಂದುವರಿಯಲು ಬಯಸುತ್ತೀರಿ?',
    q2Label: 'ಪ್ರಶ್ನೆ 2 / 3', q2Head: 'ಯಾವ ತಜ್ಞ ಮೋಡ್ ಅನ್ವಯಿಸುತ್ತದೆ?',
    q3Label: 'ಪ್ರಶ್ನೆ 3 / 3', q3Head: 'ಈ ವಿಷಯ ಎಷ್ಟು ತುರ್ತು?',
    submit: 'ಗೋಪ್ಯ ಟ್ರಯಾಜ್ ಪ್ರಾರಂಭಿಸಿ →', nalsa: 'ಅಥವಾ NALSA · 15100 ಕರೆ ಮಾಡಿ',
  },
  'ml-IN': {
    eyebrow: 'രഹസ്യ ട്രയേജ്', title: 'ആരംഭിക്കുക ', em: '90 സെക്കൻഡിൽ.',
    desc: 'മൂന്ന് ചോദ്യങ്ങൾ ശരിയായ വിദഗ്ദ്ധ മോഡും നിയമ പാതയും നിർണ്ണയിക്കുന്നു.',
    bullets: ['ട്രാൻസിറ്റിൽ എൻക്രിപ്റ്റ് ചെയ്തു · DPDP ആക്ട് 2023', 'രജിസ്ട്രേഷൻ ആവശ്യമില്ല', 'NALSA · 15100 സൗജന്യ നിയമ സഹായം'],
    q1Label: 'ചോദ്യം 1 / 3', q1Head: 'ഏത് ഭാഷയിൽ തുടരണം?',
    q2Label: 'ചോദ്യം 2 / 3', q2Head: 'ഏത് വിദഗ്ദ്ധ മോഡ് ബാധകം?',
    q3Label: 'ചോദ്യം 3 / 3', q3Head: 'ഈ കാര്യം എത്ര അടിയന്തിരം?',
    submit: 'രഹസ്യ ട്രയേജ് ആരംഭിക്കുക →', nalsa: 'അല്ലെങ്കിൽ NALSA · 15100 വിളിക്കൂ',
  },
  'pa-IN': {
    eyebrow: 'ਗੁਪਤ ਟ੍ਰਾਈਏਜ', title: 'ਸ਼ੁਰੂ ਕਰੋ ', em: '90 ਸਕਿੰਟਾਂ ਵਿੱਚ।',
    desc: 'ਤਿੰਨ ਸਵਾਲ ਸਹੀ ਮਾਹਿਰ ਮੋਡ ਅਤੇ ਕਾਨੂੰਨੀ ਰਾਹ ਤੈਅ ਕਰਦੇ ਹਨ।',
    bullets: ['ਟਰਾਂਜ਼ਿਟ ਵਿੱਚ ਇਨਕ੍ਰਿਪਟੇਡ · DPDP ਐਕਟ 2023', 'ਕੋਈ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਦੀ ਲੋੜ ਨਹੀਂ', 'NALSA · 15100 ਮੁਫ਼ਤ ਕਾਨੂੰਨੀ ਮਦਦ'],
    q1Label: 'ਸਵਾਲ 1 / 3', q1Head: 'ਤੁਸੀਂ ਕਿਸ ਭਾਸ਼ਾ ਵਿੱਚ ਅੱਗੇ ਵਧਣਾ ਚਾਹੁੰਦੇ ਹੋ?',
    q2Label: 'ਸਵਾਲ 2 / 3', q2Head: 'ਕਿਹੜਾ ਮਾਹਿਰ ਮੋਡ ਲਾਗੂ ਹੁੰਦਾ ਹੈ?',
    q3Label: 'ਸਵਾਲ 3 / 3', q3Head: 'ਇਹ ਮਾਮਲਾ ਕਿੰਨਾ ਜ਼ਰੂਰੀ ਹੈ?',
    submit: 'ਗੁਪਤ ਟ੍ਰਾਈਏਜ ਸ਼ੁਰੂ ਕਰੋ →', nalsa: 'ਜਾਂ NALSA · 15100 ਤੇ ਕਾਲ ਕਰੋ',
  },
  'od-IN': {
    eyebrow: 'ଗୋପନୀୟ ଟ୍ରାଏଜ', title: 'ଆରମ୍ଭ କରନ୍ତୁ ', em: '90 ସେକେଣ୍ଡରେ।',
    desc: 'ତିନୋଟି ପ୍ରଶ୍ନ ସଠିକ୍ ବିଶେଷଜ୍ଞ ମୋଡ ଏବଂ ଆଇନଗତ ପଥ ନିର୍ଧାରଣ କରେ।',
    bullets: ['ଟ୍ରାନ୍ଜିଟ୍ ରେ ଏନ୍‌କ୍ରିପ୍ଟ · DPDP ଆଇନ 2023', 'ଟ୍ରାଏଜ ପାଇଁ ପଞ୍ଜୀକରଣ ଆବଶ୍ୟକ ନୁହେଁ', 'NALSA · 15100 ମାଗଣା ଆଇନ ସହାୟତା'],
    q1Label: 'ପ୍ରଶ୍ନ 1 / 3', q1Head: 'ଆପଣ କେଉଁ ଭାଷାରେ ଆଗ ବଢ଼ିବେ?',
    q2Label: 'ପ୍ରଶ୍ନ 2 / 3', q2Head: 'କେଉଁ ବିଶେଷଜ୍ଞ ମୋଡ ପ୍ରଯୁଜ୍ୟ?',
    q3Label: 'ପ୍ରଶ୍ନ 3 / 3', q3Head: 'ଏହି ବିଷୟ କେତେ ଜରୁରୀ?',
    submit: 'ଗୋପନୀୟ ଟ୍ରାଏଜ ଆରମ୍ଭ କରନ୍ତୁ →', nalsa: 'ବା NALSA · 15100 ରେ ଫୋନ କରନ୍ତୁ',
  },
};

interface AssessmentFormProps {
  selectedLang?: LangCode;
}

export default function AssessmentForm({ selectedLang = 'en-IN' }: AssessmentFormProps) {
  const router = useRouter();
  const [lang,     setLang]     = useState<LangCode>('hi-IN');
  const [persona,  setPersona]  = useState<PersonaSpec>(PERSONAS[0]);
  const [severity, setSeverity] = useState<1 | 2 | 3>(1);

  const copy = FORM_COPY[selectedLang] ?? FORM_COPY['en-IN']!;
  const isHindi = selectedLang === 'hi-IN';

  const fullSpeakText = `${copy.title}${copy.em} ${copy.desc}`;

  const begin = () => {
    sessionStorage.setItem('language', lang);
    sessionStorage.setItem('persona', persona.id);
    sessionStorage.setItem('intake_severity', String(severity));
    router.push(`/chat?lang=${lang}&persona=${persona.id}`);
  };

  return (
    <section
      id="assessment"
      className="py-20 sm:py-28 lg:py-36"
      style={{ background: 'linear-gradient(180deg, #F5F2EC 0%, #EDE9E0 100%)' }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">

          {/* LEFT — editorial intro */}
          <div className="lg:col-span-5 space-y-6 scroll-reveal">
            <div className="flex items-center gap-3">
              <span className="w-10 h-px bg-teal/50" />
              <span className="section-label" lang={selectedLang}>{copy.eyebrow}</span>
            </div>
            <div className="flex items-start gap-4">
              <h2 lang={selectedLang} className="font-serif font-bold text-4xl sm:text-5xl lg:text-[3.25rem] text-navy-deep leading-[1.06] tracking-tight flex-1">
                {copy.title}
                <em className="not-italic text-teal">{copy.em}</em>
              </h2>
              <div className="mt-1 shrink-0">
                <SpeakerButton text={fullSpeakText} language={selectedLang} variant="inline" />
              </div>
            </div>
            <p lang={selectedLang} className="text-lg text-secondary leading-relaxed">
              {copy.desc}
            </p>

            <ul className="space-y-4 pt-2">
              {copy.bullets.map((text) => (
                <li key={text} lang={selectedLang} className="flex items-start gap-3 text-sm text-secondary">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-teal shrink-0" />
                  {text}
                </li>
              ))}
            </ul>

            <div className="pt-4 border-t border-cool-gray">
              <div className="stat-counter text-4xl font-bold leading-none" style={{ color: '#B8962E' }}>90s</div>
              <div className="text-xs text-secondary mt-1 font-medium">average time to first document</div>
            </div>
          </div>

          {/* RIGHT — assessment card */}
          <div className="lg:col-span-7 scroll-reveal" style={{ transitionDelay: '80ms' }}>
            <div className="bg-white border border-cool-gray rounded-sm shadow-card overflow-hidden">

              {/* Gold + teal gradient top bar */}
              <div className="h-[3px]"
                   style={{ background: 'linear-gradient(90deg, #B8962E 0%, #5FA8A0 50%, #B8962E 100%)' }} />

              <div className="p-7 sm:p-10">

                {/* Q1 — Language */}
                <div className="authority-strip mb-2" lang={selectedLang}>{copy.q1Label}</div>
                <h3 lang={selectedLang} className="font-serif font-bold text-2xl text-navy-deep mb-5">
                  {copy.q1Head}
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-8">
                  {LANGUAGES.map((l) => {
                    const active = lang === l.code;
                    return (
                      <button
                        key={l.code}
                        onClick={() => setLang(l.code)}
                        lang={l.bcp47}
                        className={`px-3 py-2.5 border rounded-sm text-left transition-all duration-300
                          ${active
                            ? 'border-navy-deep shadow-sm'
                            : 'bg-white border-cool-gray hover:border-teal hover:bg-teal/5'}`}
                        style={active ? { background: '#0F1F3D' } : {}}
                      >
                        <div
                          className="font-serif text-base leading-none"
                          style={{ color: active ? '#ffffff' : '#0F1F3D' }}
                        >
                          {l.label}
                        </div>
                        <div
                          className="font-mono text-[9px] uppercase tracking-[0.2em] mt-0.5"
                          style={{ color: active ? 'rgba(255,255,255,0.7)' : '#A0AEC0' }}
                        >
                          {l.sublabel}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="hairline mb-8" />

                {/* Q2 — Persona */}
                <div className="authority-strip mb-2" lang={selectedLang}>{copy.q2Label}</div>
                <h3 lang={selectedLang} className="font-serif font-bold text-2xl text-navy-deep mb-5">
                  {copy.q2Head}
                </h3>
                <div className="grid sm:grid-cols-2 gap-2 mb-8">
                  {PERSONAS.map((p) => {
                    const active = persona.id === p.id;
                    const dotColor =
                      p.color === 'red'  ? '#D9534F' :
                      p.color === 'blue' ? '#5FA8A0' : '#B8962E';
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPersona(p)}
                        className={`flex items-center gap-3 px-4 py-3 border rounded-sm text-left
                                    transition-all duration-300
                          ${active
                            ? 'border-navy-deep shadow-sm'
                            : 'bg-white border-cool-gray hover:border-teal hover:bg-teal/5'}`}
                        style={active ? { background: '#0F1F3D' } : {}}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 flex-shrink-0"
                          style={{ background: active ? '#5FA8A0' : dotColor }}
                        />
                        <div className="min-w-0">
                          <div
                            className="font-semibold text-sm leading-none"
                            style={{ color: active ? '#ffffff' : '#0F1F3D' }}
                          >
                            {p.titleEn}
                          </div>
                          <div
                            className="font-mono text-[9px] uppercase tracking-[0.16em] mt-1"
                            style={{ color: active ? 'rgba(255,255,255,0.65)' : '#A0AEC0' }}
                          >
                            {p.statutes[0]}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="hairline mb-8" />

                {/* Q3 — Severity */}
                <div className="authority-strip mb-2" lang={selectedLang}>{copy.q3Label}</div>
                <h3 lang={selectedLang} className="font-serif font-bold text-2xl text-navy-deep mb-5">
                  {copy.q3Head}
                </h3>
                <div className="grid grid-cols-3 gap-2 mb-8">
                  {SEVERITY.map((s) => {
                    const active = severity === s.val;
                    return (
                      <button
                        key={s.val}
                        onClick={() => setSeverity(s.val as 1 | 2 | 3)}
                        className={`p-4 border rounded-sm text-left transition-all duration-300
                          ${active
                            ? 'text-white border-transparent shadow-sm'
                            : 'bg-white text-navy-deep border-cool-gray hover:border-teal hover:bg-teal/5'}`}
                        style={active ? { background: s.accent } : {}}
                      >
                        <div lang={selectedLang} className={`font-semibold uppercase text-xs tracking-[0.16em] ${active ? 'text-white' : 'text-navy-deep'}`}>
                          {isHindi ? s.labelHi : s.label}
                        </div>
                        <div lang={selectedLang} className={`text-[10px] font-medium mt-1 leading-snug ${active ? 'text-white/80' : 'text-secondary'}`}>
                          {isHindi ? s.bodyHi : s.body}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Submit */}
                <button
                  onClick={begin}
                  lang={selectedLang}
                  className="w-full py-4 rounded-sm font-semibold text-sm uppercase tracking-[0.18em]
                             transition-all duration-500 hover:shadow-md active:scale-[0.98]"
                  style={{ background: '#0F1F3D', color: '#ffffff' }}
                >
                  {copy.submit}
                </button>

                <p lang={selectedLang} className="text-center text-[11px] font-mono tracking-[0.16em] uppercase mt-5"
                   style={{ color: 'rgba(95,168,160,0.85)' }}>
                  {copy.nalsa.split('15100')[0]}
                  <a href="tel:15100" style={{ color: '#D9534F' }} className="hover:underline transition-colors">15100</a>
                  {copy.nalsa.split('15100')[1]}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
