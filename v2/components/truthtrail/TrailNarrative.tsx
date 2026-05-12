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
      className={`bg-gradient-to-br from-navy/5 to-teal/5 rounded-xl border border-cool-gray p-5 space-y-3 transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <h3 className="text-sm font-semibold text-navy">{title}</h3>
      {paragraphs.map((p, i) => (
        <p key={i} className="text-sm text-text-secondary leading-relaxed">
          {p}
        </p>
      ))}
    </div>
  );
}
