import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { Lock, KeyRound, ShieldCheck } from 'lucide-react';
import { Reveal } from './Reveal';

const CARDS = [
  {
    icon: Lock,
    title: 'AES-256-GCM Vault',
    desc: 'API keys are stored with AES-256-GCM vault encryption. Stored secrets decrypt in-memory only at execution time.'
  },
  {
    icon: KeyRound,
    title: 'Runtime Injection',
    desc: 'Reference stored credentials in your templates using {{secrets.KEY}}. Values resolve on the server and are never saved in the workflow JSON.'
  },
  {
    icon: ShieldCheck,
    title: 'Isolated Context',
    desc: 'JWT-guarded route middleware ensures your active workspaces, database models, and execution runs stay private.'
  }
];

export function SecuritySection() {
  const sectionRef = useRef(null);
  const reduceMotion = useReducedMotion();

  // Scroll parallax mapping
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const shieldParallaxY = useTransform(scrollYProgress, [0, 1], [-30, 30]);

  return (
    <section 
      ref={sectionRef}
      id="security"
      aria-labelledby="security-heading"
      className="py-24 sm:py-32 relative overflow-hidden bg-slate-50 text-slate-900 border-t border-slate-200"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left/Middle Column: Copy & 3 Security Cards */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                SECURITY YOU CAN TRUST
              </span>
              <h2 id="security-heading" className="lp-title text-slate-900 text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 max-w-xl leading-tight">
                Enterprise-grade security for your data and workflows.
              </h2>
            </div>

            {/* Grid of 3 Cards */}
            <div className="space-y-4 max-w-xl">
              {CARDS.map((card, i) => {
                const Icon = card.icon;
                return (
                  <Reveal key={card.title} delay={i * 0.08} className="flex">
                    <div className="flex items-start gap-4 p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500/20 transition-all w-full">
                      <span className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center shrink-0" aria-hidden="true">
                        <Icon className="w-5 h-5" />
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">{card.title}</h3>
                        <p className="mt-1 text-xs text-slate-500 leading-relaxed">{card.desc}</p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>

            {/* Bottom priority badge */}
            <p className="text-xs text-slate-400 max-w-md pt-2 border-t border-slate-200/60 font-medium">
              Your security is our priority. All secret credentials reside in a local environment vault and are resolved dynamically in memory.
            </p>
          </div>

          {/* Right Column: Floating 3D Shield */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <motion.div 
              style={{ y: reduceMotion ? 0 : shieldParallaxY }}
              className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-square flex items-center justify-center pointer-events-auto"
            >
              {/* Glowing background behind shield */}
              <div className="absolute inset-0 bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none" />
              
              {/* Composed idle float drift & hover zoom */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className={reduceMotion ? "w-full h-full" : "lp-float-drift w-full h-full flex items-center justify-center"}
              >
                <img
                  src="/security-shield.png"
                  alt="Translucent high-security silver glass shield centerpiece"
                  style={{ mixBlendMode: 'multiply' }}
                  className="w-full h-full object-contain pointer-events-none select-none"
                />
              </motion.div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
export default SecuritySection;
