# FirstReport — Complete UI Remodel Prompt
### For Cursor / Antigravity / AI Code Editor

> **Objective**: Migrate FirstReport from the current "Bauhaus Newsprint" brutalist aesthetic to a 
> professional, enterprise-grade legal-tech SaaS UI using Tailwind CSS. The design authority is 
> `DESIGN_SYSTEM.md` in this repo — read it fully before touching any file.

---

## 1. WHAT YOU ARE WORKING WITH

This is a **Next.js 14 App Router** project (TypeScript + Tailwind CSS v3). The app is a 
voice-first AI legal aid assistant for India. It has:

- `app/(app)/` — Main app shell (home, chat, classify, documents, history)
- `app/(auth)/` — Auth pages (login, verify)
- `app/globals.css` — Global tokens, animations, component classes
- `tailwind.config.ts` — Design tokens (colors, fonts, shadows, animations)
- `components/` — Shared React components
- `DESIGN_SYSTEM.md` — **Your authoritative design spec**

**Do not touch:**
- Any file in `app/api/` (backend routes)
- `lib/` directory (business logic)
- All TypeScript interfaces and function signatures
- Multi-language (`lang={}`) attributes — leave them on all elements
- The NALSA `href="tel:15100"` link — must remain present on every page

---

## 2. CURRENT UI PROBLEMS (your audit)

After reading the code, these are the specific problems to fix:

### 2a. Global CSS & Tokens (`app/globals.css`, `tailwind.config.ts`)
- Body has a **newsprint dot-grid background texture** — remove it, use plain `#F7F9FB`
- `* { border-radius: 0 !important }` is globally enforced — remove this
- Colors are: `--paper #F9F9F7`, `--ink #111111`, `--accent #CC0000`, plus Bauhaus aliases — replace ALL with the new palette from `DESIGN_SYSTEM.md`
- Body font is **Lora** (serif) — change to **Inter** for all UI/body text
- `.bauhaus-card`, `.bauhaus-btn`, `.bauhaus-tile` global classes use hard offset shadows (`box-shadow: 4-8px 4-8px 0 0 #111`) — replace with soft layered shadows
- Scrollbar is styled in heavy newsprint style — reset to minimal

### 2b. Layout Shell (`app/(app)/layout.tsx`)
- Currently just `return <>{children}</>` — completely empty shell
- **You must build the persistent navigation shell here** — sidebar + top header bar for ALL app pages
- The sidebar is default-closed (icon-only, 64px wide), opens to 240px on hamburger click
- Top header: 64px height, `bg-white`, `border-b border-cool-gray`, contains hamburger toggle + logo + right actions
- On mobile (< 768px): sidebar becomes a full-height overlay drawer from the left, triggered by hamburger

### 2c. Every App Page Header (home, chat, classify, documents, history)
- Every page currently **builds its own header from scratch** — these must all be **removed**
- The persistent shell in `layout.tsx` will provide the header; pages should not repeat it
- Remove the `<header>` block from every page in `app/(app)/`
- Each page keeps its `<main>` content only

### 2d. Colors
Old → New mapping:
- `bg-bauhaus-red` / `bg-accent` / `#CC0000` → **Use contextually**: `bg-error` (#D9534F) for severity/errors, `bg-teal` (#5FA8A0) for positive accents
- `bg-bauhaus-blue` / `bg-ink` / `#111111` → `bg-navy` (#1A2A44)
- `bg-bauhaus-yellow` / `bg-muted` / `#E5E5E0` → `bg-cool-gray` (#D9E2EC) or `bg-off-white` (#F7F9FB)
- `bg-paper` / `bg-canvas` / `#F9F9F7` → `bg-off-white` (#F7F9FB)
- `text-ink` → `text-primary` (= `text-navy`)
- `border-ink` → `border-cool-gray` 
- `shadow-bauhaus*` → `shadow-sm` / `shadow-md` / `shadow-lg`

### 2e. Typography
- `font-body` (Lora) used on `<html>/<body>` — change to `font-sans` (Inter)
- `font-serif` (Playfair Display) — **keep** for `h1`, `h2`, display headings only
- `font-mono` (JetBrains Mono) — keep for BNSS section references, codes only
- `text-5xl sm:text-7xl lg:text-[8.5rem]` mega-hero text — scale down to max `text-4xl sm:text-5xl` (enterprise, not poster-art)
- `uppercase tracking-widest` everywhere — use uppercase sparingly; mostly for labels only
- Remove `.kicker`, `.ornament`, `.drop-cap` classes from code

### 2f. Border Radius
- Currently `border-radius: 0` globally — change to:
  - Inputs: `rounded-sm` (4px)
  - Buttons: `rounded` (6px)
  - Cards: `rounded-md` (8px)
  - Modals/drawers: `rounded-lg` (12px)

### 2g. Border Weight
- `border-3`, `border-4`, `border-6` heavy borders everywhere — change to `border` (1px) standard
- Reduce `border-ink` → `border-cool-gray/60` for card borders
- Focus states: `ring-2 ring-teal/20 border-teal` instead of translate + heavy shadow

### 2h. Login Page
- Left panel has floating Bauhaus geometry (large circle, rotated square, triangle SVG) — replace with a clean illustration or a gradient panel in `bg-navy` with a professional copy block
- Remove the floating geometric shapes (`<span>` circles/squares)
- Add a subtle SVG pattern or just clean text on navy background

---

## 3. STEP-BY-STEP IMPLEMENTATION PLAN

### STEP 1: Update `tailwind.config.ts`

Replace the color config entirely:

```typescript
colors: {
  // Brand
  navy:       '#1A2A44',
  teal:       '#5FA8A0',
  'cool-gray': '#D9E2EC',
  'off-white': '#F7F9FB',

  // Status
  success:    '#4CAF50',
  error:      '#D9534F',
  warning:    '#F0AD4E',

  // Text
  primary:    '#1A2A44',   // same as navy
  secondary:  '#4A5568',
  muted:      '#A0AEC0',

  // Neutrals
  neutral: {
    50:  '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },

  // Keep for reference / minimal compat
  background: '#F7F9FB',
  foreground: '#1A2A44',
  border:     '#D9E2EC',
  white:      '#FFFFFF',
},
```

Update fontFamily:
```typescript
fontFamily: {
  sans:    ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
  serif:   ['"Playfair Display"', 'Georgia', 'serif'],
  body:    ['Inter', '-apple-system', 'sans-serif'],     // now same as sans
  mono:    ['"JetBrains Mono"', 'Menlo', 'monospace'],
  display: ['"Playfair Display"', 'Georgia', 'serif'],
},
```

Update boxShadow — replace Bauhaus with elevation:
```typescript
boxShadow: {
  'xs':  '0 1px 2px rgba(26,42,68,0.06)',
  'sm':  '0 1px 4px rgba(26,42,68,0.08), 0 0 1px rgba(26,42,68,0.04)',
  'md':  '0 4px 12px rgba(26,42,68,0.10), 0 1px 3px rgba(26,42,68,0.06)',
  'lg':  '0 8px 24px rgba(26,42,68,0.12), 0 2px 6px rgba(26,42,68,0.06)',
  'xl':  '0 16px 40px rgba(26,42,68,0.14), 0 4px 10px rgba(26,42,68,0.08)',
  'inner': 'inset 0 1px 3px rgba(26,42,68,0.08)',
},
```

Remove: all `bauhaus-*` shadow keys, all `bauhaus-*` color keys, `canvas`, `ivory`, `cream`, `forest`, `cognac`, `oxblood`, `espresso`, `brass`, `moss` color aliases.

---

### STEP 2: Rewrite `app/globals.css`

**Keep:**
- The Google Fonts `@import` — but add Inter 300,400,500,600,700 to it, and keep Playfair Display 400,600,700; keep all Noto font imports
- `@tailwind base/components/utilities`
- Font utility classes `.font-serif`, `.font-sans`, `.font-mono`, `.font-display`
- All animation keyframes (`popIn`, `slideUp`, `fadeIn`, `rec`, `wave`, `pulseSquare`, `marquee`)
- `.line-clamp-3`
- `::selection` (update colors to navy/white)
- Focus-visible outlines

**Replace root variables:**
```css
:root {
  color-scheme: light;

  /* Brand */
  --navy:       #1A2A44;
  --teal:       #5FA8A0;
  --cool-gray:  #D9E2EC;
  --off-white:  #F7F9FB;

  /* Status */
  --success:    #4CAF50;
  --error:      #D9534F;
  --warning:    #F0AD4E;

  /* Text */
  --text-primary:   #1A2A44;
  --text-secondary: #4A5568;
  --text-muted:     #A0AEC0;

  /* Shadows */
  --shadow-sm: 0 1px 4px rgba(26,42,68,0.08), 0 0 1px rgba(26,42,68,0.04);
  --shadow-md: 0 4px 12px rgba(26,42,68,0.10), 0 1px 3px rgba(26,42,68,0.06);
  --shadow-lg: 0 8px 24px rgba(26,42,68,0.12), 0 2px 6px rgba(26,42,68,0.06);
}
```

**Change body styles:**
```css
html, body {
  background-color: var(--off-white);
  color: var(--text-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
               'Noto Sans Gujarati', 'Noto Sans Kannada', 'Noto Sans Malayalam',
               'Noto Sans Gurmukhi', 'Noto Sans Oriya', sans-serif;
  font-weight: 400;
  min-height: 100dvh;
  /* NO background texture */
}
```

**Remove entirely:**
- `.bauhaus-card`, `.bauhaus-btn`, `.bauhaus-tile` class definitions
- The `* { border-radius: 0 !important }` block  
- The `* { -webkit-tap-highlight-color: transparent }` block applied to `*` (keep it, but remove `border-radius: 0`)
- Newsprint texture `.newsprint-texture` class
- `.hard-shadow-hover` class
- `.ornament`, `.drop-cap`, `.halftone`, `.gilded-corner`, `.kicker`, `.rule-brass`, `.ticker` classes
- Scrollbar custom styling (just reset to browser default)
- `input, textarea, select { font-family: 'JetBrains Mono' }` — inputs should use Inter

**Add new utility classes:**
```css
/* Professional card */
.fr-card {
  background: #FFFFFF;
  border: 1px solid rgba(217,226,236,0.6);
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 200ms ease-out;
}
.fr-card:hover { box-shadow: var(--shadow-md); }

/* Primary button */
.fr-btn-primary {
  background: var(--navy);
  color: #FFFFFF;
  border-radius: 6px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 14px;
  transition: background 150ms ease-out, box-shadow 150ms ease-out;
}
.fr-btn-primary:hover { background: rgba(26,42,68,0.9); box-shadow: var(--shadow-md); }
.fr-btn-primary:active { background: rgba(26,42,68,1); box-shadow: none; }

/* Teal accent button */
.fr-btn-teal {
  background: var(--teal);
  color: #FFFFFF;
  border-radius: 6px;
  font-weight: 600;
  transition: background 150ms ease-out;
}
.fr-btn-teal:hover { background: rgba(95,168,160,0.88); }

/* Input base */
.fr-input {
  border: 1px solid var(--cool-gray);
  border-radius: 4px;
  background: #FFFFFF;
  font-family: 'Inter', sans-serif;
  transition: border-color 150ms, box-shadow 150ms;
}
.fr-input:focus {
  outline: none;
  border-color: var(--teal);
  box-shadow: 0 0 0 3px rgba(95,168,160,0.15);
}

/* Status badges */
.badge-success { background: rgba(76,175,80,0.1); color: #388E3C; border: 1px solid rgba(76,175,80,0.25); border-radius: 9999px; }
.badge-error   { background: rgba(217,83,79,0.1); color: #C0392B; border: 1px solid rgba(217,83,79,0.25); border-radius: 9999px; }
.badge-teal    { background: rgba(95,168,160,0.1); color: #3D8C85; border: 1px solid rgba(95,168,160,0.25); border-radius: 9999px; }
.badge-navy    { background: rgba(26,42,68,0.08); color: #1A2A44; border: 1px solid rgba(26,42,68,0.2); border-radius: 9999px; }

/* Section label — small caps Inter */
.section-label {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

/* Severity badge (overrides) */
.severity-critical { background: var(--error); color: #FFFFFF; border-radius: 4px; }
```

---

### STEP 3: Build the Navigation Shell in `app/(app)/layout.tsx`

Build a full shell component. Requirements:

```
┌──────────────────────────────────────────────────────────┐
│  HEADER BAR (64px, fixed, z-50)                          │
│  [≡ hamburger]  [F FirstReport]      [Lang] [🆘 15100]  │
└──────────────────────────────────────────────────────────┘
┌────────────┬─────────────────────────────────────────────┐
│  SIDEBAR   │                                             │
│  (64px     │   PAGE CONTENT                              │
│  default,  │   (scrollable, padding-left adjusts         │
│  240px     │   based on sidebar state)                   │
│  open)     │                                             │
│            │                                             │
└────────────┴─────────────────────────────────────────────┘
```

**Shell implementation details:**

```tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import GeometricLogo from '@/components/GeometricLogo';

const NAV_ITEMS = [
  { href: '/home',      icon: '⊙', label: 'Home' },
  { href: '/chat',      icon: '◎', label: 'New Report' },
  { href: '/classify',  icon: '◈', label: 'Classification' },
  { href: '/documents', icon: '◧', label: 'Documents' },
  { href: '/history',   icon: '◷', label: 'History' },
];

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-off-white">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-cool-gray flex items-center px-4 gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded text-navy hover:bg-off-white transition-colors"
          aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        >
          <span className={`block w-5 h-0.5 bg-navy transition-transform ${sidebarOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-navy transition-opacity ${sidebarOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-navy transition-transform ${sidebarOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>

        <div className="flex items-center gap-2.5 flex-1">
          <GeometricLogo size={32} />
          <span className="font-serif font-bold text-navy text-lg tracking-tight">FirstReport</span>
          <span className="hidden sm:inline text-muted text-xs">·</span>
          <span className="hidden sm:inline text-secondary text-xs">AI Legal Aid</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Language switcher slot — pages inject this via a portal or prop */}
          <a
            href="tel:15100"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-error text-white text-xs font-semibold rounded hover:bg-error/90 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-rec" />
            <span className="hidden sm:inline">NALSA ·</span> 15100
          </a>
        </div>
      </header>

      {/* SIDEBAR OVERLAY (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed top-16 left-0 bottom-0 z-40 bg-navy flex flex-col
          transition-all duration-200 ease-in-out overflow-hidden
          ${sidebarOpen ? 'w-60' : 'w-0 md:w-16'}
        `}
      >
        <nav className="flex-1 py-4 overflow-hidden">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 mx-2 rounded-md mb-1
                  text-white/70 hover:text-white hover:bg-white/10
                  transition-colors duration-150 whitespace-nowrap
                  ${isActive ? 'bg-white/10 text-white border-l-2 border-teal' : ''}
                `}
              >
                <span className="text-lg w-6 text-center shrink-0">{item.icon}</span>
                <span
                  className={`text-sm font-medium transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 md:opacity-0'}`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom settings */}
        <div className="p-4 border-t border-white/10">
          <div className={`flex items-center gap-3 text-white/50 whitespace-nowrap`}>
            <span className="text-xs shrink-0">⚙</span>
            <span className={`text-xs transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>Settings</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div
        className={`
          pt-16 transition-all duration-200 ease-in-out min-h-screen
          ${sidebarOpen ? 'md:pl-60' : 'md:pl-16'}
        `}
      >
        {children}
      </div>
    </div>
  );
}
```

---

### STEP 4: Strip Headers from All App Pages

In each of these files, **delete the `<header>` JSX block entirely** (it will be provided by the shell):
- `app/(app)/home/page.tsx`
- `app/(app)/chat/page.tsx`
- `app/(app)/classify/page.tsx`
- `app/(app)/documents/page.tsx`
- `app/(app)/history/page.tsx`

Also remove the `router.back()` back button from inner pages — the sidebar provides navigation context. The chat/classify pages can retain a minimal breadcrumb instead.

---

### STEP 5: Redesign `app/(app)/home/page.tsx`

**Current**: Giant newspaper poster with 8.5rem headline, hard-shadow tiles, red accent, Bauhaus geometry steps.

**New design**: Professional landing/dashboard:

```
┌─────────────────────────────────────────────────────┐
│  WELCOME SECTION                                    │
│  [Playfair h1] "Your Voice. Your Right."           │
│  [Inter body]  Select language and specialist mode  │
│  below to begin your legal consultation.            │
└─────────────────────────────────────────────────────┘
┌────────────────────┐ ┌──────────────────────────────┐
│ STEP 1: Language   │ │  AGENT PREVIEW PANEL          │
│                    │ │  bg-white rounded-md shadow   │
│  [grid of tiles]   │ │  [AgentAvatar]                │
│                    │ │  [Preview text box]            │
└────────────────────┘ │  [START button — navy]        │
┌────────────────────┐ │  [NALSA button — error]       │
│ STEP 2: Specialist │ └──────────────────────────────┘
│                    │
│  [persona cards]   │
└────────────────────┘
```

Specific changes:
- `h1`: Use `font-serif text-4xl sm:text-5xl font-bold text-navy tracking-tight` (NOT `text-[8.5rem] uppercase`)
- Remove the step number circles with `bg-bauhaus-red rounded-full border-3 border-ink shadow-bauhaus-sm` → use plain `inline-flex w-7 h-7 rounded-full bg-navy/10 text-navy font-semibold text-sm items-center justify-center`
- START button: `fr-btn-primary w-full py-4 text-base font-semibold rounded`
- NALSA button: `bg-error/10 text-error border border-error/20 w-full py-3 text-sm font-semibold rounded hover:bg-error hover:text-white`
- Footer: minimal, `bg-white border-t border-cool-gray`, no black footer

---

### STEP 6: Redesign `app/(app)/chat/page.tsx`

**Current**: Heavy bauhaus borders, yellow/red/blue geometric UI

**New design**: Clean chat interface (think Intercom / modern legal SaaS):

- Message area: `bg-off-white`, messages in `bg-white rounded-lg shadow-xs` (AI) and `bg-navy text-white rounded-lg` (user)
- Input area: `bg-white border-t border-cool-gray` with `fr-input` class, send button in navy
- Typing indicator: Three soft navy dots pulsing (not bauhaus shapes)
- The agent name/status bar at top: remove the separate header — add a minimal agent info bar as the first element inside `<main>`, styled as a card with agent avatar

---

### STEP 7: Redesign `app/(app)/classify/page.tsx`

**Current**: Big bold black/red classification card

**New design**: Professional result card:
- "YOU SAID" section: `fr-card p-4` with italic quote text in secondary color
- Classification card: `fr-card p-6 border-l-4 border-navy` (or `border-error` for cognizable)
  - `COGNIZABLE` badge: `badge-error px-3 py-1 text-xs font-semibold`
  - `NON-COGNIZABLE` badge: `badge-navy`
  - Heading: `font-serif text-2xl font-bold text-navy`
  - BNSS section: `font-mono text-teal font-semibold`
- Buttons: primary "Generate Documents" in navy, secondary "Retry" in ghost style
- Remove: hard colored corner decorations, extreme border widths

---

### STEP 8: Redesign `app/(app)/documents/page.tsx`

**Current**: "YOUR CASE, FILED." giant type; Bauhaus timeline

**New design**: Documents dashboard:
- Hero: `font-serif text-3xl font-bold text-navy` — "Your Documents Are Ready"
- Timeline: horizontal stepper with `bg-cool-gray` track, `bg-teal` filled nodes
- Document cards: `fr-card p-5` with left accent strip `border-l-4 border-navy` (ready) or `border-cool-gray` (locked), subtle lock overlay for locked state
- Send to Telegram: `fr-btn-teal w-full py-3 font-semibold`
- Disclaimer: `bg-warning/10 border border-warning/30 rounded-md p-4 text-sm`

---

### STEP 9: Redesign `app/(app)/history/page.tsx`

**Current**: Same pattern — Bauhaus cards, heavy borders

**New design**: Entry list with timeline:
- Each entry: `fr-card p-4` with colored left border by severity (`border-l-3 border-error` for critical, `border-teal` for normal)
- Severity badge: use `.badge-*` utilities
- Date: `text-muted text-xs`
- Delete: ghost icon button with hover:text-error

---

### STEP 10: Redesign `app/(auth)/login/page.tsx`

**Current**: Bauhaus poster with floating geometric shapes (large circle, rotated square, triangle)

**New design**: Split-panel professional login:

Left panel (`bg-navy`):
- Remove ALL floating geometric `<span>` elements
- Add a clean, centered content block:
  ```
  [GeometricLogo size=48 — styled with white border]
  [h1 font-serif text-4xl text-white] "Your Voice. Your Right."
  [p text-white/70 text-base mt-3] "11 languages. Voice-first. No typing required."
  [trust badges row] BNSS · POCSO · PWDVA · MWPSC — small text-white/50
  ```
- Add a subtle `bg-gradient-to-br from-navy via-navy to-[#243B58]` gradient

Right panel (form):
- `bg-white` clean panel
- Inputs use `fr-input` class
- OTP button: `fr-btn-primary w-full py-3`
- Demo mode button: secondary style `bg-cool-gray text-navy`
- Google button: white with border, Inter font — no uppercase
- Remove: all `border-3 border-ink shadow-bauhaus` from form elements

---

### STEP 11: Update All Shared Components

#### `components/ChatBubble.tsx`
```
AI bubble:   bg-white text-primary border border-cool-gray/60 rounded-lg rounded-tl-sm shadow-xs
User bubble: bg-navy text-white rounded-lg rounded-tr-sm shadow-xs
Typing:      bg-white border border-cool-gray/60 rounded-lg → 3 navy dots animating
Remove:      hard bauhaus borders, hard shadows, bauhaus color mapping
```

#### `components/PersonaCard.tsx`
```
Unselected: fr-card p-6 hover:shadow-md hover:border-teal/40
Selected:   border-2 border-navy bg-navy text-white rounded-md shadow-md
Section label: .section-label class
Title: font-serif text-2xl font-bold (keep Playfair)
Remove: border-ink heavy borders
```

#### `components/LanguageTile.tsx`
```
Unselected: bg-white border border-cool-gray rounded-sm hover:border-teal hover:shadow-sm
Selected:   bg-navy text-white border-2 border-navy rounded-sm
Native script: font-serif text-2xl (keep Playfair for script)
ISO code: font-mono text-[10px]
Remove: zero border radius, bauhaus translation on hover
```

#### `components/DocumentCard.tsx`
```
Card:    fr-card with left accent strip → border-l-4 border-navy (ready) or border-cool-gray (locked)
Icon:    rounded-sm bg-navy/10 text-navy (ready), bg-cool-gray text-muted (locked)
Badges:  .badge-success (READY), .badge-navy (LOCKED), .badge-teal (SENT)
Buttons: View=ghost, PDF=fr-btn-primary, Send=fr-btn-teal — smaller py-1.5
Remove:  Bauhaus color chip corner, heavy borders
```

#### `components/MicButton.tsx`
```
Idle:      w-20 h-20 rounded-full bg-navy text-white shadow-lg hover:shadow-xl hover:scale-105
Recording: bg-error text-white scale-105 ring-4 ring-error/30
Processing: bg-cool-gray cursor-wait animate-pulse
Remove:    squared corners, bauhaus border-3, bauhaus translate shadow tricks
```

#### `components/SeverityBadge.tsx` (update if exists)
```
Normal:   badge-teal
Serious:  badge with warning color
Critical: badge-error
```

#### `components/GeometricLogo.tsx`
Keep as is — the "F" in a bordered square works as an enterprise wordmark initial.
Update: `border-navy bg-off-white font-serif font-bold text-navy` (replace ink/paper with navy/off-white)

---

### STEP 12: Update `app/layout.tsx` (root)

```tsx
export const viewport: Viewport = {
  themeColor: '#1A2A44',   // was #F9F9F7
  ...
};

// body class:
<body className="min-h-screen bg-off-white text-primary antialiased font-sans">
```

---

## 4. WHAT TO LEAVE COMPLETELY ALONE

- All files in `app/api/` — zero changes
- All files in `lib/` — zero changes  
- `components/AgentAvatar.tsx` — functional, leave
- `components/SpeakerButton.tsx` — functional, leave (just update colors in className)
- `components/LanguageSwitcher.tsx` — functional, just update color tokens in className
- All `lang={}` attributes on JSX elements — required for i18n
- All `t('...', lang)` translation calls — required
- `NALSA href="tel:15100"` — must remain on every page
- All TypeScript types, interfaces, and function signatures
- `sessionStorage` usage pattern — offline-first requirement

---

## 5. ANIMATION & INTERACTION RULES

**Hover states**: Soft transitions `duration-150 ease-out`, no translate tricks except subtle `-translate-y-0.5` on buttons max.

**Focus**: `ring-2 ring-teal/20 border-teal` on inputs. `ring-2 ring-navy/20` on buttons.

**Loading skeleton**: Replace `animate-pulse bg-paper border-3 border-ink` with `animate-pulse bg-cool-gray/50 rounded-md`.

**Active states**: `scale-[0.98]` subtle press feel instead of `translate-x-[3px] translate-y-[3px]`.

**Page transitions**: Existing `animate-slide-up` and `animate-fade-in` classes — keep and reuse (they're color-agnostic).

---

## 6. QUALITY CHECKLIST

Before finishing, verify:

- [ ] `border-radius: 0 !important` is completely removed from globals.css
- [ ] No Bauhaus class names remain in any component (`bauhaus-*`)
- [ ] No newsprint texture on body
- [ ] No hard-offset box shadows anywhere
- [ ] Sidebar shows icons-only when closed on desktop, hidden on mobile
- [ ] Hamburger animates to X when open
- [ ] NALSA 15100 button visible in header on all pages
- [ ] All pages use Inter as body font
- [ ] Headings use Playfair Display
- [ ] All inputs have soft border-radius and teal focus ring
- [ ] All buttons have rounded corners and soft shadows
- [ ] Color palette matches DESIGN_SYSTEM.md exactly
- [ ] Mobile responsive — sidebar works as overlay drawer on <768px
- [ ] No page in `app/(app)/` has its own `<header>` element anymore
- [ ] Severity Critical uses `#D9534F` (error red), not `#CC0000`
- [ ] `app/layout.tsx` themeColor is `#1A2A44`

---

## 7. FILE EDIT ORDER (recommended)

1. `tailwind.config.ts` — tokens first, everything derives from this
2. `app/globals.css` — reset variables and component classes
3. `app/layout.tsx` — root body classes + themeColor
4. `app/(app)/layout.tsx` — build the shell (most important step)
5. `components/GeometricLogo.tsx` — simple color update
6. `components/LanguageTile.tsx`
7. `components/PersonaCard.tsx`
8. `components/ChatBubble.tsx`
9. `components/MicButton.tsx`
10. `components/DocumentCard.tsx`
11. `app/(app)/home/page.tsx` — strip header, redesign
12. `app/(app)/chat/page.tsx` — strip header, redesign chat
13. `app/(app)/classify/page.tsx` — strip header, redesign cards
14. `app/(app)/documents/page.tsx` — strip header, redesign
15. `app/(app)/history/page.tsx` — strip header, redesign
16. `app/(auth)/login/page.tsx` — redesign left panel + form

---

## 8. IMPORTANT NOTES FOR THE AI CODE EDITOR

1. **Read `DESIGN_SYSTEM.md` first** — all design decisions derive from it.

2. **Do not create new API routes** — the backend is complete and tested.

3. **Do not modify i18n translations** — `lib/i18n.ts` is authoritative.

4. **The sidebar state (`sidebarOpen`)** lives in `app/(app)/layout.tsx` — it must NOT be prop-drilled to pages. Use `usePathname()` for active nav detection only.

5. **The MicButton must remain functional** — its audio recording logic is critical. Only update its visual className strings.

6. **Language-specific fonts** — the Noto font imports in `globals.css` must stay. They serve users in Bengali, Tamil, Telugu, Gujarati, Kannada, Malayalam, Gurmukhi, and Odia scripts.

7. **Keep `animate-rec`** on the NALSA button indicator dot — it's a subtle live indicator, appropriate for a legal emergency line.

8. **The `severity-critical` class** must remain defined in globals.css (it's used programmatically by SeverityBadge). Just change its colors to the new error palette.

9. **`AgentAvatar` and `SpeakerButton`** — update only their className props if they use old color tokens, but do not change their internal logic.

10. The app is used by a low-literacy Hindi-speaking user (**Sunita Devi persona** from CLAUDE.md). Professional ≠ cold. The new design must be clean, clear, and confidence-inspiring — not sterile.
