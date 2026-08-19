import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Github, Radio } from 'lucide-react';

const COPY = {
  badge: 'Open source · Self-hosted · Real-time',
  headline: ['Chain AI models into pipelines.', 'Visually.'],
  subhead:
    'FlowForge OS is a visual workflow engine for developers: drag nodes onto a canvas, wire Gemini calls to PDFs, APIs, and files with {{template}} references, then watch every node execute live over Socket.IO — on your own infrastructure.',
  primaryCta: 'Start Building Free',
  secondaryCta: 'View on GitHub',
  meta: 'git clone → npm run dev → building in under a minute. MongoDB optional.'
};

const EASE = [0.16, 1, 0.3, 1];

/**
 * The signature visual here is the persistent 3D workflow graph rendered
 * behind the whole page (see landing/scene/Scene3DCanvas.jsx) — this section
 * is copy-only, composed as an overlay so the camera's establishing shot of
 * the graph is visible around and behind the headline.
 */
export function HeroSection() {
  const reduceMotion = useReducedMotion();

  const enter = (delay) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 22 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: EASE }
        };

  return (
    <section id="top" aria-labelledby="hero-heading" className="relative min-h-[92vh] flex items-center pt-28 pb-20">
      {/* Guarantees headline contrast regardless of what the 3D scene is doing behind it — a bright particle or node glow can't wash out the text. */}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-dark-950/95 via-dark-950/70 via-55% to-transparent pointer-events-none" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="max-w-2xl">
          <motion.p
            {...enter(0)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-brand-100 bg-white/[0.04] border border-white/10 rounded-full px-4 py-1.5 mb-6"
          >
            <Radio className="w-3.5 h-3.5 text-run-400" aria-hidden="true" />
            {COPY.badge}
          </motion.p>

          <motion.h1
            {...enter(0.08)}
            id="hero-heading"
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.05]"
          >
            {COPY.headline[0]}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-aiv-400 to-flow-400">
              {COPY.headline[1]}
            </span>
          </motion.h1>

          <motion.p {...enter(0.16)} className="mt-6 text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl">
            {COPY.subhead}
          </motion.p>

          <motion.div {...enter(0.24)} className="mt-9 flex flex-col sm:flex-row items-start gap-3.5">
            <Link
              to="/login"
              className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-500 to-brand-700 hover:to-brand-600 shadow-xl shadow-brand-500/30 hover:shadow-brand-500/50 transition-all duration-300 ease-expo focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            >
              {COPY.primaryCta}
              <ArrowRight className="w-4 h-4 transition-transform duration-300 ease-expo group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-200 border border-white/15 hover:border-white/30 hover:bg-white/[0.05] transition-all duration-300 ease-expo focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            >
              <Github className="w-4 h-4" aria-hidden="true" />
              {COPY.secondaryCta}
            </a>
          </motion.div>

          <motion.p {...enter(0.32)} className="mt-6 text-xs text-slate-500 font-mono">{COPY.meta}</motion.p>
        </div>
      </div>
    </section>
  );
}
