import React from 'react';
import { Reveal } from './Reveal';

/**
 * Editorial section header. The reference pairs a large left-aligned title
 * with its supporting paragraph set to the right on a separate column, rather
 * than a narrow centred stack — that asymmetry is what gives each section a
 * composed masthead instead of a generic centred block.
 *
 * `align="center"` is kept for the few sections where a centred masthead still
 * reads better (final CTA), so existing callers can opt back in.
 */
export function SectionHeading({ eyebrow, title, lede, id, align = 'split' }) {
  if (align === 'center') {
    return (
      <Reveal className="max-w-2xl mx-auto text-center space-y-4 mb-14 px-4">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2 id={id} className="lp-title text-3xl sm:text-4xl">{title}</h2>
        {lede && <p className="lp-lede text-base sm:text-lg">{lede}</p>}
      </Reveal>
    );
  }

  return (
    <Reveal className="mb-14 grid gap-6 lg:grid-cols-12 lg:items-end">
      <div className="lg:col-span-7 space-y-5">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2 id={id} className="lp-title text-[2rem] sm:text-[2.75rem] lg:text-[3.25rem]">
          {title}
        </h2>
      </div>
      {lede && (
        <p className="lp-lede lg:col-span-5 text-base sm:text-[1.05rem] lg:pb-2">{lede}</p>
      )}
    </Reveal>
  );
}

function Eyebrow({ children }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-500 bg-lp-500/10 border border-lp-500/25 rounded-full px-3.5 py-1.5">
      {children}
    </span>
  );
}
