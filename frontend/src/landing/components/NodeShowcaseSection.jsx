import React from 'react';
import { SectionHeading } from './SectionHeading';
import { RevealGroup, revealItem } from './Reveal';
import { motion, useReducedMotion } from 'framer-motion';
import { Type, FileText, Sparkles, Globe, Clock, Download } from 'lucide-react';

const COPY = {
  eyebrow: 'Node library',
  title: 'Six node types. Real implementations, not mocks.',
  lede: 'Every node in the palette is backed by a working server-side handler — and the registry is a plugin system, so new types drop in without touching the engine.',
  nodes: [
    {
      icon: Type,
      name: 'Text Input',
      desc: 'Raw text or prompt variables — the starting point most pipelines feed from.',
      accent: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    },
    {
      icon: FileText,
      name: 'PDF Reader',
      desc: 'Upload a PDF and get real extracted text and page counts, ready for {{pdf.text}} references.',
      accent: 'text-red-400 bg-red-500/10 border-red-500/20'
    },
    {
      icon: Sparkles,
      name: 'Gemini AI',
      desc: 'Live Google Gemini calls with automatic model fallback and retry when a model is overloaded.',
      accent: 'text-violet-400 bg-violet-500/10 border-violet-500/20'
    },
    {
      icon: Globe,
      name: 'REST API',
      desc: 'HTTP GET/POST to any endpoint, with resolved template variables in URLs and bodies.',
      accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      icon: Clock,
      name: 'Delay Timer',
      desc: 'Async pauses between steps — throttle API calls or space out pipeline stages.',
      accent: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    {
      icon: Download,
      name: 'Download',
      desc: 'Export any node’s output as a file — plain text or formatted HTML, saved from the console.',
      accent: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
    }
  ]
};

export function NodeShowcaseSection() {
  const reduceMotion = useReducedMotion();
  return (
    <section id="node-types" aria-labelledby="nodes-heading" className="py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading id="nodes-heading" eyebrow={COPY.eyebrow} title={COPY.title} lede={COPY.lede} />
        <RevealGroup className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {COPY.nodes.map(({ icon: Icon, name, desc, accent }) => (
            <motion.div
              key={name}
              variants={reduceMotion ? undefined : revealItem}
              className="group rounded-2xl border border-white/[0.07] bg-dark-850/50 backdrop-blur-xl p-6 flex items-start gap-4 transition-all duration-300 ease-expo hover:border-white/15 hover:-translate-y-1 hover:bg-white/[0.03] hover:shadow-[0_10px_40px_-12px_rgba(0,0,0,0.5)]"
            >
              <span className={`p-3 rounded-xl border shrink-0 transition-transform duration-300 ease-expo group-hover:scale-105 ${accent}`}>
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white mb-1.5">{name}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
