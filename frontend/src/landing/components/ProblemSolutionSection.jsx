import React from 'react';
import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';
import { Wrench, Clock, EyeOff, Check, ArrowRight, ArrowUpRight, HelpCircle } from 'lucide-react';
import { Slab } from './Slab';

const PROBLEM_COPY = {
  eyebrow: 'THE PROBLEM WE SOLVE',
  title: <>Complex AI workflows shouldn't <span className="text-emerald-600">slow you down.</span></>,
  cards: [
    {
      icon: Wrench,
      title: 'Too Many Tools',
      desc: 'Juggling multiple API providers, parsing libraries, and webhook wrappers leads to brittle glue code and lost developer productivity.'
    },
    {
      icon: Clock,
      title: 'Manual & Repetitive',
      desc: 'Writing standard boilerplate for retries, exponential backoffs, and execution state variables consumes time that could be spent on core logic.'
    },
    {
      icon: EyeOff,
      title: 'No Visibility',
      desc: 'Debugging a failing LLM chain without step-by-step logs and token metrics turns troubleshooting into a slow, blind guessing game.'
    }
  ]
};

const SOLUTION_COPY = {
  eyebrow: 'THE SOLUTION',
  title: <>Design. Automate. Scale.<br />All in <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">One Visual Platform.</span></>,
  features: [
    {
      title: 'Visual Workflow Builder',
      desc: 'Drag, drop, and wire node blocks together. The graph is validated as a DAG before it executes.'
    },
    {
      title: 'Powerful Integrations',
      desc: 'Connect to local Qwen AI, raw text prompts, PDF readers, dynamic REST APIs, and file systems natively.'
    },
    {
      title: 'Smart Automation',
      desc: 'Chain data outputs into downstream templates using simple, intuitive {{node_name.property}} syntax.'
    },
    {
      title: 'Real-time Execution',
      desc: 'Watch nodes light up, logs stream in, and executions complete step-by-step over Socket.IO.'
    }
  ]
};

export function ProblemSolutionSection() {
  return (
    <div className="w-full">
      {/* 1. Problem Section (Light backdrop) */}
      <Slab tone="paper" as="section" className="py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {PROBLEM_COPY.eyebrow}
            </span>
            <h2 className="lp-title text-slate-900 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mt-2 max-w-2xl mx-auto">
              {PROBLEM_COPY.title}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:pb-8">
            {PROBLEM_COPY.cards.map((card, i) => {
              const Icon = card.icon;
              const offsetClass = 
                i === 1 
                  ? 'md:translate-y-6 md:border-emerald-500/25 md:bg-gradient-to-b md:from-white md:to-emerald-50/15 md:shadow-md' 
                  : i === 2 
                    ? 'md:rotate-[1deg]' 
                    : '';
              return (
                <Reveal key={card.title} delay={i * 0.1} className="flex">
                  <div className={`lp-card w-full flex flex-col justify-between border border-slate-200/60 bg-white p-7 rounded-2xl shadow-sm hover:shadow-md transition-all ${offsetClass}`}>
                    <div>
                      <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mb-6 border border-slate-200/80" aria-hidden="true">
                        <Icon className="w-5 h-5" />
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight">{card.title}</h3>
                      <p className="mt-3 text-sm text-slate-500 leading-relaxed">{card.desc}</p>
                    </div>
                    
                    <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-slate-400 group-hover:text-emerald-500 transition-colors">
                      <span className="text-[10px] uppercase font-bold tracking-wider">The status quo</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </Slab>

      {/* 2. Solution Section (Dark backdrop) */}
      <Slab tone="dark" as="section" className="py-24 sm:py-32 bg-[#050811]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Feature Bullets Column */}
            <div className="lg:col-span-5 space-y-8">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 rounded-full px-3 py-1 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {SOLUTION_COPY.eyebrow}
                </span>
                <h2 className="lp-title text-white text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 leading-[1.1]">
                  {SOLUTION_COPY.title}
                </h2>
              </div>

              <div className="space-y-6">
                {SOLUTION_COPY.features.map((feat, i) => (
                  <Reveal key={feat.title} delay={i * 0.08} className="flex gap-4">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-1 border border-emerald-500/20" aria-hidden="true">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <h3 className="text-[1.05rem] font-bold text-slate-100 tracking-tight">{feat.title}</h3>
                      <p className="mt-1 text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>

            {/* Visual DAG Canvas Mockup Column */}
            <div className="lg:col-span-7 flex justify-center lg:-mr-8">
              <Reveal delay={0.15} className="w-full max-w-[560px]">
                <div className="lp-panel overflow-hidden border border-white/[0.08] bg-[#070e1a]/90 rounded-2xl shadow-2xl relative">
                  
                  {/* Mock Window Header */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07] bg-white/[0.01]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                      <span className="ml-3 text-[11px] font-mono text-slate-500">canvas / lead_scoring.flow</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      ✓ Validated DAG
                    </span>
                  </div>

                  {/* Canvas Grid Simulator */}
                  <div className="p-8 relative min-h-[360px] bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] [background-size:16px_16px]">
                    
                    {/* SVG Connector lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
                      <defs>
                        <linearGradient id="edge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#34d399" stopOpacity="0.1" />
                        </linearGradient>
                      </defs>
                      {/* Lines between mock nodes */}
                      <path d="M120 75 L280 75" stroke="url(#edge-grad)" strokeWidth="2" fill="none" strokeDasharray="4 2" />
                      <path d="M380 75 L380 155" stroke="url(#edge-grad)" strokeWidth="2" fill="none" />
                      <path d="M380 205 L260 270" stroke="url(#edge-grad)" strokeWidth="2" fill="none" />
                      <path d="M380 205 L480 270" stroke="url(#edge-grad)" strokeWidth="2" fill="none" />
                    </svg>

                    {/* Node 1: Trigger */}
                    <div className="absolute top-10 left-6 w-32 border border-emerald-500/30 bg-[#0a1527] p-3 rounded-xl shadow-md">
                      <div className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Trigger</div>
                      <div className="text-[11px] font-bold text-white mt-0.5 truncate">New Lead</div>
                      <div className="mt-2 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded inline-block">webhook</div>
                    </div>

                    {/* Node 2: AI Agent */}
                    <div className="absolute top-10 left-48 w-36 border border-emerald-500/30 bg-[#0a1527] p-3 rounded-xl shadow-md">
                      <div className="text-[9px] uppercase tracking-wider font-bold text-emerald-400">AI Agent</div>
                      <div className="text-[11px] font-bold text-white mt-0.5">Analyze Profile</div>
                      <div className="mt-2 text-[9px] font-mono text-slate-400">Qwen3 (local)</div>
                    </div>

                    {/* Node 3: Condition */}
                    <div className="absolute top-36 left-48 w-36 border border-emerald-500/20 bg-[#0a1527] p-3 rounded-xl shadow-md border-dashed">
                      <div className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Condition</div>
                      <div className="text-[11px] font-bold text-white mt-0.5">Score &gt;= 80?</div>
                      <div className="mt-2 text-[9px] font-mono text-slate-500">boolean branch</div>
                    </div>

                    {/* Node 4: Action (Yes branch) */}
                    <div className="absolute bottom-6 left-16 w-36 border border-emerald-500/30 bg-[#0a1527] p-3 rounded-xl shadow-md">
                      <div className="text-[9px] uppercase tracking-wider font-bold text-emerald-400">Email</div>
                      <div className="text-[11px] font-bold text-white mt-0.5">Send Offer</div>
                      <div className="mt-2 text-[9px] font-mono text-slate-400">in-memory vault</div>
                    </div>

                    {/* Node 5: Action (No branch) */}
                    <div className="absolute bottom-6 left-60 w-36 border border-emerald-500/30 bg-[#0a1527] p-3 rounded-xl shadow-md">
                      <div className="text-[9px] uppercase tracking-wider font-bold text-emerald-400">Slack</div>
                      <div className="text-[11px] font-bold text-white mt-0.5">Alert Sales</div>
                      <div className="mt-2 text-[9px] font-mono text-slate-400">POST webhook</div>
                    </div>

                  </div>
                </div>
              </Reveal>
            </div>

          </div>
        </div>
      </Slab>
    </div>
  );
}
