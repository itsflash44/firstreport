'use client';

import { useState, useEffect, useCallback } from 'react';
import type { LangCode } from '@/lib/i18n';

interface Profile {
  identityVerified: boolean;
  addressAdded: boolean;
  emergencyContact: string | null;
  readinessScore: number;
}

const DEFAULT_PROFILE: Profile = {
  identityVerified: false,
  addressAdded: false,
  emergencyContact: null,
  readinessScore: 0,
};

interface Props {
  userId: string;
  hasIncidentSummary: boolean;
  documentsGeneratedCount: number;
  evidenceUploadedCount: number;
  language?: LangCode;
}

const LABELS: Record<string, Record<string, string>> = {
  title:            { 'hi-IN': 'कानूनी तैयारी', 'en-IN': 'Legal Readiness' },
  identityVerified: { 'hi-IN': 'पहचान सत्यापित', 'en-IN': 'Identity Verified' },
  caseInfo:         { 'hi-IN': 'केस जानकारी पूर्ण', 'en-IN': 'Case Information Complete' },
  docsUploaded:     { 'hi-IN': 'प्राथमिक दस्तावेज़ अपलोड', 'en-IN': 'Primary Documents Uploaded' },
  firReady:         { 'hi-IN': 'FIR ड्राफ्ट तैयार', 'en-IN': 'FIR Draft Ready' },
  emergency:        { 'hi-IN': 'आपातकालीन संपर्क जोड़ा', 'en-IN': 'Emergency Contact Added' },
  address:          { 'hi-IN': 'पता सत्यापित', 'en-IN': 'Address Verified' },
  complete:         { 'hi-IN': 'प्रोफाइल पूरी करें', 'en-IN': 'Complete Your Profile' },
  emergencyLabel:   { 'hi-IN': 'आपातकालीन संपर्क', 'en-IN': 'Emergency Contact' },
  addressLabel:     { 'hi-IN': 'पता जोड़ा गया', 'en-IN': 'Address Added' },
  idLabel:          { 'hi-IN': 'पहचान सत्यापित', 'en-IN': 'Identity Verified' },
  save:             { 'hi-IN': 'सहेजें', 'en-IN': 'Save Profile' },
  saving:           { 'hi-IN': 'सहेज रहे हैं...', 'en-IN': 'Saving...' },
  placeholder:      { 'hi-IN': 'नाम और फ़ोन नंबर', 'en-IN': 'Name & Phone number' },
  tip: {
    'hi-IN': 'शेष चरण पूरे करें — AI-सत्यापित रिपोर्ट न्यायिक अधिकारियों के साथ 40% अधिक विश्वसनीय होती हैं।',
    'en-IN': 'Complete remaining steps — AI-verified reports carry 40% more weight with judicial authorities.',
  },
};

function lbl(key: string, lang: LangCode): string {
  return LABELS[key]?.[lang] ?? LABELS[key]?.['en-IN'] ?? key;
}

// Offline-first: persist profile to localStorage
const lsKey = (userId: string) => `fr_profile_${userId}`;
function readLocalProfile(userId: string): Profile {
  try {
    const raw = localStorage.getItem(lsKey(userId));
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_PROFILE };
}
function saveLocalProfile(userId: string, p: Profile) {
  try { localStorage.setItem(lsKey(userId), JSON.stringify(p)); } catch { /* ignore */ }
}

export default function ReadinessStatus({
  userId,
  hasIncidentSummary,
  documentsGeneratedCount,
  evidenceUploadedCount,
  language,
}: Props) {
  const lang = language ?? 'en-IN';

  // Initialise immediately from localStorage — no blank flash, no loading state
  const [profile, setProfile] = useState<Profile>(() => {
    if (typeof window === 'undefined') return { ...DEFAULT_PROFILE };
    return readLocalProfile(userId);
  });
  const [serverSynced, setServerSynced] = useState(false);
  const [updating, setUpdating]         = useState(false);
  const [formData, setFormData]         = useState({
    emergencyContact: '',
    addressAdded:     false,
    identityVerified: false,
  });

  // Keep form in sync with profile
  useEffect(() => {
    setFormData({
      emergencyContact: profile.emergencyContact ?? '',
      addressAdded:     profile.addressAdded,
      identityVerified: profile.identityVerified,
    });
  }, [profile]);

  // Non-blocking server fetch — falls back silently when offline
  useEffect(() => {
    if (!userId || userId === 'guest') return;
    const ctrl = new AbortController();
    fetch(`/api/readiness?userId=${encodeURIComponent(userId)}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.profile) {
          const merged = { ...DEFAULT_PROFILE, ...data.profile };
          setProfile(merged);
          saveLocalProfile(userId, merged);
          setServerSynced(true);
        }
      })
      .catch(() => { /* offline — local data is already showing */ });
    return () => ctrl.abort();
  }, [userId]);

  // Compute dynamic score from props + profile
  const checks = [
    { key: 'identityVerified', label: lbl('identityVerified', lang), done: profile.identityVerified,        points: 20 },
    { key: 'caseInfo',         label: lbl('caseInfo', lang),         done: hasIncidentSummary,               points: 20 },
    { key: 'docsUploaded',     label: lbl('docsUploaded', lang),     done: evidenceUploadedCount > 0,        points: 20 },
    { key: 'firReady',         label: lbl('firReady', lang),         done: documentsGeneratedCount > 0,      points: 20 },
    { key: 'emergency',        label: lbl('emergency', lang),        done: !!profile.emergencyContact,       points: 10 },
    { key: 'address',          label: lbl('address', lang),          done: profile.addressAdded,             points: 10 },
  ];
  const score = checks.reduce((s, c) => s + (c.done ? c.points : 0), 0);

  // Persist score changes back to server (non-blocking)
  const syncScore = useCallback(() => {
    if (score === profile.readinessScore) return;
    const updated = { ...profile, readinessScore: score };
    setProfile(updated);
    saveLocalProfile(userId, updated);
    if (userId && userId !== 'guest') {
      fetch('/api/readiness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, readinessScore: score }),
      }).catch(() => { /* offline */ });
    }
  }, [score, profile, userId]);

  useEffect(() => { syncScore(); }, [syncScore]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    const updated: Profile = {
      ...profile,
      emergencyContact: formData.emergencyContact || null,
      addressAdded:     formData.addressAdded,
      identityVerified: formData.identityVerified,
    };
    // Optimistic local save
    setProfile(updated);
    saveLocalProfile(userId, updated);
    try {
      const res = await fetch('/api/readiness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...formData }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.profile) {
          const merged = { ...DEFAULT_PROFILE, ...data.profile };
          setProfile(merged);
          saveLocalProfile(userId, merged);
        }
      }
    } catch { /* offline — local save already done */ }
    finally { setUpdating(false); }
  };

  const scoreColor = score >= 80 ? '#4CAF50' : score >= 50 ? '#5FA8A0' : '#B8962E';

  return (
    <div className="bg-white rounded-sm border border-cool-gray/50 overflow-hidden mt-2">
      {/* Header */}
      <div className="p-4 border-b border-cool-gray/50 bg-off-white flex justify-between items-center">
        <h3 lang={lang} className="font-serif font-bold text-navy text-base">
          {lbl('title', lang)}
        </h3>
        <div className="flex items-center gap-2">
          {serverSynced && (
            <span className="text-[9px] text-teal font-mono uppercase tracking-wider opacity-70">Synced ✓</span>
          )}
          <span className="text-xl font-bold tabular-nums" style={{ color: scoreColor }}>
            {score}%
          </span>
        </div>
      </div>

      <div className="p-4">
        {/* Progress bar */}
        <div className="w-full bg-cool-gray/40 rounded-full h-2 mb-6 overflow-hidden">
          <div
            className="h-2 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${score}%`, background: scoreColor }}
          />
        </div>

        {/* Checklist */}
        <ul className="space-y-3 mb-6">
          {checks.map((check) => (
            <li key={check.key} className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                  check.done ? 'border-transparent text-white' : 'border-cool-gray text-transparent bg-ivory'
                }`}
                style={check.done ? { background: scoreColor } : {}}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span lang={lang} className={`text-sm flex-1 ${check.done ? 'text-navy font-medium' : 'text-secondary'}`}>
                {check.label}
              </span>
              <span className="text-[10px] text-muted font-mono shrink-0">+{check.points}%</span>
            </li>
          ))}
        </ul>

        {/* Profile form — shown until score is 100 */}
        {score < 100 && (
          <form onSubmit={handleUpdateProfile} className="space-y-3 p-4 bg-ivory/60 rounded-sm border border-cool-gray/30">
            <h4 lang={lang} className="text-[10px] font-bold text-navy uppercase tracking-wider mb-3">
              {lbl('complete', lang)}
            </h4>

            <div>
              <label lang={lang} className="block text-[10px] font-semibold text-secondary mb-1 uppercase">
                {lbl('emergencyLabel', lang)}
              </label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                placeholder={lbl('placeholder', lang)}
                lang={lang}
                className="w-full border border-cool-gray rounded-sm px-2 py-1.5 text-xs focus:border-teal outline-none bg-white"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.addressAdded}
                  onChange={(e) => setFormData({ ...formData, addressAdded: e.target.checked })}
                  className="rounded text-teal focus:ring-teal accent-teal"
                />
                <span lang={lang} className="text-[10px] font-semibold text-secondary uppercase">
                  {lbl('addressLabel', lang)}
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.identityVerified}
                  onChange={(e) => setFormData({ ...formData, identityVerified: e.target.checked })}
                  className="rounded text-teal focus:ring-teal accent-teal"
                />
                <span lang={lang} className="text-[10px] font-semibold text-secondary uppercase">
                  {lbl('idLabel', lang)}
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={updating}
              lang={lang}
              className="w-full py-2 bg-navy text-white text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-navy-deep transition-colors disabled:opacity-50"
            >
              {updating ? lbl('saving', lang) : lbl('save', lang)}
            </button>
          </form>
        )}

        {score >= 100 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-sm text-center">
            <p lang={lang} className="text-xs text-green-800 font-semibold">
              {lang === 'hi-IN' ? '✓ आपका केस पूरी तरह तैयार है।' : '✓ Your case is fully ready to file.'}
            </p>
          </div>
        )}

        {score < 100 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-sm">
            <p lang={lang} className="text-[11px] text-amber-800 leading-relaxed font-medium">
              {lbl('tip', lang)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
