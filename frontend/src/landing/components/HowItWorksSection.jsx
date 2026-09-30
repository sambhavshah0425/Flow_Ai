import React from 'react';
import { motion } from 'framer-motion';
import { MousePointerClick, PlusSquare, Link, Play, ArrowRight } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { Reveal } from './Reveal';

const STEPS = [
  {
    num: '1',
    icon: MousePointerClick,
    title: 'Add Trigger',
    desc: 'Choose an event that starts your workflow.'
  },
  {
    num: '2',
    icon: PlusSquare,
    title: 'Add Blocks',
    desc: 'Drag and drop AI actions or tools.'
  },
  {
    num: '3',
    icon: Link,
    title: 'Connect',
    desc: 'Link the blocks to define logic.'
  },
  {
    num: '4',
    icon: Play,
    title: 'Execute',
    desc: 'Run and monitor your workflow in real time.'
  }
];

export function HowItWorksSection() {
  return (
    <section 
      id="how-it-works" 
      aria-labelledby="how-heading" 
      className="py-24 sm:py-32 relative overflow-hidden bg-slate-50 text-slate-900 border-t border-slate-200"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center mb-20">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            HOW IT WORKS
          </span>
          <h2 id="how-heading" className="text-slate-900 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mt-2 max-w-2xl mx-auto leading-tight">
            Build your workflow in 4 simple steps
          </h2>
        </div>

        {/* Steps Grid */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <Reveal key={step.num} delay={i * 0.1} className="relative z-10 flex">
                  <div className="flex flex-col items-center text-center p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-all w-full group relative">
                    
                    {/* Dotted Connector line between steps on desktop */}
                    {i < STEPS.length - 1 && (
                      <div className="hidden lg:block absolute top-12 left-[60%] right-[-60%] h-[2px] border-t-2 border-dashed border-slate-200 group-hover:border-emerald-200 transition-colors pointer-events-none" />
                    )}

                    {/* Step Icon Container */}
                    <div className="w-14 h-14 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 flex items-center justify-center mb-6 shadow-inner group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Number + Title */}
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      {step.num}. {step.title}
                    </h3>

                    {/* Description */}
                    <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-[200px]">
                      {step.desc}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        {/* Try It Yourself CTA */}
        <div className="text-center mt-16">
          <RouterLink
            to="/login"
            className="lp-cta-bar inline-flex items-center gap-2 text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 rounded-full px-8 py-4 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 shadow-lg shadow-emerald-500/20"
          >
            <span>Try it Yourself</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </RouterLink>
        </div>

      </div>
    </section>
  );
}
export default HowItWorksSection;
