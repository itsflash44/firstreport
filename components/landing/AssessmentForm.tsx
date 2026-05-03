'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LANGUAGES, type LangCode } from '@/lib/i18n';
import { PERSONAS, type PersonaSpec } from '@/lib/personas';

/**
 * ASSESSMENT FORM — the core interactive element.
 * Three-step triage: language → concern → severity.
 * On submit, routes directly into the chat pre-loaded with user selections.
 *
 * Design tokens: navy/teal/error from enterprise palette.
 * Selected state: bg-navy text-white — all child text explicitly white.
 */
const SEVERITY = [
  { val: 1, label: 'Routine',  body: 'Theft, paperwork, refused FIR',         bg: 'bg-teal'  },
  { val: 2, label: 'Serious',  body: 'Repeated harassment, financial loss > ₹1L', bg: 'bg-secondary' },
  { val: 3, label: 'Critical', body: 'Violence, child safety, immediate threat', bg: 'bg-error' },
] as const;

export default function AssessmentForm() {
  const router = useRouter();
  const [lang,     setLang]     = useState<LangCode>('hi-IN');
  const [persona,  setPersona]  = useState<PersonaSpec>(PERSONAS[0]);
  const [severity, setSeverity] = useState<1 | 2 | 3>(1);

  const begin = () => {
    sessionStorage.setItem('language', lang);
    sessionStorage.setItem('persona', persona.id);
    sessionStorage.setItem('intake_severity', String(severity));
    router.push(`/chat?lang=${lang}&persona=${persona.id}`);
  };

  return (
    <section id="assessment" className="py-20 sm:py-28 lg:py-36 bg-off-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">

          {/* LEFT — editorial intro */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-10 h-px bg-teal" />
              <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-secondary">
                Confidential Triage
              </span>
            </div>
            <h2 className="font-serif text-5xl sm:text-6xl lg:text-7xl text-navy leading-[0.92] tracking-tight">
              Begin in <em className="text-teal not-italic">90 seconds.</em>
            </h2>
            <p className="text-lg font-medium text-secondary leading-relaxed">
              Three questions establish the right specialist mode and statute path.
              Voice will take over from there. Nothing leaves your device until you choose to send.
            </p>
            <ul className="space-y-3 pt-4 text-sm font-medium text-secondary">
              {[
                'Encrypted in transit · DPDP Act 2023 compliant',
                'No registration required for triage',
                'Free legal aid escalation via NALSA · 15100',
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal shrink-0" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT — assessment card */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-cool-gray rounded-md shadow-sm p-7 sm:p-10">

              {/* Q1 — Language */}
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-secondary mb-2">
                Question 1 of 3
              </div>
              <h3 className="font-serif text-2xl text-navy mb-5">
                In which language do you wish to proceed?
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-10">
                {LANGUAGES.map((l) => {
                  const active = lang === l.code;
                  return (
                    <button
                      key={l.code}
                      onClick={() => setLang(l.code)}
                      lang={l.bcp47}
                      className={`px-3 py-2.5 border rounded-sm text-left transition-colors
                        ${active
                          ? 'bg-navy text-white border-navy shadow-sm'
                          : 'bg-white text-navy border-cool-gray hover:border-teal hover:bg-teal/5'}
                      `}
                    >
                      <div className="font-serif text-base leading-none">{l.label}</div>
                      <div className={`font-mono text-[9px] uppercase tracking-[0.2em] mt-0.5
                        ${active ? 'text-white/70' : 'text-secondary'}`}>
                        {l.sublabel}
                      </div>
                    </button>
                  );
                })}
              </div>

              <hr className="border-t border-cool-gray mb-8" />

              {/* Q2 — Persona */}
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-secondary mb-2">
                Question 2 of 3
              </div>
              <h3 className="font-serif text-2xl text-navy mb-5">
                Which specialist mode applies?
              </h3>
              <div className="grid sm:grid-cols-2 gap-2 mb-10">
                {PERSONAS.map((p) => {
                  const active = persona.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPersona(p)}
                      className={`flex items-center gap-3 px-4 py-3 border rounded-sm text-left transition-colors
                        ${active
                          ? 'bg-navy text-white border-navy shadow-sm'
                          : 'bg-white text-navy border-cool-gray hover:border-teal hover:bg-teal/5'}
                      `}
                    >
                      {/* Coloured dot */}
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0
                        ${p.color === 'red'  ? 'bg-error' :
                          p.color === 'blue' ? 'bg-navy'  : 'bg-teal'}
                        ${active ? 'ring-2 ring-white/40 ring-offset-1 ring-offset-navy' : ''}
                      `} />
                      <div className="min-w-0">
                        <div className={`font-semibold text-sm leading-none ${active ? 'text-white' : 'text-navy'}`}>
                          {p.titleEn}
                        </div>
                        <div className={`font-mono text-[10px] uppercase tracking-[0.16em] mt-1
                          ${active ? 'text-white/65' : 'text-secondary'}`}>
                          {p.statutes[0]}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <hr className="border-t border-cool-gray mb-8" />

              {/* Q3 — Severity */}
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-secondary mb-2">
                Question 3 of 3
              </div>
              <h3 className="font-serif text-2xl text-navy mb-5">
                How urgent is this matter?
              </h3>
              <div className="grid grid-cols-3 gap-2 mb-10">
                {SEVERITY.map((s) => {
                  const active = severity === s.val;
                  return (
                    <button
                      key={s.val}
                      onClick={() => setSeverity(s.val as 1 | 2 | 3)}
                      className={`p-4 border rounded-sm text-left transition-colors
                        ${active
                          ? `${s.bg} text-white border-transparent shadow-sm`
                          : 'bg-white text-navy border-cool-gray hover:border-teal hover:bg-teal/5'}
                      `}
                    >
                      <div className={`font-semibold uppercase text-xs tracking-[0.16em] ${active ? 'text-white' : 'text-navy'}`}>
                        {s.label}
                      </div>
                      <div className={`text-[10px] font-medium mt-1 leading-snug ${active ? 'text-white/85' : 'text-secondary'}`}>
                        {s.body}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Submit */}
              <button
                onClick={begin}
                className="w-full py-4 bg-navy text-white rounded-sm font-semibold text-sm uppercase tracking-[0.18em]
                           hover:bg-navy/90 active:scale-[0.98] transition-all"
              >
                Begin Confidential Triage →
              </button>
              <p className="text-center font-mono text-[10px] uppercase tracking-[0.22em] text-secondary mt-4">
                Or call NALSA ·{' '}
                <a href="tel:15100" className="text-error hover:underline">15100</a>
                {' '}· free legal aid
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
