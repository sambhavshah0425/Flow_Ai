import React from 'react';
import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';
import { XCircle, CheckCircle2 } from 'lucide-react';

const COPY = {
  eyebrow: 'Why FlowForge',
  title: 'Stop stitching AI calls together by hand',
  problems: [
    'Glue scripts that chain an LLM call to a parser to a webhook — rewritten for every project',
    'Closed SaaS automation tools that meter your runs and hold your workflows hostage',
    'API keys pasted into code, prompts buried in string concatenation',
    'No visibility: the pipeline either worked or it didn’t, and the logs are somewhere else'
  ],
  solutions: [
    'One canvas: drag nodes, connect edges, and the graph is the pipeline — no glue code',
    'Self-hosted and open source — your workflows, your models, your infrastructure',
    'Secrets live in an AES-256-GCM encrypted vault and inject at runtime via {{secrets.KEY}}',
    'Every run streams node-by-node status, logs, and token metrics to your screen live'
  ]
};

function List({ items, icon: Icon, iconClass, title, titleClass }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-dark-850/50 backdrop-blur-xl p-6 sm:p-8 h-full">
      <h3 className={`text-sm font-bold uppercase tracking-wider mb-5 ${titleClass}`}>{title}</h3>
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed">
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconClass}`} aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProblemSolutionSection() {
  return (
    <section id="features" aria-labelledby="problem-solution-heading" className="py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading id="problem-solution-heading" eyebrow={COPY.eyebrow} title={COPY.title} />
        <div className="grid md:grid-cols-2 gap-6">
          <Reveal delay={0}>
            <List items={COPY.problems} icon={XCircle} iconClass="text-red-400/80" title="The usual way" titleClass="text-red-400/90" />
          </Reveal>
          <Reveal delay={0.12}>
            <List items={COPY.solutions} icon={CheckCircle2} iconClass="text-emerald-400/90" title="With FlowForge OS" titleClass="text-emerald-400" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
