import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Reveal } from './Reveal';

const COPY = {
  title: 'Ready to Build Smarter?',
  body: 'Join thousands of developers and builders automating the future with FlowForge OS.',
  primaryCta: 'Start Building Free'
};

export function FinalCTASection() {
  const containerRef = useRef(null);
  const reduceMotion = useReducedMotion();

  // Scroll parallax mapping
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const orbParallaxY = useTransform(scrollYProgress, [0, 1], [-20, 20]);

  return (
    <section 
      ref={containerRef}
      id="final-cta"
      aria-labelledby="final-cta-heading" 
      className="py-20 sm:py-28 relative overflow-hidden bg-[#040810] text-slate-100 border-t border-white/[0.05]"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Outlined Rounded container matching the visual pattern */}
        <div className="border border-white/[0.08] bg-[#070e1a]/50 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          
          {/* Subtle glow background */}
          <div className="absolute right-[-10%] top-[-10%] w-[320px] h-[320px] rounded-full bg-emerald-500/10 blur-[80px] pointer-events-none" />

          <div className="grid lg:grid-cols-12 gap-8 items-center">
            
            {/* Copy column */}
            <div className="lg:col-span-7 space-y-6">
              <h2 id="final-cta-heading" className="lp-title text-white text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                {COPY.title}
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-md">
                {COPY.body}
              </p>
              
              <div className="pt-2">
                <Link
                  to="/login"
                  className="lp-cta-bar inline-flex items-center gap-2 text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 rounded-full px-8 py-4 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 shadow-lg shadow-emerald-500/20"
                >
                  <span>{COPY.primaryCta}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* Orb centerpiece Column */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <motion.div 
                style={{ y: reduceMotion ? 0 : orbParallaxY }}
                className="w-44 h-44 relative flex items-center justify-center pointer-events-none select-none"
              >
                <div className={reduceMotion ? "" : "lp-float-drift w-full h-full flex items-center justify-center"}>
                  <img
                    src="/green-metallic-orb.png"
                    alt="Spinning green metallic core orb"
                    style={{ mixBlendMode: 'screen', filter: 'drop-shadow(0 15px 35px rgba(16,185,129,0.15))' }}
                    className={`${reduceMotion ? "" : "lp-continuous-spin"} w-full h-full object-contain pointer-events-none select-none`}
                  />
                </div>
              </motion.div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
export default FinalCTASection;
