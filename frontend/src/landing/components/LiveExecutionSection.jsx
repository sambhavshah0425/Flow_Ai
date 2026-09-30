import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { Check, Cpu, Zap } from 'lucide-react';
import { Reveal } from './Reveal';

const BULLETS = [
  { title: 'Live Execution Logs', desc: 'See every step in real-time.' },
  { title: 'Instant Debugging', desc: 'Find and fix issues faster.' },
  { title: 'Performance Insights', desc: 'Optimize and scale with confidence.' }
];

const LOG_ITEMS = [
  { type: 'Trigger', label: 'New Lead Received', duration: '200ms' },
  { type: 'AI Agent', label: 'Lead Analysis', duration: '1.2s' },
  { type: 'Condition', label: 'Check Qualification', duration: '120ms' },
  { type: 'Email', label: 'Send Welcome Mail', duration: '580ms' },
  { type: 'Slack', label: 'Notify Team', duration: '320ms' }
];

export function LiveExecutionSection() {
  const sectionRef = useRef(null);
  const reduceMotion = useReducedMotion();

  // Scroll parallax for lightning cube
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const cubeParallaxY = useTransform(scrollYProgress, [0, 1], [-40, 40]);

  return (
    <section 
      ref={sectionRef}
      id="live-execution"
      aria-labelledby="live-heading" 
      className="py-24 sm:py-32 relative overflow-hidden bg-[#050811] text-slate-100 border-t border-white/[0.05]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Copy & Bullets */}
          <div className="lg:col-span-5 space-y-6">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              LIVE EXECUTION
            </span>
            
            <h2 id="live-heading" className="lp-title text-white text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 leading-[1.1]">
              Watch your workflows <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">come to life.</span>
            </h2>
            
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              Real-time execution, live logs and instant feedback — so you always know what's happening.
            </p>

            <div className="space-y-5 pt-4">
              {BULLETS.map((bullet) => (
                <div key={bullet.title} className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center justify-center shrink-0 mt-0.5" aria-hidden="true">
                    <Check className="w-3 h-3" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 tracking-tight">{bullet.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{bullet.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Console & Floating Cube */}
          <div className="lg:col-span-7 flex justify-center relative">
            <Reveal className="w-full max-w-[480px]">
              
              {/* Execution Flow Box */}
              <div className="lp-panel overflow-hidden border border-white/[0.08] bg-[#070e1a]/95 rounded-2xl shadow-2xl relative z-10">
                
                {/* Panel Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07] bg-white/[0.01]">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                    <span className="text-xs font-bold text-slate-200">Execution Flow</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Running
                  </span>
                </div>

                {/* Log List */}
                <div className="p-5 space-y-3 min-h-[280px] flex flex-col justify-center">
                  {LOG_ITEMS.map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 10 }}
                      whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-slate-950/45 px-4 py-3 font-mono text-[11px] hover:border-emerald-500/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-4.5 h-4.5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0" aria-hidden="true">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                        <div>
                          <span className="text-slate-500 mr-2 uppercase tracking-wide text-[9px] font-bold">[{item.type}]</span>
                          <span className="text-slate-200">{item.label}</span>
                        </div>
                      </div>
                      <span className="text-slate-400 text-[10px]">{item.duration}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Composed 3D Floating Lightning Cube */}
              <motion.div 
                style={{ y: reduceMotion ? 0 : cubeParallaxY }}
                className="absolute bottom-[-2.5rem] right-[-2.5rem] w-36 h-36 z-20 pointer-events-none select-none"
              >
                <div className={reduceMotion ? "" : "lp-float-drift w-full h-full flex items-center justify-center"}>
                  <img
                    src="/lightning-cube.png"
                    alt="Glowing 3D dark glass lightning cube"
                    style={{ mixBlendMode: 'screen', filter: 'drop-shadow(0 15px 30px rgba(16,185,129,0.15))' }}
                    className="w-full h-full object-contain pointer-events-none select-none"
                  />
                </div>
              </motion.div>

            </Reveal>
          </div>

        </div>
      </div>
    </section>
  );
}
export default LiveExecutionSection;
