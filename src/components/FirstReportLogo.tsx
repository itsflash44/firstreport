/**
 * FirstReport — Official SVG Brand Logo
 *
 * A shield (protection + law) containing three sound-wave bars (voice-first).
 * Clean, professional — no decorative flourishes.
 *
 * Variants:
 *   icon      — Shield icon only
 *   wordmark  — Shield + "FirstReport" text side-by-side
 *   full      — Shield + "FirstReport" + tagline stacked
 *
 * Themes:
 *   light     — Navy shield on transparent bg (for white/off-white backgrounds)
 *   dark      — Off-white shield on transparent bg (for navy/dark backgrounds)
 */

interface FirstReportLogoProps {
  size?: number;
  variant?: 'icon' | 'wordmark' | 'full';
  theme?: 'light' | 'dark';
  className?: string;
}

export default function FirstReportLogo({
  size = 40,
  variant = 'icon',
  theme = 'light',
  className = '',
}: FirstReportLogoProps) {
  const shieldColor  = theme === 'dark' ? '#F7F9FB' : '#1A2A44';
  const waveColor    = '#5FA8A0';  // teal — same in both themes
  const textColor    = theme === 'dark' ? '#F7F9FB' : '#1A2A44';
  const taglineColor = theme === 'dark' ? 'rgba(247,249,251,0.6)' : 'rgba(26,42,68,0.55)';

  // Shield icon is always square. Font size is proportional.
  const iconSize = size;

  const ShieldSVG = (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* Shield path — rounded pentagon */}
      <path
        d="M16 2L28 7.5V16.5C28 22.5 22 27.5 16 30C10 27.5 4 22.5 4 16.5V7.5L16 2Z"
        fill={shieldColor}
      />
      {/* Sound-wave bars — 3 bars, centered, teal */}
      {/* Left bar */}
      <rect x="11" y="14" width="2.5" height="8" rx="1.25" fill={waveColor} />
      {/* Center bar — tallest */}
      <rect x="14.75" y="10" width="2.5" height="12" rx="1.25" fill={waveColor} />
      {/* Right bar */}
      <rect x="18.5" y="14" width="2.5" height="8" rx="1.25" fill={waveColor} />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <span className={`inline-flex items-center justify-center ${className}`} aria-label="FirstReport">
        {ShieldSVG}
      </span>
    );
  }

  if (variant === 'wordmark') {
    const fontSize = Math.round(size * 0.38);
    const subSize  = Math.round(size * 0.22);
    return (
      <span
        className={`inline-flex items-center gap-2.5 ${className}`}
        aria-label="FirstReport"
      >
        {ShieldSVG}
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: 700,
              fontSize: `${fontSize}px`,
              color: textColor,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            FirstReport
          </span>
        </span>
      </span>
    );
  }

  // variant === 'full' — stacked layout
  const fontSize   = Math.round(size * 0.38);
  const tagSize    = Math.round(size * 0.18);
  return (
    <span
      className={`inline-flex flex-col items-center gap-2 ${className}`}
      aria-label="FirstReport — AI Legal Aid"
    >
      {ShieldSVG}
      <span style={{ textAlign: 'center' }}>
        <span
          style={{
            display: 'block',
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 700,
            fontSize: `${fontSize}px`,
            color: textColor,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          FirstReport
        </span>
        <span
          style={{
            display: 'block',
            fontFamily: 'Inter, -apple-system, sans-serif',
            fontWeight: 500,
            fontSize: `${tagSize}px`,
            color: taglineColor,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginTop: '4px',
          }}
        >
          AI Legal Aid
        </span>
      </span>
    </span>
  );
}
