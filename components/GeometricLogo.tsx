/**
 * FirstReport wordmark crest — Playfair "F" in a bordered square.
 * Updated to navy/off-white enterprise color palette.
 */
interface GeometricLogoProps {
  size?: number;
  /** Kept for API compat — no-op. */
  animated?: boolean;
}

export default function GeometricLogo({ size = 48 }: GeometricLogoProps) {
  return (
    <span
      className="inline-flex items-center justify-center border border-navy bg-off-white font-serif font-bold text-navy select-none rounded-sm"
      style={{ width: size, height: size, lineHeight: 1, fontSize: size * 0.58 }}
      aria-label="FirstReport"
    >
      F
    </span>
  );
}
