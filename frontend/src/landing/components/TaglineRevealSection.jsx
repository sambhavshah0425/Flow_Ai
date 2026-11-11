import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const LINES = [
  ['Describe', 'an', 'automation', 'once.'],
  ['Watch', 'Qwen', 'wire', 'the', 'graph'],
  ['and', 'run', 'every', 'step', 'locally.']
];

const TOTAL_WORDS = LINES.reduce((sum, line) => sum + line.length, 0);

/**
 * B11 mandatory tagline reveal section.
 * Words start muted at 28% opacity and activate one by one in reading order
 * using a single requestAnimationFrame throttled scroll listener.
 */
export function TaglineRevealSection() {
  const sectionRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const [activeWords, setActiveWords] = useState(reduceMotion ? TOTAL_WORDS : 0);

  useEffect(() => {
    if (reduceMotion) {
      setActiveWords(TOTAL_WORDS);
      return;
    }

    let rafPending = false;

    const updateProgress = () => {
      rafPending = false;
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const start = vh * 0.85;
      const end = vh * 0.35;
      const raw = (start - rect.top) / (start - end);
      const clamped = Math.max(0, Math.min(1, raw));
      const count = Math.round(clamped * TOTAL_WORDS);
      setActiveWords(count);
    };

    const onScroll = () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [reduceMotion]);

  let globalWordIndex = 0;

  return (
    <section
      ref={sectionRef}
      aria-label="Core promise"
      className="bg-[#131209] py-24 px-4 sm:px-6"
    >
      <div className="max-w-6xl mx-auto">
        <p className="heading-2 max-w-[680px] text-white">
          {LINES.map((line, lineIdx) => (
            <span key={lineIdx} className="block">
              {line.map((word) => {
                const idx = globalWordIndex;
                globalWordIndex += 1;
                const active = reduceMotion || idx < activeWords;
                return (
                  <span
                    key={`${lineIdx}-${idx}`}
                    className={`lp-word inline-block mr-3 ${
                      active ? 'opacity-100' : 'opacity-30'
                    }`}
                  >
                    {word}
                  </span>
                );
              })}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}

