import type { Config } from 'tailwindcss';

/**
 * FIRSTREPORT — OFFICIAL AUTHORITY DESIGN SYSTEM
 * Premium Legal-Tech · Official × Premium balance
 *
 * Primary:   Deep Navy   #0F1F3D  (court authority)
 * Accent:    Teal        #5FA8A0  (technology / voice)
 * Gold:      Muted Gold  #B8962E  (law seal / citations)
 * Surface:   Ivory       #F5F2EC  (legal paper)
 * Dark Hero: #0F1F3D → #1A2A44
 *
 * Font: Inter (body/UI) · Playfair Display (ALL headings)
 *       JetBrains Mono (citations / codes / statute chips)
 *
 * Rule: Gradient text → HERO HEADLINE ONLY.
 *       Corners → max 4px (sharp = institutional).
 *       Animation → 500–700ms ease-in-out, no bounce.
 *       No glow effects — shadow-lift only.
 */
const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand ─────────────────────────────────────────────────────
        'navy-deep':  '#0F1F3D',   // hero / dark section backgrounds
        navy:         '#1A2A44',   // primary surfaces, card headers (kept for compat)
        teal:         '#5FA8A0',   // accent, CTAs, voice/AI elements
        'teal-dark':  '#4D9990',   // hover state for teal buttons
        gold:         '#B8962E',   // muted law-seal gold — stat numbers, § citations
        ivory:        '#F5F2EC',   // warm off-white — legal paper background
        'cool-gray':  '#D9E2EC',   // borders, dividers
        'off-white':  '#F5F2EC',   // alias for ivory (backwards compat)

        // ── Status ────────────────────────────────────────────────────
        success:  '#4CAF50',
        error:    '#D9534F',
        warning:  '#F0AD4E',

        // ── Text ──────────────────────────────────────────────────────
        primary:   '#0F1F3D',
        secondary: '#4A5568',
        muted:     '#A0AEC0',

        // ── Neutrals ──────────────────────────────────────────────────
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

        // ── Semantic aliases ──────────────────────────────────────────
        background: '#F5F2EC',
        foreground: '#0F1F3D',
        border:     '#D9E2EC',
        white:      '#FFFFFF',

        // ── Legacy compat ─────────────────────────────────────────────
        paper:  '#F5F2EC',
        ink:    '#0F1F3D',
        accent: '#5FA8A0',
        canvas: '#F5F2EC',
      },

      fontFamily: {
        sans:    ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        serif:   ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['Inter', '-apple-system', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'Menlo', 'monospace'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },

      letterSpacing: {
        tightest:  '-0.02em',
        widest:    '0.08em',
        authority: '0.32em',  // eyebrows on dark sections
      },

      // Sharp corners — max 4px for official feel
      borderRadius: {
        sm:      '2px',
        DEFAULT: '4px',
        md:      '4px',
        lg:      '6px',
        xl:      '8px',
        full:    '9999px',
      },

      borderWidth: {
        '3': '3px',
        '6': '6px',
      },

      // Shadow-lift only — no glow colours
      boxShadow: {
        'xs':    '0 1px 2px rgba(15,31,61,0.06)',
        'sm':    '0 1px 4px rgba(15,31,61,0.08), 0 0 1px rgba(15,31,61,0.04)',
        'md':    '0 4px 12px rgba(15,31,61,0.10), 0 1px 3px rgba(15,31,61,0.06)',
        'lg':    '0 8px 24px rgba(15,31,61,0.13), 0 2px 6px rgba(15,31,61,0.07)',
        'xl':    '0 16px 40px rgba(15,31,61,0.15), 0 4px 10px rgba(15,31,61,0.08)',
        'card':  '0 2px 8px rgba(15,31,61,0.08), 0 0 1px rgba(15,31,61,0.05)',
        'lift':  '0 8px 28px rgba(15,31,61,0.14), 0 2px 8px rgba(15,31,61,0.08)',
        'inner': 'inset 0 1px 3px rgba(15,31,61,0.08)',
        // Glass cards on dark backgrounds
        'glass': '0 4px 16px rgba(0,0,0,0.24), 0 1px 4px rgba(0,0,0,0.12)',
        'glass-lift': '0 8px 32px rgba(0,0,0,0.32), 0 2px 8px rgba(0,0,0,0.16)',
      },

      // Dignified animations — 500–700ms ease-in-out, no bounce
      animation: {
        // Reveal
        'reveal':       'reveal 0.6s ease-in-out forwards',
        'reveal-up':    'revealUp 0.6s ease-in-out forwards',
        'fade-in':      'fadeIn 0.5s ease-in-out forwards',
        // Legacy (kept for mic/wave states)
        'pop-in':       'popIn 0.25s ease-out forwards',
        'slide-up':     'slideUp 0.5s ease-in-out forwards',
        'spin-slow':    'spin 12s linear infinite',
        'rec':          'rec 1.2s ease-in-out infinite',
        'wave':         'wave 1.4s ease-in-out infinite',
        'pulse-square': 'pulseSquare 2.4s ease-in-out infinite',
        // Marquee — steady pace
        'marquee':      'marquee 48s linear infinite',
        'marquee-pause': 'marquee 48s linear infinite paused',
        // Mic pulse rings
        'ring-1':       'ring 1.8s ease-out infinite',
        'ring-2':       'ring 1.8s ease-out 0.6s infinite',
        // Counter shimmer
        'shimmer':      'shimmer 2s ease-in-out infinite',
        // Dashed border march for "Others" card
        'dash-march':   'dashMarch 1.2s linear infinite',
      },

      keyframes: {
        reveal:    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        revealUp:  {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn:    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        popIn:     { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        slideUp:   {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        rec:      { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.3' } },
        wave:     { '0%, 100%': { transform: 'scaleY(0.4)' }, '50%': { transform: 'scaleY(1)' } },
        pulseSquare: {
          '0%, 100%': { transform: 'scale(1)',    opacity: '1' },
          '50%':      { transform: 'scale(1.04)', opacity: '0.88' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        ring: {
          '0%':   { transform: 'scale(1)',   opacity: '0.7' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
        dashMarch: {
          '0%':   { strokeDashoffset: '0' },
          '100%': { strokeDashoffset: '-24' },
        },
      },

      backgroundImage: {
        // Hero dark gradient — pure navy, no purple drift
        'hero':         'linear-gradient(160deg, #0F1F3D 0%, #1A2A44 60%, #0E2530 100%)',
        // Dark sections
        'dark-section': 'linear-gradient(180deg, #0F1F3D 0%, #12263A 100%)',
        // Subtle ivory body gradient
        'ivory-wash':   'linear-gradient(180deg, #F5F2EC 0%, #EDE9E0 100%)',
        // Gold shimmer for stat numbers — used via animate-shimmer
        'gold-shimmer': 'linear-gradient(90deg, #B8962E 0%, #D4B04A 40%, #B8962E 60%, #8C7020 100%)',
        // Hero headline gradient — USED ONLY ON HERO HEADLINE
        'gradient-headline': 'linear-gradient(90deg, #5FA8A0 0%, #B8962E 100%)',
      },

      backdropBlur: {
        xs: '4px',
        sm: '8px',   // max for glass cards — restrained
        md: '12px',  // nav only
      },
    },
  },
  plugins: [],
};

export default config;
