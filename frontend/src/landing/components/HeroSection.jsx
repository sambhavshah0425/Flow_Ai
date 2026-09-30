import React, { useRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { Sparkles, Check, ArrowRight } from 'lucide-react';

export function HeroSection() {
  const containerRef = useRef(null);
  const reduceMotion = useReducedMotion();

  // Scroll parallax mapping for camera-like movement
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const orbParallaxY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const textParallaxY = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const cardsParallaxY = useTransform(scrollYProgress, [0, 1], [0, 50]);

  return (
    <section 
      ref={containerRef}
      id="top" 
      aria-labelledby="hero-heading" 
      className="relative pt-32 pb-24 sm:pt-40 sm:pb-36 overflow-hidden bg-gradient-to-b from-[#050812] to-[#04070e]"
    >
      {/* Cinematic green ambient glow behind hero */}
      <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-emerald-500/5 rounded-full blur-[160px] pointer-events-none" aria-hidden="true" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        
        {/* Large Editorial Headline & Masthead */}
        <motion.div 
          style={{ y: reduceMotion ? 0 : textParallaxY }}
          className="space-y-6 max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 rounded-full px-4 py-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" aria-hidden="true" />
            <span>Open source · Self-hosted · Real-time</span>
          </div>

          <h1 
            id="hero-heading"
            className="lp-display text-white text-[3.25rem] sm:text-[5.5rem] lg:text-[6.75rem] font-black tracking-tighter leading-[0.88]"
          >
            Build. Automate.<br />
            Ship with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500">FlowForge OS</span>
          </h1>
        </motion.div>

        {/* Asymmetrical grid containing description + CTA side-by-side (offset) */}
        <div className="grid lg:grid-cols-12 gap-8 items-start mt-8 pb-10">
          <div className="lg:col-span-7">
            <p className="lp-lede text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl">
              The ultimate visual platform to design, automate, and deploy AI workflows — faster, smarter, and without limits.
            </p>
          </div>
          <div className="lg:col-span-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 lg:justify-end">
            <RouterLink
              to="/login"
              className="lp-cta-bar inline-flex items-center justify-center gap-2 text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 rounded-full px-8 py-4 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 shadow-lg shadow-emerald-500/20"
            >
              <span>Start Building Free</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </RouterLink>
          </div>
        </div>

        {/* Large Poster-like Scene Container */}
        <div className="relative mt-12 min-h-[480px] sm:min-h-[560px] flex items-center justify-center">
          
          {/* Main 3D Core Orb (Oversized Centerpiece) */}
          <motion.div 
            style={{ y: reduceMotion ? 0 : orbParallaxY }} 
            className="relative w-[340px] sm:w-[480px] lg:w-[540px] aspect-square flex items-center justify-center z-10"
          >
            {/* Ambient depth glow behind orb */}
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none" />
            
            {/* Composed animation: float drift wrapper + continuous rotation image */}
            <div className={reduceMotion ? "w-full h-full" : "lp-float-drift w-full h-full flex items-center justify-center"}>
              <img
                src="/green-metallic-orb.png"
                alt="Glowing biomechanical green core orb"
                style={{ mixBlendMode: 'screen', filter: 'drop-shadow(0 20px 50px rgba(16,185,129,0.2))' }}
                className={`${reduceMotion ? "" : "lp-continuous-spin"} w-full h-full object-contain pointer-events-none select-none`}
              />
            </div>

            {/* Composed Floating Cards overlapping the bottom of the orb */}
            <motion.div 
              style={{ y: reduceMotion ? 0 : cardsParallaxY }}
              className="absolute inset-0 pointer-events-none"
            >
              {/* Card 1: Text Input (Pink/Coral gradient) */}
              <div 
                className="absolute bottom-10 left-[-4%] rotate-[-6deg] z-20 w-44 sm:w-52 p-4 bg-gradient-to-br from-rose-500/10 to-orange-600/20 border border-rose-500/30 rounded-2xl shadow-xl backdrop-blur-md pointer-events-auto"
                style={{ transform: 'rotate(-6deg)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span className="text-[9px] font-mono text-rose-300 font-bold uppercase tracking-wider">1. Input</span>
                </div>
                <h4 className="text-xs font-bold text-white tracking-tight">Text Input node</h4>
                <p className="text-[9px] text-slate-400 mt-1 font-mono leading-relaxed truncate">&#123;&#123;pdf_reader.text&#125;&#125;</p>
              </div>

              {/* Card 2: Local AI (Teal/Emerald gradient) */}
              <div 
                className="absolute bottom-2 left-[20%] rotate-[4deg] z-30 w-48 sm:w-56 p-4 bg-gradient-to-br from-emerald-500/20 to-teal-600/30 border border-emerald-400/40 rounded-2xl shadow-2xl backdrop-blur-md pointer-events-auto"
                style={{ transform: 'rotate(4deg)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[9px] font-mono text-emerald-300 font-bold uppercase tracking-wider">2. AI Model</span>
                </div>
                <h4 className="text-xs font-bold text-white tracking-tight">Qwen AI agent</h4>
                <p className="text-[9px] text-slate-300 mt-1 leading-relaxed">Runs locally via Ollama</p>
              </div>

              {/* Card 3: REST API (Light Grey) */}
              <div 
                className="absolute bottom-[-1rem] left-[44%] rotate-[-3deg] z-20 w-44 sm:w-52 p-4 bg-slate-100 text-slate-950 border border-slate-200 rounded-2xl shadow-xl pointer-events-auto"
                style={{ transform: 'rotate(-3deg)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">3. REST API</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 tracking-tight">Webhook HTTP Call</h4>
                <p className="text-[9px] text-slate-500 mt-1 font-mono leading-relaxed truncate">POST /api/notify</p>
              </div>
            </motion.div>

            {/* Bottom-right metrics block overlapping the composition */}
            <div className="absolute bottom-[4%] right-[-6%] z-30 bg-[#070e1b]/80 border border-white/[0.08] backdrop-blur-md p-5 rounded-2xl shadow-xl w-52 pointer-events-auto">
              <div className="flex items-baseline gap-1">
                <span className="lp-stat text-3xl font-extrabold tracking-tight">6+</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">handlers</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2.5">
                <div className="flex -space-x-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-[8px] font-bold text-slate-950 flex items-center justify-center border border-[#070e1b]">TX</span>
                  <span className="w-5 h-5 rounded-full bg-teal-500 text-[8px] font-bold text-slate-950 flex items-center justify-center border border-[#070e1b]">AI</span>
                  <span className="w-5 h-5 rounded-full bg-slate-400 text-[8px] font-bold text-slate-950 flex items-center justify-center border border-[#070e1b]">AP</span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] text-slate-400 font-mono">active</span>
              </div>
              <p className="mt-2 text-[10px] text-slate-500 leading-normal">
                Node handlers registered in active workspace.
              </p>
            </div>

          </motion.div>
        </div>

        {/* Partners Row */}
        <div className="mt-20 pt-8 border-t border-white/[0.06] text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 mb-6">
            Trusted by developers from
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-40 hover:opacity-60 transition-opacity duration-300">
            <span className="text-slate-200 font-bold tracking-wider text-sm">Google</span>
            <span className="text-slate-200 font-semibold tracking-wide text-sm flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M0 0h11.4v11.4H0V0zm12.6 0H24v11.4H12.6V0zM0 12.6h11.4V24H0V12.6zm12.6 0H24V24H12.6V12.6z"/>
              </svg>
              Microsoft
            </span>
            <span className="text-slate-200 font-bold text-sm tracking-widest">AWS</span>
            <span className="text-slate-200 font-bold tracking-tight text-sm flex items-center gap-1.5">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
              GitHub
            </span>
            <span className="text-slate-200 font-extrabold tracking-widest text-sm flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 1L24 22H0L12 1Z"/>
              </svg>
              VERCEL
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}
export default HeroSection;
