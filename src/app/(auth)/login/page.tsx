'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigationWithQuery } from '@/lib/useNavigationWithQuery';
import { createClient } from '@/lib/supabase/client';
import FirstReportLogo from '@/components/FirstReportLogo';
import SpeakerButton from '@/components/chat/SpeakerButton';
import { createCase } from '@/lib/legalJourney';

type AuthTab = 'phone' | 'email';

export default function LoginPage() {
  const router = useNavigationWithQuery();
  const supabase = createClient();

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<AuthTab>('phone');

  // ── Phone OTP ──────────────────────────────────────────────────────────────
  const [phone, setPhone]   = useState('');

  // ── Email / Password ───────────────────────────────────────────────────────
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);  // toggle login ↔ create account

  // ── Shared ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [optOut, setOptOut]   = useState(false);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const clearMessages = () => { setError(''); setSuccess(''); };

  /**
   * Classify Supabase Auth error messages into user-friendly Hindi strings.
   * This is the central error handler — keeps the UI consistent.
   */
  function classifyAuthError(msg: string): string {
    const m = msg.toLowerCase();
    if (m.includes('user already registered') || m.includes('already been registered') || m.includes('email already')) {
      return 'यह ईमेल पहले से पंजीकृत है। नीचे "लॉगिन करें" चुनें।';
    }
    if (m.includes('invalid login credentials') || m.includes('invalid email or password')) {
      return 'ईमेल या पासवर्ड गलत है। कृपया दोबारा जाँचें।';
    }
    if (m.includes('email not confirmed')) {
      return 'आपका ईमेल सत्यापित नहीं हुआ। कृपया अपना ईमेल खोलें और लिंक पर क्लिक करें।';
    }
    if (m.includes('password') && m.includes('weak')) {
      return 'पासवर्ड बहुत सरल है। कम से कम 6 अक्षर और एक संख्या डालें।';
    }
    if (m.includes('rate limit') || m.includes('too many')) {
      return 'बहुत अधिक प्रयास हुए। कृपया 1 मिनट बाद दोबारा कोशिश करें।';
    }
    if (m.includes('provider') || m.includes('not enabled')) {
      return '__GOOGLE_NOT_CONFIGURED__';
    }
    return `लॉगिन में समस्या: ${msg}`;
  }

  // ── Phone OTP handler ──────────────────────────────────────────────────────
  const handlePhoneOTP = async () => {
    if (!phone || phone.length < 10) {
      setError('कृपया सही फ़ोन नंबर दर्ज करें');
      return;
    }
    setLoading(true);
    clearMessages();
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

  // ── Email / Password handler ───────────────────────────────────────────────
  const handleEmail = async () => {
    if (!email.trim() || !password) {
      setError('ईमेल और पासवर्ड दोनों आवश्यक हैं');
      return;
    }
    if (password.length < 6) {
      setError('पासवर्ड कम से कम 6 अक्षर का होना चाहिए');
      return;
    }
    setLoading(true);
    clearMessages();

    if (isSignUp) {
      // ── Create new account ───────────────────────────────────────────────
      const { error: signUpErr } = await supabase.auth.signUp({
        email:    email.trim(),
        password,
        options:  { data: { training_optout: optOut } },
      });

      if (signUpErr) {
        setError(classifyAuthError(signUpErr.message));
        setLoading(false);
        return;
      }

      setSuccess('✓ अकाउंट बना दिया गया! कृपया अपना ईमेल खोलें और कन्फ़र्म करें, फिर लॉगिन करें।');
      setIsSignUp(false);   // flip to login tab
      setLoading(false);
    } else {
      // ── Sign in with existing account ────────────────────────────────────
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email:    email.trim(),
        password,
      });

      if (signInErr) {
        // Special case: user exists but tries to "sign in" without an account
        if (signInErr.message.toLowerCase().includes('invalid login')) {
          setError('ईमेल या पासवर्ड गलत है। नया खाता बनाने के लिए नीचे "नया खाता बनाएँ" चुनें।');
        } else {
          setError(classifyAuthError(signInErr.message));
        }
        setLoading(false);
        return;
      }

      // Sync to Prisma (non-blocking)
      fetch('/api/auth/sync-user', { method: 'POST' }).catch(() => {});
      router.push('/home');
    }
  };

  // ── Google OAuth ───────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setLoading(true);
    clearMessages();
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo:  `${window.location.origin}/home`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      if (authError) {
        setError(classifyAuthError(authError.message));
        setLoading(false);
      }
    } catch {
      setError('Google लॉगिन उपलब्ध नहीं। OTP या ईमेल से लॉगिन करें।');
      setLoading(false);
    }
  };

  const welcomeText = 'फ़र्स्टरिपोर्ट में आपका स्वागत है। आपकी आवाज़, आपका हक़।';

  return (
    <div className="min-h-screen bg-off-white flex flex-col">
      <div className="flex-1 grid lg:grid-cols-2">

        {/* ── LEFT — navy panel ────────────────────────────────────────────── */}
        <div className="hidden lg:flex relative flex-col justify-between p-12 overflow-hidden"
             style={{ background: 'linear-gradient(135deg, #1A2A44 0%, #243B58 100%)' }}>
          <div className="absolute inset-0 opacity-5"
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          <div className="relative z-10 flex items-center gap-3">
            <FirstReportLogo size={48} variant="wordmark" theme="dark" />
            <span className="text-xs text-white/50 font-mono tracking-widest">AI Legal Aid · India</span>
          </div>
          <div className="relative z-10">
            <h1 className="font-serif font-bold text-white text-5xl xl:text-6xl leading-tight tracking-tight">
              Your Voice.<br />
              <span className="text-teal">Your Right.</span>
            </h1>
            <p className="mt-5 text-white/70 text-lg leading-relaxed max-w-sm">
              11 languages. Voice-first. No typing required.
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-6">
              {['BNSS', 'POCSO', 'PWDVA', 'MWPSC'].map((s) => (
                <span key={s} className="text-xs text-white/40 font-mono tracking-widest">{s}</span>
              ))}
            </div>
          </div>
          <div className="relative z-10">
            <a href="tel:15100"
               className="inline-flex items-center gap-2 text-white/60 text-xs hover:text-white transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-error animate-rec" />
              NALSA Helpline · 15100
            </a>
          </div>
        </div>

        {/* ── RIGHT — form ─────────────────────────────────────────────────── */}
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
              फ़ोन नंबर, ईमेल, या Google से लॉगिन करें।
            </p>

            {/* ── Tab switcher ─────────────────────────────────────────────── */}
            <div className="flex gap-1 mt-6 p-1 bg-cool-gray/40 rounded-lg">
              <button
                onClick={() => { setTab('phone'); clearMessages(); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                  tab === 'phone'
                    ? 'bg-white text-navy shadow-sm'
                    : 'text-secondary hover:text-navy'
                }`}
              >
                📱 फ़ोन OTP
              </button>
              <button
                onClick={() => { setTab('email'); clearMessages(); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                  tab === 'email'
                    ? 'bg-white text-navy shadow-sm'
                    : 'text-secondary hover:text-navy'
                }`}
              >
                ✉️ ईमेल
              </button>
            </div>

            <div className="mt-5 space-y-3">

              {/* ── Phone tab ──────────────────────────────────────────────── */}
              {tab === 'phone' && (
                <>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-navy text-sm select-none">
                      +91
                    </span>
                    <input
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
                    onClick={handlePhoneOTP}
                    disabled={loading}
                    className="fr-btn-primary w-full py-3.5 text-sm disabled:opacity-50 disabled:cursor-wait"
                  >
                    {loading ? 'भेज रहे हैं…' : 'OTP भेजें'}
                  </button>
                </>
              )}

              {/* ── Email tab ──────────────────────────────────────────────── */}
              {tab === 'email' && (
                <>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-secondary uppercase tracking-wide">
                      {isSignUp ? 'नया खाता बनाएँ' : 'लॉगिन करें'}
                    </span>
                    <button
                      onClick={() => { setIsSignUp(!isSignUp); clearMessages(); }}
                      className="text-xs text-teal font-semibold hover:underline"
                    >
                      {isSignUp ? '← पहले से खाता है? लॉगिन करें' : 'नया खाता बनाएँ →'}
                    </button>
                  </div>

                  <input
                    type="email"
                    placeholder="ईमेल पता"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="fr-input w-full px-4 py-3.5 text-base"
                  />
                  <input
                    type="password"
                    placeholder={isSignUp ? 'पासवर्ड बनाएँ (कम से कम 6 अक्षर)' : 'पासवर्ड'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    className="fr-input w-full px-4 py-3.5 text-base"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleEmail(); }}
                  />
                  <button
                    onClick={handleEmail}
                    disabled={loading}
                    className="fr-btn-primary w-full py-3.5 text-sm disabled:opacity-50 disabled:cursor-wait"
                  >
                    {loading
                      ? (isSignUp ? 'खाता बना रहे हैं…' : 'लॉगिन हो रहे हैं…')
                      : (isSignUp ? 'खाता बनाएँ' : 'लॉगिन करें')}
                  </button>
                </>
              )}

              {/* Demo mode */}
              <button
                onClick={() => {
                  sessionStorage.setItem('training_optout', String(optOut));
                  sessionStorage.setItem('demo_mode',       'true');
                  sessionStorage.setItem('language',        'hi-IN');
                  sessionStorage.setItem('persona',         'women_dv');
                  sessionStorage.setItem('intake_severity', '2');
                  const newCase = createCase({
                    title: 'Demo Case',
                    personaId: 'women_dv',
                    language: 'hi-IN',
                    severity: 'serious',
                    incidentSummary: 'सुनीता देवी, 38 वर्ष, घरेलू सहायिका, गाज़ियाबाद। पड़ोसी ने अलमारी से पैसे चुराए। गोविंदपुरम थाने ने FIR दर्ज करने से मना कर दिया।',
                  });
                  router.push(`/case/${newCase.id}?demo=true`);
                }}
                className="w-full py-3 text-sm font-semibold bg-cool-gray text-navy rounded hover:bg-neutral-200 transition-colors"
              >
                Demo Mode · Skip Login
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 py-1">
                <div className="flex-1 h-px bg-cool-gray" />
                <span className="text-xs text-muted font-medium">या</span>
                <div className="flex-1 h-px bg-cool-gray" />
              </div>

              {/* Google */}
              <button
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
                Google से लॉगिन
              </button>

              {/* ── Error / success banners ──────────────────────────────── */}
              {error === '__GOOGLE_NOT_CONFIGURED__' ? (
                <div className="px-4 py-4 bg-amber-50 border border-amber-200 rounded-md space-y-2">
                  <p className="text-sm font-semibold text-amber-800">⚙️ Google login needs one-time setup</p>
                  <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside leading-relaxed">
                    <li>Open <strong>Supabase Dashboard → Authentication → Providers</strong></li>
                    <li>Enable <strong>Google</strong> provider</li>
                    <li>Add OAuth Client ID + Secret from <strong>console.cloud.google.com</strong></li>
                    <li>Set redirect URI to{' '}
                      <code className="bg-amber-100 px-1 py-0.5 rounded text-[10px] break-all">
                        https://lrjsehyaownymovryeru.supabase.co/auth/v1/callback
                      </code>
                    </li>
                  </ol>
                  <p className="text-xs text-amber-600 font-medium">Until then, use Phone OTP or Email above ↑</p>
                </div>
              ) : error ? (
                <div className="px-4 py-3 bg-error/10 border border-error/20 text-error text-sm rounded font-medium leading-snug">
                  {error}
                </div>
              ) : null}

              {success && (
                <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded font-medium leading-snug">
                  {success}
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
                <a href="tel:15100" className="text-error font-semibold hover:underline">
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
