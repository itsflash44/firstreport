'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import FirstReportLogo from '@/components/FirstReportLogo';
import SpeakerButton from '@/components/SpeakerButton';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [optOut, setOptOut] = useState(false);

  const handlePhoneOTP = async () => {
    if (!phone || phone.length < 10) {
      setError('कृपया सही फ़ोन नंबर दर्ज करें');
      return;
    }
    setLoading(true);
    setError('');
    const fullPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
    const { error: authError } = await supabase.auth.signInWithOtp({ phone: fullPhone });
    if (authError) {
      setError('OTP भेजने में समस्या हुई। कृपया फिर से प्रयास करें।');
      setLoading(false);
      return;
    }
    sessionStorage.setItem('training_optout', String(optOut));
    router.push(`/verify?phone=${encodeURIComponent(fullPhone)}`);
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/home` },
    });
    if (authError) {
      setError('Google लॉगिन में समस्या हुई।');
      setLoading(false);
    }
  };

  const welcomeText = 'फ़र्स्टरिपोर्ट में आपका स्वागत है। आपकी आवाज़, आपका हक़।';

  return (
    <div className="min-h-screen bg-off-white flex flex-col">
      <div className="flex-1 grid lg:grid-cols-2">

        {/* LEFT — Clean navy panel */}
        <div className="hidden lg:flex relative flex-col justify-between p-12 overflow-hidden"
             style={{ background: 'linear-gradient(135deg, #1A2A44 0%, #243B58 100%)' }}>

          {/* Subtle pattern */}
          <div className="absolute inset-0 opacity-5"
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

          {/* Logo block */}
          <div className="relative z-10 flex items-center gap-3">
            <FirstReportLogo size={48} variant="wordmark" theme="dark" />
            <span className="text-xs text-white/50 font-mono tracking-widest">AI Legal Aid · India</span>
          </div>

          {/* Headline */}
          <div className="relative z-10">
            <h1 className="font-serif font-bold text-white text-5xl xl:text-6xl leading-tight tracking-tight">
              Your Voice.<br />
              <span className="text-teal">Your Right.</span>
            </h1>
            <p className="mt-5 text-white/70 text-lg leading-relaxed max-w-sm">
              11 languages. Voice-first. No typing required.
            </p>
            {/* Trust badges */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-6">
              {['BNSS', 'POCSO', 'PWDVA', 'MWPSC'].map((s) => (
                <span key={s} className="text-xs text-white/40 font-mono tracking-widest">{s}</span>
              ))}
            </div>
          </div>

          {/* Bottom NALSA */}
          <div className="relative z-10">
            <a href="tel:15100"
               className="inline-flex items-center gap-2 text-white/60 text-xs hover:text-white transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-error animate-rec" />
              NALSA Helpline · 15100
            </a>
          </div>
        </div>

        {/* RIGHT — Form */}
        <div className="relative flex flex-col items-center justify-center px-6 py-12 sm:px-12 bg-white">
          <SpeakerButton text={welcomeText} language="hi-IN" variant="floating" />

          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden flex flex-col items-start gap-1 mb-8">
              <FirstReportLogo size={44} variant="wordmark" theme="light" />
              <span className="text-xs text-muted">आपकी आवाज़, आपका हक़</span>
            </div>

            <h2 className="font-serif font-bold text-navy text-3xl sm:text-4xl tracking-tight">
              Sign In
            </h2>
            <p className="text-sm text-secondary mt-2">
              फ़ोन नंबर डालें या Google से लॉगिन करें।
            </p>

            <div className="mt-8 space-y-4">
              {/* Phone input */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-navy text-sm select-none">
                  +91
                </span>
                <input
                  id="phone-input"
                  type="tel"
                  inputMode="numeric"
                  placeholder="फ़ोन नंबर"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  maxLength={10}
                  className="fr-input w-full pl-14 pr-4 py-3.5 text-base"
                />
              </div>

              <button
                id="otp-btn"
                onClick={handlePhoneOTP}
                disabled={loading}
                className="fr-btn-primary w-full py-3.5 text-sm disabled:opacity-50 disabled:cursor-wait"
              >
                {loading ? 'भेज रहे हैं…' : 'OTP भेजें'}
              </button>

              {/* Demo bypass */}
              <button
                id="demo-mode-btn"
                onClick={() => {
                  sessionStorage.setItem('training_optout', String(optOut));
                  router.push('/home');
                }}
                className="w-full py-3 text-sm font-semibold bg-cool-gray text-navy rounded hover:bg-neutral-200 transition-colors"
              >
                Demo Mode · Skip OTP
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 py-1">
                <div className="flex-1 h-px bg-cool-gray" />
                <span className="text-xs text-muted font-medium">OR</span>
                <div className="flex-1 h-px bg-cool-gray" />
              </div>

              {/* Google */}
              <button
                id="google-btn"
                onClick={handleGoogle}
                disabled={loading}
                className="w-full py-3 text-sm font-medium bg-white text-primary border border-cool-gray rounded
                           hover:bg-off-white disabled:opacity-50
                           flex items-center justify-center gap-3 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>

              {error && (
                <div className="px-4 py-3 bg-error/10 border border-error/20 text-error text-sm rounded font-medium">
                  {error}
                </div>
              )}

              <label className="flex items-start gap-3 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={optOut}
                  onChange={(e) => setOptOut(e.target.checked)}
                  className="mt-0.5 w-4 h-4 border border-cool-gray rounded accent-navy"
                />
                <span className="text-xs text-muted leading-snug">
                  AI प्रशिक्षण में मेरा डेटा उपयोग न करें · आपकी जानकारी सुरक्षित रहेगी।
                </span>
              </label>

              <p className="text-[11px] text-muted text-center pt-4">
                यह AI-सहायता है · NALSA हेल्पलाइन{' '}
                <a href="tel:15100" id="nalsa-login-link" className="text-error font-semibold hover:underline">
                  15100
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
