'use client';

import { useRef, useEffect, useState } from 'react';

interface TrailNarrativeProps {
  title: string;
  paragraphs: string[];
}

export function TrailNarrative({ title, paragraphs }: TrailNarrativeProps) {
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
      { threshold: 0.2 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`bg-gradient-to-br from-navy/[0.03] to-gold/[0.03] rounded-2xl border border-neutral-200/50 p-5 space-y-3 transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <h3 className="text-[14px] font-semibold text-navy">{title}</h3>
      {paragraphs.map((p, i) => (
        <p key={i} className="text-[13px] text-secondary/60 leading-[1.7]">
          {p}
        </p>
      ))}
    </div>
  );
}
