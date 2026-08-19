import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const ACCENT = {
  run: { text: 'text-run-400', glow: 'group-hover:shadow-[0_0_40px_-12px_rgba(52,211,153,0.35)]', bar: 'from-transparent to-run-500/15', dot: 'bg-run-500/40' },
  aiv: { text: 'text-aiv-400', glow: 'group-hover:shadow-[0_0_40px_-12px_rgba(167,139,250,0.35)]', bar: 'from-transparent to-aiv-500/15', dot: 'bg-aiv-500/40' },
  flow: { text: 'text-flow-400', glow: 'group-hover:shadow-[0_0_40px_-12px_rgba(34,211,238,0.30)]', bar: 'from-transparent to-flow-500/15', dot: 'bg-flow-500/40' },
  brand: { text: 'text-brand-400', glow: 'group-hover:shadow-[0_0_40px_-12px_rgba(59,130,246,0.35)]', bar: 'from-transparent to-brand-500/15', dot: 'bg-brand-500/40' }
};

/**
 * A capability "claim" (icon + title + description) paired with a mini terminal
 * "proof" panel that shows real output. On hover, a subtle scan-line travels the
 * proof panel. Fully static and legible under prefers-reduced-motion.
 *
 * proof: { label: string, lines: [{ text, dim?, accent? }] }
 */
export function ClaimProofCard({ icon: Icon, title, description, proof, accent = 'brand' }) {
  const reduceMotion = useReducedMotion();
  const a = ACCENT[accent] || ACCENT.brand;

  return (
    <div
      className={`group relative flex flex-col md:flex-row items-stretch rounded-2xl border border-white/[0.07] bg-dark-850/60 backdrop-blur-xl overflow-hidden transition-all duration-500 ease-expo hover:border-white/15 ${a.glow}`}
    >
      {/* Claim */}
      <div className="flex-1 p-6 md:p-7 flex flex-col justify-center">
        <div className="flex items-center gap-3.5 mb-3">
          <span className={`p-2.5 rounded-xl bg-white/[0.04] border border-white/10 ${a.text}`}>
            <Icon className="w-5 h-5" aria-hidden="true" />
          </span>
          <h3 className="text-base font-bold text-white">{title}</h3>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed max-w-md">{description}</p>
      </div>

      {/* Proof */}
      <div className="md:w-80 lg:w-96 border-t md:border-t-0 md:border-l border-white/[0.06] bg-dark-950/60 relative overflow-hidden shrink-0">
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-dark-900/40">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">{proof.label}</span>
          <div className="flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity" aria-hidden="true">
            <span className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />
            <span className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />
          </div>
        </div>
        <div className="relative p-4 font-mono text-[11.5px] leading-relaxed min-h-[104px] flex flex-col justify-center gap-1">
          {proof.lines.map((line, i) => (
            <div key={i} className={`whitespace-pre-wrap ${line.accent ? a.text : line.dim ? 'text-slate-600' : 'text-slate-300'}`}>
              {line.text}
            </div>
          ))}
          {/* Scan-line on hover */}
          {!reduceMotion && (
            <motion.div
              aria-hidden="true"
              className={`absolute left-0 right-0 h-10 bg-gradient-to-b ${a.bar} opacity-0 group-hover:opacity-100 pointer-events-none`}
              initial={{ top: '-15%' }}
              animate={{ top: ['-15%', '115%'] }}
              transition={{ duration: 1.8, ease: 'linear', repeat: Infinity }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
