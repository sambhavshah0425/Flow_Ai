import React from 'react';
import { SectionHeading } from './SectionHeading';
import { Reveal, RevealGroup, revealItem } from './Reveal';
import { motion, useReducedMotion } from 'framer-motion';
import { Terminal, Activity, Zap, RefreshCw, Clock } from 'lucide-react';

const COPY = {
  eyebrow: 'Live execution',
  title: 'Watch every node run. As it runs.',
  lede: 'Execution streams over Socket.IO with a join-before-run handshake, so the first node event is never missed. Nodes light up on the canvas, logs trickle in, and metrics land in real time — not after a refresh.',
  logs: [
    { time: '17:42:03', level: 'INFO', node: 'workflow', msg: 'Execution started — 4 nodes, topological order resolved' },
    { time: '17:42:03', level: 'INFO', node: 'pdf_1', msg: 'Node executed successfully (41ms) — 11 pages, 12,904 chars' },
    { time: '17:42:04', level: 'INFO', node: 'gemini_1', msg: 'Node "Summarizer" started running…' },
    { time: '17:42:05', level: 'WARN', node: 'gemini_1', msg: 'Model overloaded (503) — retry 2/3 after 1500ms backoff…' },
    { time: '17:42:08', level: 'OK', node: 'gemini_1', msg: 'Node executed successfully (2,970ms) — 360 tokens' },
    { time: '17:42:08', level: 'OK', node: 'download_1', msg: 'Node executed successfully (3ms) — ai_summary.txt, 750 bytes' },
    { time: '17:42:08', level: 'OK', node: 'workflow', msg: 'Workflow completed successfully in 4,861ms' }
  ],
  metrics: [
    { icon: Clock, label: 'Total Duration', value: '4,861 ms', tone: 'text-white' },
    { icon: Zap, label: 'AI Tokens Used', value: '360', tone: 'text-aiv-400' },
    { icon: Activity, label: 'Nodes Executed', value: '4', tone: 'text-run-400' },
    { icon: RefreshCw, label: 'Retries Recovered', value: '1', tone: 'text-amber-400' }
  ],
  points: [
    'Per-node status events — started, completed, failed — animate the canvas the moment they happen',
    'Failed nodes retry with exponential backoff; every attempt is logged with its delay',
    'Token usage, duration, and retry counts recorded per run for observability'
  ]
};

const LEVEL_STYLE = {
  INFO: 'bg-brand-500/20 text-brand-400',
  WARN: 'bg-amber-500/20 text-amber-400',
  OK: 'bg-run-500/20 text-run-400',
  ERROR: 'bg-red-500/20 text-red-400'
};

export function LiveExecutionSection() {
  const reduceMotion = useReducedMotion();
  return (
    <section aria-labelledby="live-heading" className="py-20 sm:py-28 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading id="live-heading" eyebrow={COPY.eyebrow} title={COPY.title} lede={COPY.lede} />

        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Console */}
          <Reveal className="lg:col-span-3">
            <div className="relative rounded-2xl border border-white/10 bg-dark-950/70 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-dark-800/60 border-b border-white/[0.06]">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Terminal className="w-4 h-4 text-brand-400" aria-hidden="true" />
                  Execution Console
                </div>
                <span className="flex items-center gap-1.5 text-[11px] text-run-400 font-mono bg-run-500/10 px-2 py-0.5 rounded border border-run-500/25">
                  <span className={`w-1.5 h-1.5 rounded-full bg-run-400 ${reduceMotion ? '' : 'animate-run-dot'}`} aria-hidden="true" />
                  Live via Socket.IO
                </span>
              </div>

              <RevealGroup stagger={0.16} className="relative p-4 font-mono text-[11px] leading-relaxed space-y-1.5 min-h-[240px]">
                {COPY.logs.map((log, i) => (
                  <motion.div
                    key={i}
                    variants={reduceMotion ? undefined : revealItem}
                    className="flex items-start gap-2.5 border-b border-white/[0.03] pb-1.5"
                  >
                    <span className="text-slate-600 select-none shrink-0">[{log.time}]</span>
                    <span className={`uppercase font-bold text-[9px] px-1 py-0.5 rounded shrink-0 ${LEVEL_STYLE[log.level]}`}>{log.level}</span>
                    <span className="text-slate-500 shrink-0">[{log.node}]</span>
                    <span className="text-slate-300">{log.msg}</span>
                  </motion.div>
                ))}
              </RevealGroup>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 pt-1 border-t border-white/[0.04]">
                {COPY.metrics.map(({ icon: Icon, label, value, tone }) => (
                  <div key={label} className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-3">
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 mb-1">
                      <Icon className="w-3 h-3" aria-hidden="true" /> {label}
                    </div>
                    <div className={`text-sm font-bold ${tone}`}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Supporting points */}
          <Reveal delay={0.15} className="lg:col-span-2 space-y-4 lg:pt-2">
            {COPY.points.map((point) => (
              <div key={point} className="flex items-start gap-3.5 rounded-xl border border-white/[0.07] bg-dark-850/50 backdrop-blur-xl p-4">
                <span className="w-2 h-2 rounded-full bg-flow-400 mt-1.5 shrink-0" aria-hidden="true" />
                <p className="text-sm text-slate-300 leading-relaxed">{point}</p>
              </div>
            ))}
            <p className="text-xs text-slate-500 leading-relaxed pl-1">
              This is a faithful mock of the real in-app console — same events, same format, streamed from the engine as each node completes.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
