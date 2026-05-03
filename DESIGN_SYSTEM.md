# FirstReport — Design System

> **Single source of truth** for all colors, typography, spacing, and component conventions.
> All Tailwind config, globals.css, and component files must derive from this document.

---

## Color Palette

### Primary
| Token | Hex | Usage |
|-------|-----|-------|
| `navy` | `#1A2A44` | Primary brand, header bg, CTA buttons, active states, key headings |

### Secondary
| Token | Hex | Usage |
|-------|-----|-------|
| `cool-gray` | `#D9E2EC` | Borders, dividers, card outlines, input borders, nav separator lines |

### Accent
| Token | Hex | Usage |
|-------|-----|-------|
| `teal` | `#5FA8A0` | Hover states, selected tab indicators, badge accents, links, icons |

### Backgrounds
| Token | Hex | Usage |
|-------|-----|-------|
| `off-white` | `#F7F9FB` | Page background, card backgrounds, input fill |
| `white` | `#FFFFFF` | Modal surfaces, elevated card layers |

### Status Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#4CAF50` | Success toasts, confirmed states, "Ready" badges |
| `error` | `#D9534F` | Error states, critical severity badges, form errors |
| `warning` | `#F0AD4E` | Warning notices, locked states |

### Text Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `text-primary` | `#1A2A44` | Headlines, body text, labels |
| `text-secondary` | `#4A5568` | Subtext, meta information, placeholders |
| `text-muted` | `#A0AEC0` | Disabled states, helper text |
| `text-inverse` | `#FFFFFF` | Text on navy/dark backgrounds |

---

## Typography

### Font Stack

```css
/* Primary UI Font — Inter */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Heading Authority Font — Playfair Display */
font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
```

### Scale

| Role | Font | Size | Weight | Line Height | Usage |
|------|------|------|--------|-------------|-------|
| `display` | Playfair Display | 48–72px | 700 | 1.1 | Hero headlines |
| `h1` | Playfair Display | 36px | 700 | 1.2 | Page titles |
| `h2` | Playfair Display | 28px | 600 | 1.3 | Section headings |
| `h3` | Inter | 20px | 600 | 1.4 | Card titles |
| `h4` | Inter | 16px | 600 | 1.4 | Sub-section labels |
| `body-lg` | Inter | 16px | 400 | 1.6 | Primary body copy |
| `body` | Inter | 14px | 400 | 1.6 | Secondary body |
| `small` | Inter | 12px | 400 | 1.5 | Captions, meta |
| `label` | Inter | 11px | 600 | 1 | Uppercase labels (letter-spacing: 0.08em) |
| `mono` | JetBrains Mono | 13px | 400 | 1.5 | Code, section refs |

### Letter Spacing
- Display / headings: `-0.02em` (slightly tight — authoritative)
- Body: `0` (default — readable)
- Labels (uppercase small caps): `0.08em`
- Legal codes (mono): `0.04em`

---

## Spacing System

Based on 4px grid:
```
4px  / 0.25rem  → gap-1
8px  / 0.5rem   → gap-2
12px / 0.75rem  → gap-3
16px / 1rem     → gap-4
20px / 1.25rem  → gap-5
24px / 1.5rem   → gap-6
32px / 2rem     → gap-8
48px / 3rem     → gap-12
64px / 4rem     → gap-16
```

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 4px | Inputs, small badges |
| `rounded` | 6px | Buttons, tags |
| `rounded-md` | 8px | Cards |
| `rounded-lg` | 12px | Modals, drawers |
| `rounded-xl` | 16px | Floating panels |
| `rounded-full` | 9999px | Avatar, status dots |

> **NO `border-radius: 0` enforcement** — the old brutalist zero-radius approach is retired.

---

## Shadow System

```css
/* Elevation levels — professional, subtle */
--shadow-xs: 0 1px 2px rgba(26,42,68,0.06);
--shadow-sm: 0 1px 4px rgba(26,42,68,0.08), 0 0 1px rgba(26,42,68,0.04);
--shadow-md: 0 4px 12px rgba(26,42,68,0.10), 0 1px 3px rgba(26,42,68,0.06);
--shadow-lg: 0 8px 24px rgba(26,42,68,0.12), 0 2px 6px rgba(26,42,68,0.06);
--shadow-xl: 0 16px 40px rgba(26,42,68,0.14), 0 4px 10px rgba(26,42,68,0.08);
```

> No hard-offset "Bauhaus" shadows. Use layered, soft elevation shadows only.

---

## Component Patterns

### Buttons

```
Primary:   bg-navy text-white hover:bg-navy/90        rounded-md px-5 py-2.5 font-semibold
Secondary: bg-off-white text-navy border border-cool-gray hover:bg-cool-gray/40   rounded-md
Teal:      bg-teal text-white hover:bg-teal/90         rounded-md
Danger:    bg-error text-white hover:bg-error/90       rounded-md
Ghost:     text-navy hover:bg-navy/5                   rounded-md
```

### Inputs
```
border border-cool-gray rounded-sm bg-white px-4 py-2.5
focus:border-teal focus:ring-2 focus:ring-teal/20
font-body text-primary placeholder:text-muted
```

### Cards
```
bg-white rounded-md shadow-sm border border-cool-gray/60
hover:shadow-md transition-shadow
```

### Badges / Status Chips
```
Success:  bg-success/10 text-success border border-success/20  rounded-full
Error:    bg-error/10 text-error border border-error/20        rounded-full
Teal:     bg-teal/10 text-teal border border-teal/20           rounded-full
Navy:     bg-navy/10 text-navy border border-navy/20           rounded-full
```

---

## Navigation Shell

### Sidebar Nav
- **Default state**: Collapsed — shows only icons (width: 64px)
- **Open state**: Expanded — icons + labels (width: 240px)
- **Trigger**: Hamburger icon in the top-left of the fixed top bar
- **Background**: `bg-navy` (deep navy)
- **Icon color**: `text-white/60` default, `text-white` active, `text-teal` hover
- **Active indicator**: Left border `border-l-2 border-teal` + `bg-white/10` background
- **Animation**: Smooth `transition-width 200ms ease-in-out`

### Top Header Bar
- Height: 64px fixed
- Background: `bg-white` with `border-b border-cool-gray`
- Contains: Hamburger toggle (left) | Logo + "FirstReport" wordmark (center/left) | Lang switcher + NALSA SOS (right)
- Stacks above sidebar on mobile (sidebar becomes bottom-sheet drawer on mobile)

### Nav Items (in order)
1. 🏠 Home
2. 💬 New Report (→ /chat)
3. 📋 Classification (→ /classify)
4. 📄 Documents (→ /documents)
5. 🕐 History (→ /history)
6. ⚙️ Settings (bottom of sidebar)

---

## What to Strip (Old System)

Remove every reference to:
- `.bauhaus-card`, `.bauhaus-btn`, `.bauhaus-tile`
- `shadow-bauhaus`, `shadow-bauhaus-sm/md/lg/xl`
- `border-bauhaus-*`, `bg-bauhaus-*`, `text-bauhaus-*`
- Newsprint dot-grid background texture on `<body>`
- `border-radius: 0 !important` global enforcer
- `.ornament`, `.drop-cap`, `.halftone`, `.gilded-corner`, `.kicker` (newsprint ornaments)
- Hard offset shadow utilities
- `font-family: 'Lora'` as body font (replace with Inter)
- `--paper`, `--ink`, `--accent`, `--bauhaus-*` CSS variables (replace with new tokens)
- `bauhaus-red`, `bauhaus-blue`, `bauhaus-yellow` Tailwind color entries
- `canvas`, `forest`, `cognac`, `oxblood`, `espresso`, `brass`, `moss` aliases

---

## Retained / Kept

- **Playfair Display** — retained as heading font (great legal authority feel)
- **Inter** — promoted to primary UI/body font (replaces Lora)
- **JetBrains Mono** — retained for codes, sections references
- **i18n / multi-language** — all `lang={}` attributes and Noto font imports remain
- **NALSA SOS button** — must remain visible on every screen
- All functional logic (STT, TTS, classify, history, PDF generation) — untouched
- `animate-rec`, `animate-wave`, `animate-pop-in`, `animate-slide-up` keyframes — retained (just re-point to new colors)
