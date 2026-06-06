'use client';

/**
 * FirstReport — Offline Fallback Page
 *
 * Shown by service worker when user is offline and page isn't cached.
 * Reassuring, actionable, in Hindi-first.
 */

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-ivory flex flex-col items-center justify-center px-6 text-center">
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-navy/10 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-navy/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M18.364 5.636a9 9 0 010 12.728m-12.728 0a9 9 0 010-12.728m9.9 2.828a5 5 0 010 7.072M7.464 8.464a5 5 0 000 7.072M12 12h.01" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-navy mb-2">
        इंटरनेट नहीं है
      </h1>
      <p className="text-navy/60 mb-2 max-w-sm">
        आप अभी ऑफलाइन हैं। पर चिंता न करें —
      </p>
      <p className="text-navy/80 font-medium mb-6 max-w-sm">
        आपका सारा डेटा इस डिवाइस पर सुरक्षित है।
        इंटरनेट आने पर सब अपने आप सिंक हो जाएगा।
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => window.location.reload()}
          className="py-3 bg-navy text-white rounded-xl font-semibold text-sm"
        >
          ↺ दोबारा कोशिश करें
        </button>

        <button
          onClick={() => window.history.back()}
          className="py-3 border border-navy/20 text-navy rounded-xl text-sm"
        >
          ← वापस जाएं
        </button>

        <a
          href="tel:15100"
          className="py-3 bg-red-600 text-white rounded-xl font-semibold text-sm text-center"
        >
          📞 NALSA हेल्पलाइन — 15100
        </a>
      </div>

      <p className="mt-8 text-xs text-navy/30">
        FirstReport — आपकी आवाज़, आपका हक़
      </p>
    </div>
  );
}
