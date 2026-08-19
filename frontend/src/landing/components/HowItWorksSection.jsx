import React, { useState } from 'react';
import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MousePointerClick, Spline, Braces, PlayCircle } from 'lucide-react';

const COPY = {
  eyebrow: 'How it works',
  title: 'From blank canvas to running pipeline in four moves',
  steps: [
    {
      icon: MousePointerClick,
      title: 'Drag nodes onto the canvas',
      body: 'Pick from the palette — text, PDFs, Gemini, HTTP, delays, file export — and drop them onto a React Flow canvas.'
    },
    {
      icon: Spline,
      title: 'Connect them with edges',
      body: 'Wire outputs to inputs. The graph is validated as a DAG — circular dependencies are detected and rejected before anything runs.'
    },
    {
      icon: Braces,
      title: 'Reference outputs with {{ }}',
      body: 'Any node can read another node’s output: a Gemini prompt of Summarize: {{pdf_1.text}} resolves automatically at runtime.'
    },
    {
      icon: PlayCircle,
      title: 'Run and watch it live',
      body: 'The backend topologically sorts the graph, executes each node in order with retry + exponential backoff, and streams status over Socket.IO.'
    }
  ]
};

// Each step maps to a stage of the same mini-pipeline shown on the right.
const STAGES = [
  ['add', 'add', 'add'],       // step 0: nodes dropped
  ['on', 'on', 'add'],         // step 1: edges connected
  ['tpl', 'on', 'add'],        // step 2: template resolved
  ['done', 'run', 'queued']    // step 3: executing
];

const CHIP_STYLE = {
  add: 'border-white/10 text-slate-500',
  on: 'border-brand-500/40 text-brand-400',
  tpl: 'border-aiv-500/40 text-aiv-400',
  run: 'border-brand-500/60 text-brand-400',
  done: 'border-run-500/50 text-run-400',
  queued: 'border-white/10 text-slate-500'
};

const CHIP_LABELS = ['Text Input', 'Gemini AI', 'Download'];

function MiniPipeline({ active }) {
  const state = STAGES[active];
  return (
    <div className="relative rounded-2xl border border-white/10 bg-dark-850/70 backdrop-blur-xl p-6 h-full flex flex-col justify-center gap-4">
      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Live preview</span>
      {CHIP_LABELS.map((label, i) => {
        const kind = state[i];
        return (
          <div key={label} className="relative flex items-center gap-3">
            <div className={`flex-1 flex items-center justify-between rounded-xl border bg-dark-900/60 px-3.5 py-2.5 font-mono text-xs transition-colors duration-300 ${CHIP_STYLE[kind]}`}>
              <span>{label}</span>
              <span className="text-[10px] uppercase tracking-wide">
                {kind === 'done' ? 'done' : kind === 'run' ? 'running' : kind === 'tpl' ? '{{ }}' : kind === 'on' ? 'linked' : kind === 'queued' ? 'queued' : ''}
              </span>
            </div>
          </div>
        );
      })}
      {/* connecting spine */}
      <div aria-hidden="true" className="absolute left-[27px] top-[74px] bottom-[74px] w-px bg-gradient-to-b from-brand-500/40 via-aiv-500/30 to-run-500/30" />
    </div>
  );
}

export function HowItWorksSection() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);

  return (
    <section id="how-it-works" aria-labelledby="how-heading" className="py-20 sm:py-28 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading id="how-heading" eyebrow={COPY.eyebrow} title={COPY.title} />

        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 items-stretch">
          {/* Steps — buttons so they're keyboard-focusable and drive the preview */}
          <Reveal className="space-y-3">
            {COPY.steps.map(({ icon: Icon, title, body }, i) => {
              const isActive = active === i;
              return (
                <button
                  key={title}
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  aria-pressed={isActive}
                  className={`relative w-full text-left rounded-2xl border p-5 transition-all duration-300 ease-expo focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 ${
                    isActive ? 'border-brand-500/40 bg-white/[0.04]' : 'border-white/[0.06] hover:border-white/15 hover:bg-white/[0.02]'
                  }`}
                >
                  {isActive && !reduceMotion && (
                    <motion.span
                      layoutId="how-active"
                      className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full bg-gradient-to-b from-brand-500 to-aiv-500"
                      transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                    />
                  )}
                  <div className="flex items-start gap-4">
                    <span className={`shrink-0 p-2.5 rounded-xl border transition-colors duration-300 ${isActive ? 'bg-brand-500/15 border-brand-500/30 text-brand-400' : 'bg-white/[0.03] border-white/10 text-slate-400'}`}>
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span aria-hidden="true" className="text-xs font-mono text-slate-600">0{i + 1}</span>
                        <h3 className="text-base font-bold text-white">{title}</h3>
                      </div>
                      <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">{body}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </Reveal>

          {/* Synced preview */}
          <Reveal delay={0.1} className="min-h-[300px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="h-full"
              >
                <MiniPipeline active={active} />
              </motion.div>
            </AnimatePresence>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
