# FirstReport — ANTIGRAVITY MASTER FIX PROMPT
### Version 2 — Bug Fixes + Accessibility + UX Enhancements

> **Read `DESIGN_SYSTEM.md` before starting.** All color tokens, typography, and
> component conventions are defined there and must be honoured throughout.
>
> **Critical constraint:** Do NOT modify any file in `app/api/` or `lib/`. All
> bugs are in UI layer only. Logic and backend routes stay untouched.

---

## PART 0 — LOGO / BRAND ASSET

### 0a. Create `components/FirstReportLogo.tsx` — Official SVG Logo

Create a brand-new file `components/FirstReportLogo.tsx`. This is a **vector SVG logo**
representing FirstReport's identity: voice-first legal protection for India.

**Design concept:** A shield shape (protection + law) with a sound-wave / mic motif inside
(voice-first), in the brand colors. Clean, professional, enterprise-grade.

```tsx
// components/FirstReportLogo.tsx
interface FirstReportLogoProps {
  size?: number;          // Controls the rendered height in px. Width = auto.
  variant?: 'icon' | 'wordmark' | 'full';
  // icon      = shield+wave SVG only
  // wordmark  = SVG icon + "FirstReport" text side-by-side  
  // full      = icon + "FirstReport" + tagline stacked
  theme?: 'light' | 'dark';
  // light = navy on off-white (default, for white bg)
  // dark  = off-white/teal on navy (for navy sidebar, dark panels)
  className?: string;
}
```

**SVG icon spec (the shield+wave):**
- **Outer shape:** Shield — a rounded-bottom pentagon (like `M 12 2 L 22 7 L 22 17 C 22 22 12 27 12 27 C 12 27 2 22 2 17 L 2 7 Z` scaled to viewBox="0 0 24 24")
- **Shield fill:** `#1A2A44` (navy) in light theme; `#F7F9FB` in dark theme
- **Inside the shield:** Three vertical sound-wave bars of different heights, centered
  - Left bar: `h=8`, width=2, rx=1
  - Center bar: `h=14`, width=2, rx=1 (tallest — dominant voice)
  - Right bar: `h=8`, width=2, rx=1
  - Wave bars fill: `#5FA8A0` (teal) in both themes
  - Bars are centered horizontally and vertically in the shield
- **No border/stroke** on the shield itself — fill only

**Wordmark text:**
- "FirstReport" in `font-family: 'Playfair Display', serif; font-weight: 700`
- Color: navy in light theme, off-white in dark theme
- Size: proportional to `size` prop (approximately `size * 0.35`px font-size)

**Example usage sites:**
1. `app/(app)/layout.tsx` — sidebar header, `variant="icon" size={32} theme="dark"`
2. `app/(app)/layout.tsx` — top header bar, `variant="wordmark" size={36} theme="light"`
3. `components/AgentAvatar.tsx` — replaces the big letter "S" in the preview box, `variant="icon" size={120} theme="light"`
4. `app/(auth)/login/page.tsx` — left panel, `variant="full" size={56} theme="dark"`
5. `components/landing/LuxuryNav.tsx` — nav brand slot, `variant="wordmark" size={40} theme="light"`

---

### 0b. Update `components/AgentAvatar.tsx` — Replace letter "S" with Logo

The large "S" (or whatever persona initial) shown in the home page right panel must be
replaced with the FirstReport logo. The AgentAvatar's primary non-compact display should show:

```tsx
// In the non-compact return (the big square figure panel):
// Replace the big serif initial letter div with:
<div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-off-white">
  <FirstReportLogo variant="icon" size={size * 0.45} theme="light" />
  {/* Speaking animation ring */}
  {speaking && (
    <div className="absolute inset-4 rounded-full border-2 border-teal/40 animate-pulse" />
  )}
</div>
```

Keep the `Fig. X.X` caption tag and the `LIVE` pip — they're fine.

**Compact variant** (chat header): Replace the letter with a small shield icon:
```tsx
<FirstReportLogo variant="icon" size={28} theme="light" />
```

---

## PART 1 — CRITICAL BUGS

### Bug 1: Invisible Text on Selected Tiles/Cards

**Root cause:** When language tiles or persona cards enter selected state, the background
flips to navy (`bg-navy` / `bg-ink`), but child text elements still inherit or explicitly
set `text-ink` (dark) — making text invisible on the dark background.

**Files affected:** `components/LanguageTile.tsx`, `components/PersonaCard.tsx`,
`components/landing/AssessmentForm.tsx`

**Fix for `components/LanguageTile.tsx`:**
The selected state must force ALL text children to be white. Replace the conditional
className pattern with a CSS variable approach or explicit child overrides:

```tsx
// In LanguageTile, the button's selected state:
className={`
  group relative flex flex-col justify-between
  h-28 sm:h-32 px-3 py-3 border rounded-sm
  transition-all duration-200 ease-out select-none
  ${selected
    ? 'bg-navy text-white border-navy shadow-md'
    : 'bg-white text-navy border-cool-gray hover:border-teal hover:shadow-sm'}
`}

// The ISO code span inside — must NOT have hardcoded muted color when selected:
<span className={`font-mono text-[10px] tracking-[0.28em] uppercase
  ${selected ? 'text-white/70' : 'text-secondary'}`}>
  {lang.code}
</span>

// The native script div — ensure it inherits:
<div className="font-serif text-2xl leading-none tracking-tightest truncate">
  {lang.label}
</div>

// The sublabel:
<div className={`font-mono text-[10px] tracking-[0.28em] uppercase mt-1.5
  ${selected ? 'text-white/70' : 'text-secondary'}`}>
  {lang.sublabel}
</div>

// Add teal accent indicator only when selected:
{selected && <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-teal" />}
```

**Fix for `components/PersonaCard.tsx`:**
Same pattern — all child text must resolve to `text-white` or `text-white/80` etc when selected:

```tsx
// Card base:
className={`
  group relative w-full text-left p-5 sm:p-6 border rounded-md
  transition-all duration-200 ease-out
  ${selected
    ? 'bg-navy text-white border-navy shadow-md'
    : 'bg-white text-navy border-cool-gray hover:border-teal hover:shadow-md'}
`}

// Section label:
<span className={`font-mono text-[10px] tracking-[0.28em] uppercase
  ${selected ? 'text-white/60' : 'text-secondary'}`}>
  Section · {personaSectionLabel(persona.id)}
</span>

// Serif heading — inherits color from parent (good):
<h3 className="font-serif font-bold text-3xl leading-[0.95] tracking-tight mb-2">
  {title}
</h3>

// Byline:
<div className={`font-mono text-[10px] tracking-[0.28em] uppercase mb-4
  ${selected ? 'text-white/60' : 'text-secondary'}`}>
  ...
</div>

// Lede paragraph:
<p className={`font-sans text-sm leading-relaxed
  ${selected ? 'text-white/85' : 'text-secondary'}`}>
  {sub}
</p>

// Divider:
<div className={`my-4 h-px ${selected ? 'bg-white/15' : 'bg-cool-gray'}`} />

// Statute pills:
{persona.statutes.slice(0, 3).map((s) => (
  <span key={s} className={`font-mono text-[10px] tracking-[0.22em] uppercase pb-0.5 border-b
    ${selected ? 'border-teal text-teal' : 'border-teal/40 text-secondary'}`}>
    {s}
  </span>
))}
```

**Fix for `components/landing/AssessmentForm.tsx`:**
The language buttons in the triage form use `bg-forest text-paper` when selected. `bg-forest`
maps to `#111111` (old ink) — update to `bg-navy text-white`. Similarly:
- `bg-oxblood text-paper` → `bg-error text-white`
- `bg-cognac text-paper` → `bg-secondary text-white`
- `hover:bg-cream` → `hover:bg-off-white`
- Ensure sublabel inside selected state has `text-white/75` not `text-espresso/60`

---

### Bug 2: TTS/Voice Continues Speaking After Page Navigation

**Root cause:** `SpeakerButton` has audio playing via `new Audio()` or `speechSynthesis`.
When Next.js navigates to a new page, the component unmounts but the audio object continues
playing (it's not tied to React's lifecycle). The `useEffect` cleanup only cancels when
the component unmounts due to React re-renders, but fast navigations can leave dangling audio.

**File affected:** `components/SpeakerButton.tsx`, `lib/tts.ts`

**Fix — Create a global audio singleton `lib/audioManager.ts`:**

```typescript
// lib/audioManager.ts
// Global singleton that tracks ALL playing audio. Any page transition calls stopAll().

let currentAudio: HTMLAudioElement | null = null;
let speechUtterance: SpeechSynthesisUtterance | null = null;

export const audioManager = {
  setAudio(audio: HTMLAudioElement) {
    // Stop any previously playing audio before setting new one
    this.stopAll();
    currentAudio = audio;
  },
  setSpeech(utterance: SpeechSynthesisUtterance) {
    speechUtterance = utterance;
  },
  stopAll() {
    if (currentAudio) {
      try { currentAudio.pause(); currentAudio.currentTime = 0; } catch { /* noop */ }
      currentAudio = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch { /* noop */ }
    }
    speechUtterance = null;
  },
};
```

**Fix — Update `components/SpeakerButton.tsx`:**
Import `audioManager` and use it:

```typescript
import { audioManager } from '@/lib/audioManager';

// In the speak function, replace:
//   const audio = new Audio(URL.createObjectURL(blob));
//   cancelRef.current = () => { audio.pause(); audio.currentTime = 0; };
//   await audio.play();
// With:
const audio = new Audio(URL.createObjectURL(blob));
audioManager.setAudio(audio);          // registers globally
cancelRef.current = () => { audioManager.stopAll(); };
audio.onended = () => { setIsSpeaking(false); cancelRef.current = null; };
audio.onerror = () => fallback();
await audio.play();
```

**Fix — Add route change listener in `app/(app)/layout.tsx`:**
Use Next.js `usePathname()` to detect route changes and stop audio:

```tsx
import { usePathname } from 'next/navigation';
import { audioManager } from '@/lib/audioManager';

// Inside AppLayout component:
const pathname = usePathname();
useEffect(() => {
  // Stop all audio on every route change
  audioManager.stopAll();
}, [pathname]);
```

Also update `lib/tts.ts` `speakWithBrowser` to register the utterance:
```typescript
import { audioManager } from '@/lib/audioManager';
// After creating utterance:
audioManager.setSpeech(utterance);
```

---

### Bug 3: Language Tiles Truncate Native Script Text ("हि...", "E...", "বাং...")

**Root cause:** LanguageTile tiles are too narrow and the native script overflows. The
`truncate` class cuts it off. Tiles need to be bigger or use text wrapping.

**File:** `components/LanguageTile.tsx`

**Fix:**
- Increase tile height from `h-28` to `h-32`
- Reduce `font-size` of native script from `text-3xl` to `text-2xl` on small screens
- Remove `truncate` class — replace with `overflow-hidden` + `leading-tight`
- Use `line-clamp-2` if needed for longer scripts

```tsx
// Native script display:
<div className="font-serif text-xl sm:text-2xl leading-tight tracking-tightest overflow-hidden max-h-14">
  {lang.label}
</div>
```

**Also add a tooltip** (`title={lang.sublabel}`) on the button for accessibility.

---

### Bug 4: Landing Page "Languages" Dropdown Closes Immediately / Transparent Background

**Root cause:** `LuxuryNav.tsx` uses `onMouseEnter/onMouseLeave` for the Languages dropdown.
The dropdown `div` has no solid background in some themes — it uses `bauhaus-card` which
inherits paper/ivory with no opacity. Additionally, the z-index stacking may let clicks
through.

**File:** `components/landing/LuxuryNav.tsx`

**Fix — Switch to click-based with outside-click dismiss (like LanguageSwitcher):**

```tsx
import { useState, useRef, useEffect } from 'react';

// Replace hover handlers with:
const [langOpen, setLangOpen] = useState(false);
const langRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const handler = (e: MouseEvent) => {
    if (!langRef.current?.contains(e.target as Node)) setLangOpen(false);
  };
  document.addEventListener('mousedown', handler);
  return () => document.removeEventListener('mousedown', handler);
}, []);

// In JSX: replace the hover div with:
<div ref={langRef} className="relative">
  <button
    onClick={() => setLangOpen(v => !v)}
    className="text-navy/80 hover:text-navy transition-colors flex items-center gap-1.5
               font-semibold text-sm"
  >
    Languages
    <svg className={`w-3 h-3 transition-transform ${langOpen ? 'rotate-180' : ''}`}
         fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  {langOpen && (
    <>
      {/* Solid backdrop — NOT transparent */}
      <div
        className="fixed inset-0 z-40"
        onClick={() => setLangOpen(false)}
      />
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 z-50
                      bg-white border border-cool-gray rounded-lg shadow-xl
                      w-96 p-5 animate-pop-in">
        <div className="section-label mb-4 text-secondary">
          Available in 11 languages — click to start
        </div>
        <ul className="grid grid-cols-3 gap-2">
          {LANGUAGES.map((l) => (
            <li key={l.code}>
              <Link
                href={`/home?lang=${l.code}`}
                lang={l.bcp47}
                onClick={() => setLangOpen(false)}
                className="block px-3 py-2.5 border border-cool-gray rounded-sm
                           hover:border-teal hover:bg-teal/5 transition-colors group"
              >
                <div className="font-serif text-lg leading-none text-navy group-hover:text-teal transition-colors">
                  {l.label}
                </div>
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] mt-1 text-secondary">
                  {l.sublabel}
                </div>
              </Link>
            </li>
          ))}
        </ul>
        {/* Speaker: read all language names aloud */}
        <div className="mt-3 pt-3 border-t border-cool-gray flex items-center justify-between">
          <span className="text-xs text-secondary">Tap any language to start in that language</span>
          <SpeakerButton
            text="Available in eleven languages: Hindi, English, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia"
            language="en-IN"
            variant="mini"
          />
        </div>
      </div>
    </>
  )}
</div>
```

---

### Bug 5: Language Switch Doesn't Translate UI Beyond Hindi/English

**Root cause:** The `t()` function in `lib/i18n.ts` is the translation dispatcher. If
translation strings are missing for a language, it falls back to English. The UI shows
Hindi/English correctly because those have full translation tables, but other languages
may have gaps.

**Do not modify `lib/i18n.ts`** directly (it's in `lib/`). 

**Fix — Ensure every component correctly passes `lang` prop to `t()` and uses `lang={}` attribute:**

In every page and component, verify these patterns:
- All button/heading text that should be translated uses `{t('key', lang)}` not hardcoded strings
- Every container element with native text has `lang={language}` attribute so browsers pick the right font

**Specific audit — check these hardcoded strings and replace with `t()` calls:**

In `app/(app)/home/page.tsx`:
```tsx
// These must use t():
// "VOICE-FIRST LEGAL AID"    → t('voiceFirst', lang)
// Step labels "1", "2"       → fine as numbers
// "FIG. 1.1" caption         → fine (product internal)
// "Standard", "LIVE"        → fine (technical labels)
```

In `app/(app)/classify/page.tsx`:
```tsx
// "YOU SAID"            → t('youSaid', lang)   (add key to t())
// "COGNIZABLE OFFENCE"  → use classification data from API (already translated by backend)
// "PUNISHMENT"          → t('punishment', lang) (add key)
// "Complex matter"      → t('complexMatter', lang)
// "Generate documents"  → t('generateDocuments', lang)
// "Retry interview"     → t('retry', lang)
```

**Note:** The backend `/api/classify` already returns `offense_name_hindi` and 
`rationale_hindi` — these are already in the correct language from the API response. 
The UI labels around them just need to be translated.

**Add missing `t()` keys** — add these to the translations object in `lib/i18n.ts`:
Actually since `lib/` is locked, work around this by creating a small
`lib/ui-strings.ts` that covers only the UI label strings for all 11 languages,
which you CAN create as a new file:

```typescript
// lib/ui-strings.ts  (NEW FILE — safe to create)
export type UIStringKey = 
  | 'youSaid' | 'generating' | 'retry' | 'generateDocuments'
  | 'cognizable' | 'nonCognizable' | 'punishment' | 'complexMatter'
  | 'settingsTitle' | 'profileName' | 'profileSave' | 'voiceSettings'
  | 'selectMic' | 'autoSpeak' | 'autoSpeakDesc' | 'offlineVoice'
  | 'languagePref' | 'aboutApp' | 'version' | 'legalNotice';

export const UI_STRINGS: Record<UIStringKey, Record<string, string>> = {
  youSaid: {
    'hi-IN': 'आपने कहा',      'en-IN': 'You said',        'bn-IN': 'আপনি বললেন',
    'ta-IN': 'நீங்கள் கூறினீர்கள்', 'te-IN': 'మీరు చెప్పారు', 'mr-IN': 'तुम्ही म्हणालात',
    'gu-IN': 'તમે કહ્યું',   'kn-IN': 'ನೀವು ಹೇಳಿದ್ದು',  'ml-IN': 'നിങ്ങൾ പറഞ്ഞത്',
    'pa-IN': 'ਤੁਸੀਂ ਕਿਹਾ',   'od-IN': 'ଆପଣ କହିଲେ',
  },
  generating: {
    'hi-IN': 'दस्तावेज़ तैयार हो रहे हैं…', 'en-IN': 'Preparing documents…',
    'bn-IN': 'নথি প্রস্তুত হচ্ছে…',           'ta-IN': 'ஆவணங்கள் தயாரிக்கப்படுகின்றன…',
    'te-IN': 'పత్రాలు సిద్ధమవుతున్నాయి…',  'mr-IN': 'कागदपत्रे तयार होत आहेत…',
    'gu-IN': 'દસ્તાવેજો તૈયાર થઈ રહ્યા છે…', 'kn-IN': 'ದಾಖಲೆಗಳು ತಯಾರಾಗುತ್ತಿವೆ…',
    'ml-IN': 'രേഖകൾ തയ്യാറാകുന്നു…',         'pa-IN': 'ਦਸਤਾਵੇਜ਼ ਤਿਆਰ ਹੋ ਰਹੇ ਹਨ…',
    'od-IN': 'ଦଲିଲ ପ୍ରସ୍ତୁତ ହୋଇ ରହିଛି…',
  },
  retry: {
    'hi-IN': 'दोबारा कोशिश करें', 'en-IN': 'Retry',         'bn-IN': 'আবার চেষ্টা করুন',
    'ta-IN': 'மீண்டும் முயற்சி',  'te-IN': 'మళ్ళీ ప్రయత్నించు', 'mr-IN': 'पुन्हा प्रयत्न करा',
    'gu-IN': 'ફરી પ્રયાસ',       'kn-IN': 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ', 'ml-IN': 'വീണ്ടും ശ്രമിക്കുക',
    'pa-IN': 'ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼',   'od-IN': 'ପୁନଃ ଚେଷ୍ଟା',
  },
  generateDocuments: {
    'hi-IN': 'दस्तावेज़ बनाएं',    'en-IN': 'Generate Documents', 'bn-IN': 'নথি তৈরি করুন',
    'ta-IN': 'ஆவணங்கள் உருவாக்கு', 'te-IN': 'పత్రాలు రూపొందించు',   'mr-IN': 'कागदपत्रे तयार करा',
    'gu-IN': 'દસ્તાવેજ બનાવો',    'kn-IN': 'ದಾಖಲೆಗಳನ್ನು ತಯಾರಿಸಿ', 'ml-IN': 'രേഖകൾ തൈയ്യാറാക്കുക',
    'pa-IN': 'ਦਸਤਾਵੇਜ਼ ਬਣਾਓ',     'od-IN': 'ଦଲିଲ ତିଆରି କରନ୍ତୁ',
  },
  settingsTitle: {
    'hi-IN': 'सेटिंग्स',   'en-IN': 'Settings',   'bn-IN': 'সেটিংস',
    'ta-IN': 'அமைப்புகள்', 'te-IN': 'సెట్టింగులు', 'mr-IN': 'सेटिंग्ज',
    'gu-IN': 'સેટિંગ્સ',   'kn-IN': 'ಸೆಟ್ಟಿಂಗ್ಗಳು', 'ml-IN': 'ക്രമീകരണങ്ങൾ',
    'pa-IN': 'ਸੈਟਿੰਗਾਂ',   'od-IN': 'ସଂରଚନା',
  },
  autoSpeak: {
    'hi-IN': 'ऑटो बोलना',    'en-IN': 'Auto-Speak',    'bn-IN': 'স্বয়ংক্রিয় বক্তৃতা',
    'ta-IN': 'தானாக பேசு',   'te-IN': 'ఆటో స్పీక్',    'mr-IN': 'ऑटो-बोलणे',
    'gu-IN': 'ઓટો-બોલો',    'kn-IN': 'ಸ್ವಯಂ ಮಾತು',    'ml-IN': 'ഓട്ടോ-സ്പീക്ക്',
    'pa-IN': 'ਆਟੋ-ਬੋਲੋ',    'od-IN': 'ଅଟୋ-ଭାଷଣ',
  },
  voiceSettings: {
    'hi-IN': 'आवाज़ सेटिंग्स', 'en-IN': 'Voice Settings', 'bn-IN': 'কণ্ঠ সেটিংস',
    'ta-IN': 'குரல் அமைப்பு',   'te-IN': 'వాయిస్ సెట్టింగ్', 'mr-IN': 'आवाज सेटिंग्ज',
    'gu-IN': 'અવાજ સેટિંગ્સ',  'kn-IN': 'ಧ್ವನಿ ಸೆಟ್ಟಿಂಗ್', 'ml-IN': 'ശബ്ദ ക്രമീകരണം',
    'pa-IN': 'ਆਵਾਜ਼ ਸੈਟਿੰਗਾਂ', 'od-IN': 'ସ୍ୱର ସଂରଚନା',
  },
  languagePref: {
    'hi-IN': 'भाषा प्राथमिकता', 'en-IN': 'Language Preference', 'bn-IN': 'ভাষা পছন্দ',
    'ta-IN': 'மொழி விருப்பம்',   'te-IN': 'భాష ప్రాధాన్యత',     'mr-IN': 'भाषा प्राधान्य',
    'gu-IN': 'ભાષા પ્રાથમિકતા', 'kn-IN': 'ಭಾಷೆ ಆದ್ಯತೆ',        'ml-IN': 'ഭാഷ മുൻഗണന',
    'pa-IN': 'ਭਾਸ਼ਾ ਤਰਜੀਹ',     'od-IN': 'ଭାଷା ପ୍ରାଧାନ୍ୟ',
  },
  // add more as needed...
};

export function uiStr(key: UIStringKey, lang: string): string {
  return UI_STRINGS[key]?.[lang] ?? UI_STRINGS[key]?.['en-IN'] ?? key;
}
```

Use `uiStr()` in any page/component where `t()` doesn't have the key.

---

## PART 2 — UX / ACCESSIBILITY FIXES

### Fix 6: Speaker Button on Every UI Element

**Requirement:** Every text element must have a speaker icon so an illiterate user can
hear what it says. This includes: language tiles, persona cards, section headings, all
buttons, classification results, document cards, history entries, and navigation items.

**Implementation approach — create a `TtsLabel` wrapper component:**

```tsx
// components/TtsLabel.tsx  (NEW FILE)
'use client';
import SpeakerButton from './SpeakerButton';
import type { LangCode } from '@/lib/i18n';

interface TtsLabelProps {
  text: string;
  language: LangCode | string;
  children: React.ReactNode;
  persona?: string;
  className?: string;
}

/**
 * Wraps any text element with an inline speaker icon that appears on hover.
 * The speaker reads out `text` in `language` using TTS.
 * For illiterate users — every meaningful UI element should be wrapped in this.
 */
export default function TtsLabel({ text, language, children, persona = 'standard', className }: TtsLabelProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 group ${className ?? ''}`}>
      {children}
      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
        <SpeakerButton text={text} language={language} persona={persona as never} variant="mini" />
      </span>
    </span>
  );
}
```

**Apply TtsLabel in these specific locations:**

1. **`components/LanguageTile.tsx`** — Add a speaker that reads the language name in that language:
```tsx
// Inside the tile, at the bottom, always visible (not just on hover) for language tiles:
<div className="absolute bottom-1.5 right-1.5">
  <SpeakerButton
    text={`${lang.sublabel}. ${lang.label}`}
    language={lang.code}
    variant="mini"
  />
</div>
```
Make the tile `relative` and `overflow-visible`.

2. **`components/PersonaCard.tsx`** — Speaker reads the full persona description:
```tsx
// In the footer of the card:
<div className="mt-3 flex justify-end">
  <SpeakerButton text={`${title}. ${sub}`} language={lang} variant="mini" />
</div>
```

3. **`app/(app)/home/page.tsx`** — Step headings:
```tsx
// Wrap step labels:
<TtsLabel text={t('selectLanguage', lang)} language={lang}>
  <h2 ...>{t('selectLanguage', lang)}</h2>
</TtsLabel>
```

4. **`app/(app)/classify/page.tsx`** — Every field in the result card:
The page already has a floating SpeakerButton for the full page text. That's good.
But also add per-section speakers:
```tsx
// Above the classification heading:
<TtsLabel text={classification?.offense_name_hindi} language={language}>
  <h2 ...>{classification?.offense_name_hindi}</h2>
</TtsLabel>
```

5. **`app/(app)/documents/page.tsx`** — Document card descriptions (already has SpeakerButton in DocumentCard).

6. **Landing page language tiles** — `components/landing/AssessmentForm.tsx`:
Add a speaker to each language button so clicking it reads the language name.

---

### Fix 7: Confidential Triage — Make It a Dropdown Accordion

**Requirement:** The "Confidential Triage" section on the landing page should work as a
sticky dropdown triggered by the "Begin Assessment →" button in the nav. Currently it
just scrolls to an anchor. The triage form should appear as a modal or slide-down panel.

**File:** `components/landing/AssessmentForm.tsx`, `components/landing/LuxuryNav.tsx`

**Approach — Convert to a floating modal:**

In `components/landing/AssessmentForm.tsx`, wrap the entire form in a modal pattern
that can be opened/closed. Export a trigger component as well:

```tsx
// Export: AssessmentModal (triggered by a button) + useAssessmentModal hook
// The section still exists in the page for SEO, but also renders as a modal when triggered

// Add useState for modal to the landing page, or use a portal
// The "Begin Assessment →" nav button opens the modal

// The form card gets:
// - max-w-2xl mx-auto (not full-width)
// - max-h-[90vh] overflow-y-auto
// - rounded-xl shadow-2xl
// - Smooth slide-down animation
// - Close button (X) in top-right
// - All three questions stacked vertically and scrollable
// - Sticky "Begin →" CTA at bottom

// Add to LuxuryNav: onClick on "Begin Assessment" opens the modal
// Pass setAssessmentOpen down or use a React context
```

**Simpler approach (no context):** Use `window.dispatchEvent` for cross-component comms:

```tsx
// In LuxuryNav, the CTA button:
<button onClick={() => window.dispatchEvent(new CustomEvent('open-assessment'))}>
  Begin Assessment →
</button>

// In AssessmentForm, add:
useEffect(() => {
  const handler = () => setOpen(true);
  window.addEventListener('open-assessment', handler);
  return () => window.removeEventListener('open-assessment', handler);
}, []);
```

The modal overlay should be `fixed inset-0 z-[100] bg-navy/60 backdrop-blur-sm` with the
form card centered using `flex items-center justify-center`.

---

### Fix 8: Settings Page / Drawer

**Requirement:** Clicking the settings gear icon at the bottom of the sidebar should open
a settings drawer with: profile details, language preference, voice/mic settings, TTS
auto-play toggle, about app info.

**Create `components/SettingsDrawer.tsx`:**

```tsx
// components/SettingsDrawer.tsx  (NEW FILE)
'use client';

import { useState, useEffect } from 'react';
import { LANGUAGES, type LangCode } from '@/lib/i18n';
import { uiStr } from '@/lib/ui-strings';
import SpeakerButton from './SpeakerButton';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  currentLang: LangCode;
  onLangChange: (lang: LangCode) => void;
}

export default function SettingsDrawer({ open, onClose, currentLang, onLangChange }: SettingsDrawerProps) {
  const [name, setName] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [offlineVoice, setOfflineVoice] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    setName(localStorage.getItem('fr_user_name') ?? '');
    setAutoSpeak(localStorage.getItem('fr_auto_speak') !== 'false');
    setOfflineVoice(localStorage.getItem('fr_offline_voice') !== 'false');
  }, []);

  const save = () => {
    localStorage.setItem('fr_user_name', name);
    localStorage.setItem('fr_auto_speak', String(autoSpeak));
    localStorage.setItem('fr_offline_voice', String(offlineVoice));
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[80] bg-navy/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-[90] w-full max-w-sm bg-white shadow-xl
                    transform transition-transform duration-300 ease-in-out overflow-y-auto
                    ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-cool-gray px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-serif font-bold text-xl text-navy">
              {uiStr('settingsTitle', currentLang)}
            </h2>
            <SpeakerButton text={uiStr('settingsTitle', currentLang)} language={currentLang} variant="mini" />
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded text-secondary hover:text-navy transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* PROFILE SECTION */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-navy text-sm uppercase tracking-wide">Profile</h3>
              <SpeakerButton text="Profile settings" language={currentLang} variant="mini" />
            </div>
            {/* Name field */}
            <div className="space-y-2">
              <label className="section-label block">Your Name (optional)</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="fr-input flex-1 px-3 py-2.5 text-sm"
                />
                <SpeakerButton text="Enter your name here. This is optional." language={currentLang} variant="mini" />
              </div>
            </div>
            {/* Mic test */}
            <div className="mt-4 p-4 bg-off-white rounded-md border border-cool-gray">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-navy">Test Microphone</div>
                  <div className="text-xs text-secondary mt-0.5">Hold to speak, release to test</div>
                </div>
                <SpeakerButton text="Test your microphone. Hold the mic button and speak to test." language={currentLang} variant="mini" />
              </div>
            </div>
          </section>

          {/* LANGUAGE SECTION */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-navy text-sm uppercase tracking-wide">
                {uiStr('languagePref', currentLang)}
              </h3>
              <SpeakerButton text={uiStr('languagePref', currentLang)} language={currentLang} variant="mini" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => onLangChange(l.code)}
                  lang={l.bcp47}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-sm border text-left transition-colors
                    ${currentLang === l.code
                      ? 'bg-navy text-white border-navy'
                      : 'bg-white text-navy border-cool-gray hover:border-teal'}`}
                >
                  <span className="font-serif text-lg leading-none">{l.label}</span>
                  <span className={`font-mono text-[9px] uppercase tracking-widest
                    ${currentLang === l.code ? 'text-white/70' : 'text-secondary'}`}>
                    {l.sublabel}
                  </span>
                  <SpeakerButton text={l.sublabel} language={l.code} variant="mini" />
                </button>
              ))}
            </div>
          </section>

          {/* VOICE SETTINGS */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-navy text-sm uppercase tracking-wide">
                {uiStr('voiceSettings', currentLang)}
              </h3>
              <SpeakerButton text={uiStr('voiceSettings', currentLang)} language={currentLang} variant="mini" />
            </div>
            <div className="space-y-4">
              {/* Auto-speak toggle */}
              <div className="flex items-center justify-between p-4 bg-off-white rounded-md border border-cool-gray">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-navy">{uiStr('autoSpeak', currentLang)}</span>
                    <SpeakerButton text={uiStr('autoSpeak', currentLang)} language={currentLang} variant="mini" />
                  </div>
                  <p className="text-xs text-secondary mt-0.5">
                    AI responses are read aloud automatically
                  </p>
                </div>
                <button
                  onClick={() => setAutoSpeak(v => !v)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${autoSpeak ? 'bg-teal' : 'bg-cool-gray'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${autoSpeak ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Offline voice toggle */}
              <div className="flex items-center justify-between p-4 bg-off-white rounded-md border border-cool-gray">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-navy">Offline Voice Fallback</span>
                    <SpeakerButton text="Use device voice when internet is unavailable" language={currentLang} variant="mini" />
                  </div>
                  <p className="text-xs text-secondary mt-0.5">
                    Use device voice when internet is unavailable
                  </p>
                </div>
                <button
                  onClick={() => setOfflineVoice(v => !v)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${offlineVoice ? 'bg-teal' : 'bg-cool-gray'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${offlineVoice ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          </section>

          {/* ABOUT */}
          <section className="pt-4 border-t border-cool-gray">
            <div className="text-center space-y-1">
              <div className="font-serif font-bold text-navy text-lg">FirstReport</div>
              <div className="section-label">Version 1.0 · Gemma 4 · Sarvam AI</div>
              <div className="text-xs text-secondary">BNSS 2023 · POCSO · PWDVA · MWPSC</div>
              <div className="text-xs text-secondary mt-2">
                AI legal aid — not a substitute for a licensed lawyer.
              </div>
              <a href="tel:15100" className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-error/10 text-error rounded font-semibold text-sm hover:bg-error hover:text-white transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-error animate-rec" />
                NALSA Helpline · 15100
              </a>
            </div>
          </section>

          {/* SAVE */}
          <button onClick={save} className="fr-btn-primary w-full py-3 font-semibold text-sm">
            Save Settings
          </button>
        </div>
      </aside>
    </>
  );
}
```

**Wire the settings drawer into `app/(app)/layout.tsx`:**

```tsx
// In AppLayout:
import SettingsDrawer from '@/components/SettingsDrawer';
const [settingsOpen, setSettingsOpen] = useState(false);
const [lang, setLang] = useState<LangCode>('hi-IN');

// Load saved lang on mount:
useEffect(() => {
  const saved = localStorage.getItem('fr_user_lang') as LangCode;
  if (saved) setLang(saved);
}, []);

// Save on change:
const handleLangChange = (next: LangCode) => {
  setLang(next);
  localStorage.setItem('fr_user_lang', next);
};

// In sidebar bottom section, make settings button work:
<button onClick={() => setSettingsOpen(true)} ...>
  ⚙ Settings
</button>

// After sidebar:
<SettingsDrawer
  open={settingsOpen}
  onClose={() => setSettingsOpen(false)}
  currentLang={lang}
  onLangChange={handleLangChange}
/>
```

---

### Fix 9: Language Switcher in Main Navigation Bar

**Requirement:** The language switcher must appear in the top header bar of the shell,
not just in individual page headers. Each page's own language switcher can remain for
in-session switching, but the shell should also expose it.

**File:** `app/(app)/layout.tsx`

In the header, between the logo area and the NALSA button, add the `LanguageSwitcher`:

```tsx
import LanguageSwitcher from '@/components/LanguageSwitcher';

// In header JSX, between logo and NALSA:
<div className="flex-1" />
<LanguageSwitcher current={lang} onChange={handleLangChange} compact />
<a href="tel:15100" ...>NALSA · 15100</a>
```

The `LanguageSwitcher` component styling must be updated to use the new design tokens
(not bauhaus classes). Update `components/LanguageSwitcher.tsx`:

```tsx
// Button:
className={`
  ${compact ? 'h-9 px-2.5 gap-1.5' : 'h-9 px-3 gap-2'}
  flex items-center bg-off-white border border-cool-gray rounded-sm
  font-semibold text-sm text-navy
  hover:border-teal hover:bg-teal/5 transition-colors
`}

// Dropdown panel:
className="absolute right-0 top-full mt-2 z-50 bg-white border border-cool-gray rounded-lg shadow-xl
           w-64 max-h-[70vh] overflow-y-auto animate-pop-in"

// Header row:
className="px-3 py-2.5 border-b border-cool-gray bg-off-white"
<span className="section-label">{t('changeLanguage', current)}</span>

// Active item:
className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 border-b border-cool-gray/40
  ${active ? 'bg-navy text-white' : 'text-navy hover:bg-off-white'} transition-colors`}
// Active sublabel:
<span className={`text-[10px] font-bold uppercase tracking-widest
  ${active ? 'text-white/70' : 'text-secondary'}`}>
```

Also add a SpeakerButton inside the dropdown for each language so users can hear the name:
```tsx
// Inside each li button:
<SpeakerButton text={l.sublabel} language={l.code} variant="mini" />
```

---

### Fix 10: Sidebar Navigation Design Improvement

**File:** `app/(app)/layout.tsx`

Replace Unicode icon characters (⊙, ◎, etc.) with proper SVG icons. Create proper
navigation with better visual design:

```tsx
const NAV_ITEMS = [
  {
    href: '/home',
    label: 'Home',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/chat',
    label: 'New Report',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    href: '/classify',
    label: 'Classification',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    href: '/documents',
    label: 'Documents',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: '/history',
    label: 'History',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

// Settings icon at bottom:
const settingsIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
```

**Sidebar visual design improvements:**

```tsx
// Sidebar base:
<aside className={`
  fixed top-16 left-0 bottom-0 z-40 bg-[#142038] flex flex-col
  transition-all duration-250 ease-in-out
  ${sidebarOpen ? 'w-56' : 'w-0 md:w-[60px]'}
  border-r border-white/5
`}>
  {/* Top section — logo when open */}
  {sidebarOpen && (
    <div className="px-4 py-4 border-b border-white/10">
      <div className="text-white/40 text-[10px] uppercase tracking-widest font-mono">Navigation</div>
    </div>
  )}

  {/* Nav items */}
  <nav className="flex-1 py-3 overflow-hidden">
    {NAV_ITEMS.map((item) => {
      const isActive = pathname.startsWith(item.href);
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setSidebarOpen(false)}
          title={item.label}
          className={`
            flex items-center gap-3 mx-2 px-3 py-2.5 rounded-md mb-0.5 group
            transition-all duration-150 whitespace-nowrap
            ${isActive
              ? 'bg-teal/15 text-white border-l-2 border-teal ml-[6px] pl-[10px]'
              : 'text-white/55 hover:text-white hover:bg-white/8'}
          `}
        >
          <span className="shrink-0">{item.icon}</span>
          <span className={`text-sm font-medium transition-all duration-200 overflow-hidden
            ${sidebarOpen ? 'opacity-100 max-w-[140px]' : 'opacity-0 max-w-0'}`}>
            {item.label}
          </span>
        </Link>
      );
    })}
  </nav>

  {/* Bottom — settings */}
  <div className="px-2 py-3 border-t border-white/10">
    <button
      onClick={() => setSettingsOpen(true)}
      title="Settings"
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md
                 text-white/45 hover:text-white hover:bg-white/8 transition-all"
    >
      <span className="shrink-0">{settingsIcon}</span>
      <span className={`text-sm font-medium transition-all duration-200 overflow-hidden
        ${sidebarOpen ? 'opacity-100 max-w-[140px]' : 'opacity-0 max-w-0'}`}>
        Settings
      </span>
    </button>
  </div>
</aside>
```

---

## PART 3 — OFFLINE TTS / BROWSER VOICE FALLBACK

### Fix 11: Offline Speaker Fallback for All 11 Languages

**Requirement:** When there's no internet, the SpeakerButton must still speak using
the browser's Web Speech API. The `speakWithBrowser` function in `lib/tts.ts` already
does this as a fallback — but it needs to pick the correct voice for each Indian language.

**Create `lib/speechVoices.ts`:** (new file — does not modify `lib/tts.ts`)

```typescript
// lib/speechVoices.ts (NEW FILE)
// Maps LangCode to Web Speech API language codes for Indian voice synthesis.

export const SPEECH_VOICE_MAP: Record<string, string[]> = {
  'hi-IN': ['hi-IN', 'hi'],
  'en-IN': ['en-IN', 'en-GB', 'en-US'],
  'bn-IN': ['bn-IN', 'bn'],
  'ta-IN': ['ta-IN', 'ta'],
  'te-IN': ['te-IN', 'te'],
  'mr-IN': ['mr-IN', 'mr'],
  'gu-IN': ['gu-IN', 'gu'],
  'kn-IN': ['kn-IN', 'kn'],
  'ml-IN': ['ml-IN', 'ml'],
  'pa-IN': ['pa-IN', 'pa'],
  'od-IN': ['or-IN', 'or'],
};

/**
 * Returns the best available SpeechSynthesisVoice for the given language code.
 * Tries each candidate in order, falls back to any available voice.
 */
export function getBestVoice(langCode: string): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const candidates = SPEECH_VOICE_MAP[langCode] ?? [langCode, 'en-IN'];
  for (const candidate of candidates) {
    const voice = voices.find(v => v.lang === candidate || v.lang.startsWith(candidate.split('-')[0]));
    if (voice) return voice;
  }
  return voices[0] ?? null;
}
```

In `SpeakerButton.tsx`, in the `fallback()` function, use `getBestVoice`:

```typescript
import { getBestVoice } from '@/lib/speechVoices';

// Inside fallback():
async function fallback() {
  // Check if offline — use browser speech
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = getBestVoice(language as string);
  if (voice) utterance.voice = voice;
  utterance.lang = (LANG_BY_CODE[language as LangCode]?.bcp47 ?? language) as string;
  utterance.rate = 0.85;  // slightly slower for comprehension
  utterance.pitch = 1.0;
  utterance.onend = () => { setIsSpeaking(false); cancelRef.current = null; };
  utterance.onerror = () => { setIsSpeaking(false); };
  cancelRef.current = () => { window.speechSynthesis?.cancel(); };
  window.speechSynthesis?.speak(utterance);
}
```

Add an **offline indicator** to SpeakerButton — when playing offline (browser fallback),
show a slightly different icon or color to indicate it's using device voice:

```tsx
// State:
const [isOffline, setIsOffline] = useState(!navigator.onLine);
useEffect(() => {
  const onOnline = () => setIsOffline(false);
  const onOffline = () => setIsOffline(true);
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
}, []);

// In button className: add `opacity-75` when isOffline to indicate device fallback
// Add title="Offline — using device voice" when isOffline
```

---

## PART 4 — SIDEBAR IMPROVEMENTS (TOOLTIP ON COLLAPSED)

When sidebar is collapsed (icon-only mode on desktop), hovering over a nav icon must
show a tooltip with the label — so users know what each icon does.

**Add tooltip to each nav item:**

```tsx
// Wrap each nav Link with a Tooltip:
<div className="relative group/tooltip">
  <Link href={item.href} ...>
    {/* icon + label */}
  </Link>
  {/* Tooltip — only shown when sidebar is collapsed */}
  {!sidebarOpen && (
    <div className="hidden md:block absolute left-full top-1/2 -translate-y-1/2 ml-3
                    bg-navy text-white text-xs font-medium px-2.5 py-1.5 rounded
                    whitespace-nowrap shadow-lg pointer-events-none
                    opacity-0 group-hover/tooltip:opacity-100
                    transition-opacity duration-150 z-50">
      {item.label}
      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4
                      border-transparent border-r-navy" />
    </div>
  )}
</div>
```

---

## PART 5 — SUMMARY: FILE EDIT ORDER

Edit in this exact order to avoid breakage:

1. **`lib/audioManager.ts`** — NEW file. Global audio stop singleton.
2. **`lib/ui-strings.ts`** — NEW file. UI label translations for all 11 languages.
3. **`lib/speechVoices.ts`** — NEW file. Browser voice selection for offline TTS.
4. **`components/FirstReportLogo.tsx`** — NEW file. SVG brand logo component.
5. **`components/TtsLabel.tsx`** — NEW file. Inline speaker wrapper.
6. **`components/SettingsDrawer.tsx`** — NEW file. Settings slide-out panel.
7. **`components/SpeakerButton.tsx`** — Import audioManager, add offline detection, update colors.
8. **`components/AgentAvatar.tsx`** — Replace letter "S" with FirstReportLogo.
9. **`components/LanguageTile.tsx`** — Fix selected state colors + add per-tile speaker.
10. **`components/PersonaCard.tsx`** — Fix selected state colors + add speaker.
11. **`components/LanguageSwitcher.tsx`** — Update design tokens, add per-language speaker.
12. **`components/landing/LuxuryNav.tsx`** — Fix Languages dropdown to click-based with solid bg.
13. **`components/landing/AssessmentForm.tsx`** — Fix selected state colors, add modal trigger.
14. **`app/(app)/layout.tsx`** — Wire SettingsDrawer, add LanguageSwitcher to header, add SVG nav icons, add route-change audio stop, add tooltips.
15. **`app/(app)/home/page.tsx`** — Add TtsLabel to step headings, use new design tokens.
16. **`app/(app)/classify/page.tsx`** — Add TtsLabel, use uiStr() for labels.
17. **`app/(app)/documents/page.tsx`** — Add TtsLabel to hero/timeline/disclaimer.
18. **`app/(app)/history/page.tsx`** — Add TtsLabel, ensure language switcher removed (shell has it).
19. **`app/(auth)/login/page.tsx`** — Update with FirstReportLogo.

---

## PART 6 — DO NOT TOUCH

- `app/api/**` — all API routes
- `lib/i18n.ts`, `lib/personas.ts`, `lib/history.ts`, `lib/sarvam.ts`, `lib/tts.ts`, `lib/supabase/**`, `lib/encryption.ts`, `lib/prisma.ts`
- All TypeScript interfaces and business logic
- `tailwind.config.ts` colors — already updated in the previous prompt (CURSOR_UI_REMODEL_PROMPT.md)
- The `NALSA href="tel:15100"` link — must remain everywhere
- All `lang={}` attributes on JSX

---

## PART 7 — QUALITY CHECKS

Before marking complete, verify:

- [ ] Select a LanguageTile — text is clearly visible (white on navy, no invisible text)
- [ ] Select a PersonaCard — all child text is white/readable
- [ ] Select a language in AssessmentForm — sublabel is visible
- [ ] Navigate home → chat → classify — audio does NOT continue from previous page
- [ ] Click speaker icon on a LanguageTile — it reads the language name aloud
- [ ] Disable wifi — click speaker on any element — device voice reads the text
- [ ] Click hamburger in top bar — sidebar opens with SVG icons + labels
- [ ] Close sidebar — icons remain visible, tooltips show on hover (desktop)
- [ ] Click Settings gear — settings drawer slides in from right
- [ ] Change language in settings — LanguageSwitcher in header bar updates
- [ ] Click "Languages" in landing page nav — solid white dropdown appears, does NOT close immediately
- [ ] The big AgentAvatar panel shows the shield+wave logo, NOT a letter "S"
- [ ] LanguageTile shows full native script text, NOT "हि..." truncated
- [ ] "Begin Assessment →" button on landing opens modal/dropdown form
- [ ] Settings drawer saves name, language pref, auto-speak toggle to localStorage
