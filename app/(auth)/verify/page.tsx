'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import SpeakerButton from '@/components/SpeakerButton';
import FirstReportLogo from '@/components/FirstReportLogo';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const phone = searchParams.get('phone') || '';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = useCallback(async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    setError('');
    const { error: authError } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
    if (authError) {
      setError('गलत OTP। कृपया फिर से प्रयास करें।');
      setLoading(false);
      return;
    }
    // Sync Supabase Auth user to Prisma User table (non-blocking)
    fetch('/api/auth/sync-user', { method: 'POST' }).catch(() => {});
    router.push('/home');
  }, [otp, phone, router, supabase]);

  useEffect(() => {
    if (otp.length === 6) handleVerify();
  }, [otp, handleVerify]);

  return (
    <div className="min-h-screen bg-off-white flex flex-col items-center justify-center px-6 py-12">
      <SpeakerButton
        text="आपके फ़ोन पर OTP भेजा गया है। कृपया 6 अंकों का कोड दर्ज करें।"
        language="hi-IN"
        variant="floating"
        autoPlay
      />

      <div className="flex flex-col items-center text-center mb-8">
        <FirstReportLogo size={56} variant="full" theme="light" />
        <h1 className="font-serif font-bold text-navy text-3xl sm:text-4xl mt-6 tracking-tight">
          Enter OTP
        </h1>
        <p className="text-sm text-secondary mt-2 font-mono tracking-widest">{phone}</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <input
          type="tel"
          inputMode="numeric"
          maxLength={6}
          placeholder="• • • • • •"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          className="fr-input w-full py-4 text-center text-3xl tracking-[0.5em] font-semibold"
          autoFocus
        />

        <button
          onClick={handleVerify}
          disabled={loading || otp.length !== 6}
          className="w-full py-3.5 bg-navy text-white rounded font-semibold text-sm uppercase tracking-[0.18em]
                     hover:bg-navy/90 active:scale-[0.98]
                     disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'Verifying…' : '✓ Verify'}
        </button>

        {error && (
          <div className="px-4 py-3 bg-error/10 border border-error/20 text-error text-sm font-medium rounded text-center">
            {error}
          </div>
        )}

        <button
          onClick={() => router.back()}
          className="w-full py-2.5 text-sm font-medium text-secondary hover:text-navy transition-colors"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-off-white">
          <FirstReportLogo size={64} variant="icon" theme="light" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
