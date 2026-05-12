export interface OcrResult {
  text: string;
  fields: OcrFields;
  success: boolean;
  error?: string;
}

export interface OcrFields {
  officerName: string | null;
  batchNumber: string | null;
  posting: string | null;
  stationName: string | null;
}

const MAX_IMAGE_DIMENSION = 1280;
const BLUR_THRESHOLD = 50;

export function resizeImage(canvas: HTMLCanvasElement, source: HTMLImageElement | HTMLVideoElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  let { width, height } = source instanceof HTMLVideoElement
    ? { width: source.videoWidth, height: source.videoHeight }
    : { width: source.naturalWidth, height: source.naturalHeight };

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    const scale = MAX_IMAGE_DIMENSION / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

export function detectBlur(canvas: HTMLCanvasElement): { isBlurry: boolean; variance: number } {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { isBlurry: true, variance: 0 };

  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const gray = new Float32Array(width * height);

  for (let i = 0; i < gray.length; i++) {
    const r = imageData.data[i * 4];
    const g = imageData.data[i * 4 + 1];
    const b = imageData.data[i * 4 + 2];
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  let sum = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const laplacian =
        -gray[idx - width] - gray[idx - 1] + 4 * gray[idx] - gray[idx + 1] - gray[idx + width];
      sum += laplacian * laplacian;
      count++;
    }
  }

  const variance = count > 0 ? sum / count : 0;
  return { isBlurry: variance < BLUR_THRESHOLD, variance };
}

export function extractFields(text: string): OcrFields {
  const officerNameMatch = text.match(
    /(?:officer|अधिकारी|SHO|Inspector|Sub[\s-]?Inspector|SI|ASI)\s*[:\-]?\s*([A-Za-zऀ-ॿ\s.]+?)(?:\n|$)/i,
  );

  const batchMatch = text.match(
    /(?:batch|बैच|ID|Badge|No\.?)\s*[:\-]?\s*([A-Z0-9\-/]+)/i,
  );

  const postingMatch = text.match(
    /(?:posting|पदस्थापना|posted at|designation)\s*[:\-]?\s*(.+?)(?:\n|$)/i,
  );

  const stationMatch = text.match(
    /(?:police station|थाना|PS|station)\s*[:\-]?\s*(.+?)(?:\n|$)/i,
  );

  return {
    officerName: officerNameMatch?.[1]?.trim() ?? null,
    batchNumber: batchMatch?.[1]?.trim() ?? null,
    posting: postingMatch?.[1]?.trim() ?? null,
    stationName: stationMatch?.[1]?.trim() ?? null,
  };
}

export async function performOcr(imageData: string): Promise<OcrResult> {
  try {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('hin+eng');

    const { data } = await worker.recognize(imageData);
    await worker.terminate();

    const fields = extractFields(data.text);

    return {
      text: data.text,
      fields,
      success: true,
    };
  } catch (err) {
    return {
      text: '',
      fields: { officerName: null, batchNumber: null, posting: null, stationName: null },
      success: false,
      error: err instanceof Error ? err.message : 'OCR failed',
    };
  }
}
