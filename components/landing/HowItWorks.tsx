'use client';

import SpeakerButton from '@/components/SpeakerButton';

const STEPS = [
  {
    num: 'I',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
    title: 'Speak',
    titleHi: 'बोलें',
    body: 'Hold the mic and describe what happened — in Hindi, Tamil, Punjabi, or any of 9 other Indic languages. Sarvam transcribes it, never asks you to type English.',
    accentColor: 'bg-teal',
    textColor: 'text-teal',
  },
  {
    num: 'II',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
    title: 'Triage',
    titleHi: 'वर्गीकरण',
    body: 'Gemma 4 cross-references your account against BNSS 2023, POCSO, PWDVA, and MWPSC. It determines cognizable vs non-cognizable and whether you need a real lawyer.',
    accentColor: 'bg-navy',
    textColor: 'text-navy',
  },
  {
    num: 'III',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'File',
    titleHi: 'दर्ज करें',
    body: 'Receive ready-to-file documents — SP complaint today, DM petition in 3 days, High Court writ in 18. Delivered on Telegram if you choose.',
    accentColor: 'bg-error',
    textColor: 'text-error',
  },
];

const STEP_SPEAK_TEXT = STEPS.map(
  (s) => `Step ${s.num}: ${s.title}. ${s.body}`
).join(' ');

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-20 sm:py-28 lg:py-36 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Eyebrow + title */}
        <div className="max-w-3xl mb-16 sm:mb-20">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-px bg-teal" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-secondary">
              The Procedure
            </span>
          </div>
          <div className="flex items-start gap-4">
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-navy leading-[1.05] tracking-tight flex-1">
              Three deliberate steps —{' '}
              <em className="text-teal not-italic">no English required.</em>
            </h2>
            <div className="mt-1 shrink-0">
              <SpeakerButton
                text={`How it works. ${STEP_SPEAK_TEXT}`}
                language="en-IN"
                variant="inline"
              />
            </div>
          </div>
        </div>

        {/* Steps row */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {STEPS.map((step, i) => (
            <article
              key={step.num}
              className="relative bg-white border border-cool-gray rounded-md shadow-sm
                         hover:shadow-md transition-shadow duration-200 overflow-hidden"
            >
              {/* Top accent */}
              <div className={`h-1 w-full ${step.accentColor}`} />

              <div className="p-7 sm:p-9">
                {/* Step number + icon */}
                <div className="flex items-center justify-between mb-6">
                  <span className={`font-serif text-6xl font-bold leading-none ${step.textColor}`}>
                    {step.num}
                  </span>
                  <div className={`w-12 h-12 rounded-sm flex items-center justify-center text-white ${step.accentColor}`}>
                    {step.icon}
                  </div>
                </div>

                {/* Title */}
                <div className="mb-3">
                  <h3 className="font-serif text-2xl font-bold text-navy inline">
                    {step.title}
                  </h3>
                  <span className="text-secondary text-sm ml-2">· {step.titleHi}</span>
                </div>

                {/* Body */}
                <p className="text-sm font-medium text-secondary leading-relaxed">
                  {step.body}
                </p>

                {/* Per-step speaker */}
                <div className="mt-5 flex justify-end">
                  <SpeakerButton
                    text={`Step ${step.num}: ${step.title}. ${step.body}`}
                    language="en-IN"
                    variant="mini"
                  />
                </div>
              </div>

              {/* Step connector arrow — desktop only, not on last card */}
              {i < STEPS.length - 1 && (
                <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10
                                w-8 h-8 bg-white border border-cool-gray rounded-full
                                items-center justify-center shadow-sm">
                  <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
