'use client';

import { useCamera } from '@/v2/hooks/use-camera';
import { useOcr } from '@/v2/hooks/use-ocr';
import { CameraCapture } from '@/v2/components/ocr/CameraCapture';
import { OcrResultCard } from '@/v2/components/ocr/OcrResultCard';

export default function OcrPage() {
  const camera = useCamera();
  const { phase, result, blurWarning, error, processImage, reset } = useOcr();

  const handleCapture = (dataUrl: string) => {
    processImage(dataUrl);
  };

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-4">
      <h1 className="text-lg font-semibold text-navy">
        Scan Notice Board
      </h1>
      <p className="text-sm text-text-secondary">
        Take a photo of the police station notice board to extract officer details.
      </p>

      {phase === 'idle' && (
        <CameraCapture camera={camera} onCapture={handleCapture} />
      )}

      {(phase === 'checking' || phase === 'processing') && (
        <div className="flex flex-col items-center gap-3 py-12">
          <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-text-secondary">
            {phase === 'checking' ? 'Checking image quality…' : 'Reading text…'}
          </span>
        </div>
      )}

      {phase === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center space-y-2">
          <p className="text-sm text-red-800">{error}</p>
          <button onClick={reset} className="text-sm text-red-700 underline font-medium">
            Try again
          </button>
        </div>
      )}

      {phase === 'done' && result && (
        <>
          <OcrResultCard
            fields={result.fields}
            rawText={result.text}
            blurWarning={blurWarning}
          />
          <button
            onClick={reset}
            className="w-full py-3 rounded-xl bg-teal/10 text-teal font-semibold text-sm transition-all hover:bg-teal/20 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-teal"
          >
            Scan Again
          </button>
        </>
      )}
    </div>
  );
}
