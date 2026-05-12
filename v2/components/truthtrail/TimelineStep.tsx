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
    completed: 'bg-green-500 border-green-500',
    active: 'bg-teal border-teal animate-pulse',
    pending: 'bg-cool-gray border-cool-gray',
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
        <div className={`w-10 h-10 rounded-full ${statusColor} border-2 flex items-center justify-center text-white text-sm font-semibold shadow-sm`}>
          {step.icon}
        </div>
        {!isLast && (
          <div className={`w-0.5 flex-1 min-h-[32px] transition-colors duration-500 ${
            step.status === 'completed' ? 'bg-green-300' : 'bg-cool-gray'
          }`} />
        )}
      </div>

      <div className="pb-8 min-w-0">
        <p className="text-sm font-semibold text-navy">{step.title}</p>
        <p className="text-xs text-text-secondary mt-0.5">{step.timestamp}</p>
        <p className="text-sm text-text-secondary mt-1 leading-relaxed">{step.description}</p>
      </div>
    </div>
  );
}
