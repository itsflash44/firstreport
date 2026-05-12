/**
 * FirstReport — Browser-Native Image Quality Analysis
 *
 * Runs BEFORE Tesseract OCR to detect:
 * - Blur / camera shake
 * - Low brightness / underexposure
 * - Glare / overexposure
 * - Document cropping at edges
 * - Low resolution
 * - Rotation
 *
 * All computation happens in-browser via Canvas API — zero server dependency.
 */

import type { ImageQuality } from '@/lib/db/dexie';

// ─────────────────────────────────────────────────────────────────────────────
// CANVAS HELPER
// ─────────────────────────────────────────────────────────────────────────────

function fileToImageBitmap(file: File | Blob): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

function getPixelData(bitmap: ImageBitmap): { data: Uint8ClampedArray; width: number; height: number } {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  return { data: imageData.data, width: bitmap.width, height: bitmap.height };
}

// ─────────────────────────────────────────────────────────────────────────────
// BLUR DETECTION — Laplacian Variance
// ─────────────────────────────────────────────────────────────────────────────

function computeLaplacianVariance(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): number {
  // Convert to grayscale and compute Laplacian
  const gray: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    gray.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
  }

  let sum = 0;
  let sumSq = 0;
  let count = 0;

  // 3x3 Laplacian kernel
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const lap =
        -gray[idx - width - 1] - gray[idx - width] - gray[idx - width + 1]
        - gray[idx - 1] + 8 * gray[idx] - gray[idx + 1]
        - gray[idx + width - 1] - gray[idx + width] - gray[idx + width + 1];

      sum += lap;
      sumSq += lap * lap;
      count++;
    }
  }

  const mean = sum / count;
  const variance = sumSq / count - mean * mean;
  return variance;
}

// ─────────────────────────────────────────────────────────────────────────────
// BRIGHTNESS ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

function computeBrightness(data: Uint8ClampedArray): {
  average: number;
  hasGlare: boolean;
  isDark: boolean;
  overexposedPercent: number;
} {
  let sum = 0;
  let overexposed = 0;
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += lum;
    if (lum > 240) overexposed++;
  }

  const average = sum / pixelCount;
  const overexposedPercent = (overexposed / pixelCount) * 100;

  return {
    average,
    hasGlare: overexposedPercent > 15,
    isDark: average < 60,
    overexposedPercent,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CROP DETECTION — check edge brightness uniformity
// ─────────────────────────────────────────────────────────────────────────────

function detectCropping(data: Uint8ClampedArray, width: number, height: number): boolean {
  // Check if text appears at the very edges (document likely cropped)
  const edgePixels: number[] = [];

  // Top 5 rows
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < Math.min(5, height); y++) {
      const i = (y * width + x) * 4;
      edgePixels.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    }
  }

  // Bottom 5 rows
  for (let x = 0; x < width; x++) {
    for (let y = Math.max(0, height - 5); y < height; y++) {
      const i = (y * width + x) * 4;
      edgePixels.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    }
  }

  // If edge pixels have high variance (dark text near edge), likely cropped
  const mean = edgePixels.reduce((a, b) => a + b, 0) / edgePixels.length;
  const variance = edgePixels.reduce((a, b) => a + (b - mean) ** 2, 0) / edgePixels.length;

  // High variance at edges suggests text near border → cropped
  return variance > 2000;
}

// ─────────────────────────────────────────────────────────────────────────────
// ROTATION DETECTION — simplified (aspect ratio heuristic)
// ─────────────────────────────────────────────────────────────────────────────

function detectRotation(width: number, height: number): boolean {
  // Documents are typically portrait (taller than wide)
  // If width > height significantly, likely rotated
  const ratio = width / height;
  return ratio > 1.3; // landscape suggests rotation
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ANALYSIS FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export async function analyzeImageQuality(file: File | Blob): Promise<ImageQuality> {
  const bitmap = await fileToImageBitmap(file);
  const { data, width, height } = getPixelData(bitmap);
  bitmap.close();

  const laplacianVariance = computeLaplacianVariance(data, width, height);
  const brightness = computeBrightness(data);
  const isCropped = detectCropping(data, width, height);
  const isRotated = detectRotation(width, height);

  // Blur: higher variance = sharper image
  // Threshold calibrated for document photography
  const BLUR_THRESHOLD = 100;
  const isBlurry = laplacianVariance < BLUR_THRESHOLD;
  // blurScore: 0 = very blurry, 100 = very sharp
  const blurScore = Math.min(100, Math.max(0, (laplacianVariance / BLUR_THRESHOLD) * 100));

  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (isBlurry) {
    warnings.push('दस्तावेज़ धुंधला है');
    suggestions.push('कैमरे को स्थिर रखें और फिर से फोटो लें');
  }
  if (brightness.isDark) {
    warnings.push('रोशनी कम है');
    suggestions.push('अच्छी रोशनी में फोटो लें');
  }
  if (brightness.hasGlare) {
    warnings.push('चमक / glare है');
    suggestions.push('दस्तावेज़ को सीधी रोशनी से दूर रखें');
  }
  if (isCropped) {
    warnings.push('दस्तावेज़ कटा हुआ दिख रहा है');
    suggestions.push('पूरे दस्तावेज़ को फ्रेम में रखें');
  }
  if (isRotated) {
    warnings.push('दस्तावेज़ घुमा हुआ हो सकता है');
    suggestions.push('दस्तावेज़ को सीधा पकड़कर फोटो लें');
  }
  if (width < 800 || height < 600) {
    warnings.push('रिज़ॉल्यूशन कम है');
    suggestions.push('कैमरे को दस्तावेज़ के करीब लाएं');
  }

  // Overall score computation
  let score = 100;
  if (isBlurry) score -= 35;
  if (brightness.isDark) score -= 20;
  if (brightness.hasGlare) score -= 15;
  if (isCropped) score -= 20;
  if (isRotated) score -= 10;
  if (width < 800 || height < 600) score -= 15;

  return {
    overallScore: Math.max(0, score),
    isBlurry,
    blurScore: Math.round(blurScore),
    brightness: Math.round(brightness.average),
    hasGlare: brightness.hasGlare,
    isCropped,
    isRotated,
    resolution: { width, height },
    warnings,
    suggestions,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// QUALITY GATE — should we proceed with OCR?
// ─────────────────────────────────────────────────────────────────────────────

export function shouldProceedWithOCR(quality: ImageQuality): {
  proceed: boolean;
  reason?: string;
} {
  if (quality.overallScore < 20) {
    return {
      proceed: false,
      reason: 'दस्तावेज़ की क्वालिटी बहुत खराब है। कृपया बेहतर फोटो लें।',
    };
  }
  return { proceed: true };
}
