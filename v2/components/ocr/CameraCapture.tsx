'use client';

import type { UseCameraReturn } from '../../hooks/use-camera';

interface CameraCaptureProps {
  camera: UseCameraReturn;
  onCapture: (dataUrl: string) => void;
}

export function CameraCapture({ camera, onCapture }: CameraCaptureProps) {
  const handleCapture = () => {
    const dataUrl = camera.capture();
    if (dataUrl) {
      camera.close();
      onCapture(dataUrl);
    }
  };

  if (camera.state === 'closed') {
    return (
      <button
        onClick={camera.open}
        className="w-full py-12 rounded-xl border-2 border-dashed border-cool-gray bg-white flex flex-col items-center gap-3 hover:border-teal/40 transition-colors focus-visible:outline-2 focus-visible:outline-teal"
      >
        <CameraIcon />
        <span className="text-sm text-text-secondary font-medium">
          Open Camera
        </span>
      </button>
    );
  }

  if (camera.state === 'error') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
        <p className="text-sm text-red-800">{camera.error}</p>
        <button
          onClick={camera.open}
          className="mt-2 text-sm text-red-700 underline font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden bg-black">
      <video
        ref={camera.videoRef as React.RefObject<HTMLVideoElement>}
        autoPlay
        playsInline
        muted
        className="w-full aspect-[4/3] object-cover"
      />

      {camera.state === 'active' && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <button
            onClick={handleCapture}
            aria-label="Take photo"
            className="w-14 h-14 rounded-full bg-white border-4 border-white/50 shadow-lg active:scale-90 transition-transform focus-visible:outline-2 focus-visible:outline-teal"
          >
            <span className="block w-full h-full rounded-full bg-white" />
          </button>
        </div>
      )}

      {camera.state === 'opening' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg className="w-10 h-10 text-text-muted" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    </svg>
  );
}
