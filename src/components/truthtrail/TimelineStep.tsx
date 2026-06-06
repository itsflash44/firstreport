'use client';

import { useRef, useEffect, useState } from 'react';

export interface TimelineStepData {
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'active' | 'pending';
  icon: string;
}

interface TimelineStepProps {
  step: TimelineStepData;
  index: number;
  isLast: boolean;
}

export function TimelineStep({ step, index, isLast }: TimelineStepProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const statusColor = {
    completed: 'bg-success border-success',
    active: 'bg-gold border-gold animate-pulse',
    pending: 'bg-neutral-200 border-neutral-200',
  }[step.status];

  return (
    <div
      ref={ref}
      className={`relative flex gap-4 transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-10 h-10 rounded-full ${statusColor} border-2 flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
          {step.icon}
        </div>
        {!isLast && (
          <div className={`w-0.5 flex-1 min-h-[32px] transition-colors duration-500 ${
            step.status === 'completed' ? 'bg-success/30' : 'bg-neutral-200'
          }`} />
        )}
      </div>

      <div className="pb-8 min-w-0">
        <p className="text-[14px] font-semibold text-navy">{step.title}</p>
        <p className="text-[11px] text-secondary/45 font-medium mt-0.5">{step.timestamp}</p>
        <p className="text-[13px] text-secondary/60 mt-1 leading-relaxed">{step.description}</p>
      </div>
    </div>
  );
}
