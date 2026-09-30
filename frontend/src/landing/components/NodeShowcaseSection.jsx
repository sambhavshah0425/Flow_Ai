import React from 'react';
import { SectionHeading } from './SectionHeading';
import { RevealGroup, revealItem } from './Reveal';
import { motion, useReducedMotion } from 'framer-motion';
import { Type, FileText, Sparkles, Globe, Clock, Download, ArrowUpRight } from 'lucide-react';

const COPY = {
  eyebrow: 'Node library',
  title: 'Six node types. Real implementations, not mocks.',
  lede: 'Every node in the palette is backed by a working server-side handler — and the registry is a plugin system, so new types drop in without touching the engine.',
  nodes: [
    {
      icon: Type,
      name: 'Text Input',
      desc: 'Raw text or prompt variables — the starting point most pipelines feed from.',
      accent: 'text-lp-400 bg-lp-500/10 border-lp-500/20'
    },
    {
      icon: FileText,
      name: 'PDF Reader',
      desc: 'Upload a PDF and get real extracted text and page counts, ready for {{pdf.text}} references.',
      accent: 'text-lp-300 bg-lp-500/10 border-lp-500/20'
    },
    {
      icon: Sparkles,
      name: 'Local AI (Qwen)',
      desc: 'Qwen runs on your own machine through Ollama: free, private, no API key.',
      accent: 'text-lp-100 bg-lp-500/15 border-lp-500/30'
    },
    {
      icon: Globe,
      name: 'REST API',
      desc: 'HTTP GET/POST to any endpoint, with resolved template variables in URLs and bodies.',
      accent: 'text-lp-400 bg-lp-500/10 border-lp-500/20'
    },
    {
      icon: Clock,
      name: 'Delay Timer',
      desc: 'Async pauses between steps — throttle API calls or space out pipeline stages.',
      accent: 'text-lp-300 bg-lp-500/10 border-lp-600/25'
    },
    {
      icon: Download,
      name: 'Download',
      desc: 'Export any node’s output as a file — plain text or formatted HTML, saved from the console.',
      accent: 'text-lp-400 bg-lp-500/10 border-lp-600/25'
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
          {COPY.nodes.map(({ icon: Icon, name, desc }) => (
            <motion.div
              key={name}
              variants={reduceMotion ? undefined : revealItem}
              className="lp-card group flex flex-col"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="p-3 rounded-xl shrink-0 bg-lp-500/10 border border-lp-500/25">
                  <Icon className="w-5 h-5 text-lp-600" aria-hidden="true" />
                </span>
                <span className="lp-arrow" aria-hidden="true">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <h3 className="mt-6 text-[1.0625rem] font-bold tracking-tight text-[color:var(--lp-ink)]">{name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--lp-ink-soft)]">{desc}</p>
            </motion.div>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
