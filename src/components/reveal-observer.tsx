'use client';

import { useEffect } from 'react';

/**
 * Progressive enhancement for scroll reveals: elements with [data-reveal] are
 * visible by default and only animate once JavaScript is running and the user
 * has not asked for reduced motion.
 */
export function RevealObserver() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const root = document.documentElement;
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    // Anything already on screen stays put; only content further down animates in.
    for (const el of elements) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) el.classList.add('is-visible');
    }
    root.classList.add('reveal-ready');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    for (const el of elements) if (!el.classList.contains('is-visible')) observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return null;
}
