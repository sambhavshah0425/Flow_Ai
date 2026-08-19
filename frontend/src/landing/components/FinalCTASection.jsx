import React from 'react';
import { Link } from 'react-router-dom';
import { Reveal } from './Reveal';
import { ArrowRight, Github } from 'lucide-react';

const COPY = {
  title: 'Your models. Your pipelines. Your servers.',
  body: 'FlowForge OS is self-hosted and open source — no metered runs, no vendor lock-in, no waiting on someone else’s roadmap. Clone it, run it, and ship your first AI pipeline today.',
  primaryCta: 'Start Building Free',
  secondaryCta: 'Star on GitHub'
};

export function FinalCTASection() {
  return (
    <section aria-labelledby="final-cta-heading" className="py-24 sm:py-32 relative overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[420px] rounded-full bg-brand-700/20 blur-[140px]" />
        <div className="absolute bottom-10 left-1/4 w-[300px] h-[300px] rounded-full bg-violet-700/15 blur-[110px]" />
      </div>
      <Reveal className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-7">
        <h2 id="final-cta-heading" className="text-3xl sm:text-5xl font-bold text-white tracking-tight text-balance">
          {COPY.title}
        </h2>
        <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">{COPY.body}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <Link
            to="/login"
            className="group inline-flex items-center gap-2 px-7 py-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-500 to-brand-700 hover:to-brand-600 shadow-xl shadow-brand-500/30 hover:shadow-brand-500/50 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            {COPY.primaryCta}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-sm font-semibold text-slate-200 border border-white/15 hover:border-white/30 hover:bg-white/[0.05] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            <Github className="w-4 h-4" aria-hidden="true" />
            {COPY.secondaryCta}
          </a>
        </div>
        <p className="text-xs text-slate-500 font-mono">MIT licensed · MERN stack · runs without MongoDB for local trials</p>
      </Reveal>
    </section>
  );
}
