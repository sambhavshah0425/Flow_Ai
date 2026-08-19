import React from 'react';
import { SectionHeading } from './SectionHeading';
import { Play, Terminal, Type, FileText, Sparkles, Globe, Clock, Download } from 'lucide-react';

const COPY = {
  eyebrow: 'The product',
  title: 'The same canvas, now in front of you',
  lede: 'Below is a preview of the real builder interface: a node palette, a canvas, and an execution strip. Drag nodes from the palette, wire them together, and hit Run to watch it execute live.'
};

const SIDEBAR_ICONS = [Type, FileText, Sparkles, Globe, Clock, Download];

export function ProductShowcaseSection() {
  return (
    <section id="product" aria-labelledby="product-heading" className="py-20 sm:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 w-full">
        <SectionHeading id="product-heading" eyebrow={COPY.eyebrow} title={COPY.title} lede={COPY.lede} />
        
        {/* Real HTML/CSS mockup of the builder UI */}
        <div className="max-w-xl mx-auto mt-12 rounded-2xl border border-white/10 bg-dark-850/95 shadow-2xl shadow-black/60 overflow-hidden font-sans">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-dark-800/70">
            <span className="text-[11px] font-mono text-slate-400">flowforge / summarizer.flow</span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-run-400 bg-run-500/10 border border-run-500/25 rounded-md px-2 py-1">
              <Play className="w-3 h-3 fill-current" aria-hidden="true" /> Run
            </span>
          </div>

          <div className="flex">
            {/* Node palette */}
            <div className="w-11 py-3 flex flex-col items-center gap-3 border-r border-white/[0.06] bg-dark-900/40">
              {SIDEBAR_ICONS.map((Icon, i) => (
                <span key={i} className="text-slate-500">
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </span>
              ))}
            </div>

            {/* Canvas preview */}
            <div className="flex-1 p-4 space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-brand-500/30 bg-dark-900/60 px-3 py-2 font-mono text-[11px] text-brand-400">
                <span>Text Input</span>
                <span className="text-[9px] uppercase text-slate-500">linked</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-aiv-500/40 bg-dark-900/60 px-3 py-2 font-mono text-[11px] text-aiv-400">
                <span>Gemini AI</span>
                <span className="text-[9px] uppercase">running</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-run-500/40 bg-dark-900/60 px-3 py-2 font-mono text-[11px] text-run-400">
                <span>Download</span>
                <span className="text-[9px] uppercase">queued</span>
              </div>
            </div>
          </div>

          {/* Execution strip */}
          <div className="flex items-center gap-2 px-4 py-2 border-t border-white/[0.06] bg-dark-950/70 font-mono text-[10px] text-slate-400">
            <Terminal className="w-3 h-3 text-brand-400" aria-hidden="true" />
            <span className="text-run-400">[OK]</span>
            <span>gemini_1 executed successfully (2,970ms) — 360 tokens</span>
          </div>
        </div>
      </div>
    </section>
  );
}
