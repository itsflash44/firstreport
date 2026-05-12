import type { Config } from 'tailwindcss';

/**
 * FIRSTREPORT — ENTERPRISE LEGAL-TECH DESIGN SYSTEM
 * Clean, professional, confidence-inspiring UI.
 *
 * Primary: Navy (#1A2A44) · Accent: Teal (#5FA8A0) · BG: Off-white (#F7F9FB)
 * Font: Inter (body/UI) · Playfair Display (headings) · JetBrains Mono (codes)
 */
const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './v2/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
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

        // Semantic aliases
        background: '#F7F9FB',
        foreground: '#1A2A44',
        border:     '#D9E2EC',
        white:      '#FFFFFF',

        // Legacy compat — kept for any remaining references that will be cleaned up
        paper:   '#F7F9FB',
        ink:     '#1A2A44',
        accent:  '#5FA8A0',
        canvas:  '#F7F9FB',
      },
      fontFamily: {
        sans:    ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        serif:   ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['Inter', '-apple-system', 'sans-serif'],   // now same as sans
        mono:    ['"JetBrains Mono"', 'Menlo', 'monospace'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      letterSpacing: {
        tightest: '-0.02em',
        widest:   '0.08em',
      },
      borderRadius: {
        sm:   '4px',
        DEFAULT: '6px',
        md:   '8px',
        lg:   '12px',
        xl:   '16px',
        full: '9999px',
      },
      borderWidth: {
        '3': '3px',
        '6': '6px',
      },
      boxShadow: {
        'xs':    '0 1px 2px rgba(26,42,68,0.06)',
        'sm':    '0 1px 4px rgba(26,42,68,0.08), 0 0 1px rgba(26,42,68,0.04)',
        'md':    '0 4px 12px rgba(26,42,68,0.10), 0 1px 3px rgba(26,42,68,0.06)',
        'lg':    '0 8px 24px rgba(26,42,68,0.12), 0 2px 6px rgba(26,42,68,0.06)',
        'xl':    '0 16px 40px rgba(26,42,68,0.14), 0 4px 10px rgba(26,42,68,0.08)',
        'inner': 'inset 0 1px 3px rgba(26,42,68,0.08)',
      },
      animation: {
        'pop-in':       'popIn 0.2s ease-out forwards',
        'slide-up':     'slideUp 0.3s ease-out forwards',
        'fade-in':      'fadeIn 0.3s ease-out forwards',
        'spin-slow':    'spin 12s linear infinite',
        'rec':          'rec 1s ease-in-out infinite',
        'wave':         'wave 1.2s ease-in-out infinite',
        'pulse-square': 'pulseSquare 2s ease-in-out infinite',
        'marquee':      'marquee 40s linear infinite',
      },
      keyframes: {
        popIn:    { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        slideUp:  { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:   { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        rec:      { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.3' } },
        wave:     { '0%, 100%': { transform: 'scaleY(0.4)' }, '50%': { transform: 'scaleY(1)' } },
        pulseSquare: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%':      { transform: 'scale(1.05)', opacity: '0.85' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
