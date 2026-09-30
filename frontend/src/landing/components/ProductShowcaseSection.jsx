import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Sparkles, Database, Settings, BarChart3, Wrench, Layers, CheckCircle } from 'lucide-react';
import { Reveal } from './Reveal';

const TABS = [
  {
    id: 'builder',
    label: 'Workflow Builder',
    icon: Layers,
    headline: 'Visual Drag & Drop DAG Builder',
    desc: 'Build complex pipelines by mapping nodes and drawing dependencies on a visual React Flow canvas.',
    features: [
      { name: 'Drag & Drop Canvas', desc: 'Drag modules from the node palette directly onto a visual canvas editor.' },
      { name: 'DAG Validation', desc: 'Circular dependencies are analyzed and rejected before a workflow ever runs.' }
    ],
    mockup: (
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
          <span>Node Palette</span>
          <span>Canvas Editor</span>
        </div>
        <div className="grid grid-cols-12 gap-3 min-h-[220px]">
          <div className="col-span-4 border-r border-white/[0.06] pr-2 space-y-2">
            <div className="border border-white/5 bg-white/[0.02] p-1.5 rounded-lg text-[9px] font-mono text-slate-400">Trigger</div>
            <div className="border border-emerald-500/20 bg-emerald-500/5 p-1.5 rounded-lg text-[9px] font-mono text-emerald-400 font-bold">AI Agent</div>
            <div className="border border-white/5 bg-white/[0.02] p-1.5 rounded-lg text-[9px] font-mono text-slate-400">REST API</div>
          </div>
          <div className="col-span-8 flex flex-col justify-center items-center relative p-4 bg-slate-950/40 rounded-xl">
            {/* Visual nodes mockup */}
            <div className="flex flex-col gap-4 w-full">
              <div className="self-center border border-emerald-500/30 bg-[#0a1527] px-3 py-2 rounded-lg text-[10px] font-mono w-28 text-center text-slate-200">
                Trigger
              </div>
              <div className="self-center w-0.5 h-4 bg-emerald-500/20" />
              <div className="self-center border border-emerald-500/40 bg-emerald-500/5 px-3 py-2 rounded-lg text-[10px] font-mono w-32 text-center text-emerald-400 font-bold">
                AI Agent (Gemini)
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: Wrench,
    headline: 'Connect to Any Backend API',
    desc: 'Chain Google Gemini prompts, dynamic REST calls, PDF parsing, and local down-stream file export natively.',
    features: [
      { name: '6 Native Core Nodes', desc: 'Prebuilt handlers for PDF read, REST JSON requests, Gemini generative chains, delay timers.' },
      { name: 'Plugin Registry', desc: 'Extend capabilities with your own server-side handlers without changing engine code.' }
    ],
    mockup: (
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
          <span>Active Integrations</span>
          <span>Status</span>
        </div>
        <div className="space-y-2.5 min-h-[220px] flex flex-col justify-center">
          <div className="flex items-center justify-between border border-white/[0.06] bg-slate-950/45 p-3 rounded-xl">
            <span className="text-[11px] font-mono text-slate-300">Google Gemini LLM</span>
            <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">active</span>
          </div>
          <div className="flex items-center justify-between border border-white/[0.06] bg-slate-950/45 p-3 rounded-xl">
            <span className="text-[11px] font-mono text-slate-300">PDF Reader Handler</span>
            <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">active</span>
          </div>
          <div className="flex items-center justify-between border border-white/[0.06] bg-slate-950/45 p-3 rounded-xl">
            <span className="text-[11px] font-mono text-slate-300">HTTP REST Exec (JSON)</span>
            <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">active</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'automation',
    label: 'Automation',
    icon: Database,
    headline: 'Variable Injection Vaults',
    desc: 'Reference data outputs dynamically between node blocks. Stored keys live in a local AES-256-GCM encrypted vault.',
    features: [
      { name: '{{secrets.KEY}} Binding', desc: 'Inject secret keys into dynamic prompt templates in-memory only at runtime.' },
      { name: 'Variable References', desc: 'Synthesize data seamlessly using node variable templates: {{pdf_reader.text}}.' }
    ],
    mockup: (
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
          <span>Encrypted Secret Vault</span>
          <span>Resolution</span>
        </div>
        <div className="space-y-2.5 min-h-[220px] flex flex-col justify-center">
          <div className="border border-white/[0.06] bg-slate-950/45 p-3.5 rounded-xl font-mono text-[10px] leading-relaxed space-y-1">
            <div className="text-slate-600">// Vault Credentials</div>
            <div>key: GEMINI_API_KEY</div>
            <div className="text-emerald-400">resolved: ••••••••••••••• (in-memory)</div>
          </div>
          <div className="border border-white/[0.06] bg-slate-950/45 p-3.5 rounded-xl font-mono text-[10px] leading-relaxed space-y-1">
            <div className="text-slate-600">// Prompt Template</div>
            <div>Prompt: Summarize this paper: &#123;&#123;pdf_reader.text&#125;&#125;</div>
            <div className="text-emerald-400">status: topological sort OK</div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    headline: 'Performance Insight Dashboard',
    desc: 'Analyze total workflow run durations, granular node metrics, retry recoveries, and token usages per-execution.',
    features: [
      { name: 'Granular Node Execution Times', desc: 'Spot bottleneck execution nodes immediately through detailed elapsed time logs.' },
      { name: 'Automatic Retry Traces', desc: 'Review exponential backoffs and retry recoveries to ensure connection stability.' }
    ],
    mockup: (
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
          <span>Execution Performance Metrics</span>
          <span>Value</span>
        </div>
        <div className="grid grid-cols-2 gap-3 min-h-[220px] items-center">
          <div className="border border-white/[0.06] bg-[#091426] p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-white font-mono">4,861ms</div>
            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mt-1">Run Duration</div>
          </div>
          <div className="border border-white/[0.06] bg-[#091426] p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-white font-mono">360</div>
            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mt-1">Tokens Used</div>
          </div>
          <div className="border border-white/[0.06] bg-[#091426] p-4 rounded-xl text-center col-span-2">
            <div className="text-emerald-400 text-xs font-bold font-mono">1 Retry Recovered (503)</div>
            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mt-1">Observability</div>
          </div>
        </div>
      </div>
    )
  }
];

export function ProductShowcaseSection() {
  const [activeTab, setActiveTab] = useState('builder');
  const reduceMotion = useReducedMotion();
  const tabRefs = useRef([]);

  const currentTab = TABS.find((t) => t.id === activeTab) || TABS[0];

  // Manual tab list selection handler using WAI-ARIA
  const handleKeyDown = (e, index) => {
    let targetIndex = null;
    if (e.key === 'ArrowRight') {
      targetIndex = (index + 1) % TABS.length;
    } else if (e.key === 'ArrowLeft') {
      targetIndex = (index - 1 + TABS.length) % TABS.length;
    }

    if (targetIndex !== null) {
      tabRefs.current[targetIndex]?.focus();
    }
  };

  return (
    <section 
      id="product" 
      aria-labelledby="product-heading" 
      className="py-24 sm:py-32 overflow-hidden bg-[#040810] text-slate-100 border-t border-white/[0.05]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 rounded-full px-3 py-1 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            BUILT FOR REAL-WORLD IMPACT
          </span>
          <h2 id="product-heading" className="lp-title text-white text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mt-2 max-w-2xl mx-auto">
            Powerful features for powerful builders.
          </h2>
        </div>

        {/* Tab Switcher Headers (WAI-ARIA manually activated) */}
        <div className="flex justify-center mb-16 overflow-x-auto pb-2 scrollbar-none">
          <div role="tablist" className="flex border-b border-white/[0.08] px-2 min-w-max">
            {TABS.map((tab, i) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => (tabRefs.current[i] = el)}
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  onClick={() => setActiveTab(tab.id)}
                  className={`lp-tab-btn flex items-center gap-2 px-6 py-4 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 focus-visible:outline-offset-[-2px] ${
                    isActive ? 'active' : ''
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Content Panel Area */}
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          
          {/* Active Tab Copy */}
          <div className="lg:col-span-5 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={reduceMotion ? false : { opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, x: 15 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                role="tabpanel"
                id={`panel-${activeTab}`}
                aria-labelledby={`tab-${activeTab}`}
                className="space-y-5"
              >
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
                  {currentTab.headline}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {currentTab.desc}
                </p>

                <div className="space-y-4 pt-2">
                  {currentTab.features.map((f) => (
                    <div key={f.name} className="flex gap-2.5 items-start">
                      <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" aria-hidden="true" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-200 tracking-tight">{f.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Active Tab Mockup Panel */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-[560px]">
              <div className="lp-panel overflow-hidden border border-white/[0.08] bg-[#070e1a]/95 rounded-2xl shadow-2xl relative min-h-[300px] flex flex-col justify-between p-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full h-full flex flex-col justify-between"
                  >
                    {currentTab.mockup}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
export default ProductShowcaseSection;
