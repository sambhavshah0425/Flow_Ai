import React from 'react';
import { Reveal } from './Reveal';

/**
 * Consistent section header: eyebrow chip + title + optional lede paragraph.
 */
export function SectionHeading({ eyebrow, title, lede, id }) {
  return (
    <Reveal className="max-w-2xl mx-auto text-center space-y-4 mb-14 px-4">
      {eyebrow && (
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-500 bg-brand-500/10 border border-brand-500/20 rounded-full px-3.5 py-1.5">
          {eyebrow}
        </span>
      )}
      <h2 id={id} className="text-3xl sm:text-4xl font-bold text-white tracking-tight text-balance">
        {title}
      </h2>
      {lede && <p className="text-slate-400 text-base sm:text-lg leading-relaxed">{lede}</p>}
    </Reveal>
  );
}
