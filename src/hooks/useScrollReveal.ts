'use client';

import { useEffect } from 'react';

/**
 * useScrollReveal — wires IntersectionObserver to every .scroll-reveal
 * element in the document. When an element enters the viewport it gets
 * the .revealed class, triggering the CSS transition defined in globals.css.
 *
 * Call once at the layout or page level. Safe to call multiple times —
 * already-revealed elements are ignored by the observer.
 */
export function useScrollReveal(rootMargin = '0px 0px -60px 0px') {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      // Skip observer — CSS already sets opacity:1 / transform:none via media query
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target); // fire once only
          }
        });
      },
      { rootMargin, threshold: 0.1 }
    );

    const els = document.querySelectorAll<HTMLElement>('.scroll-reveal:not(.revealed)');
    els.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [rootMargin]);
}
