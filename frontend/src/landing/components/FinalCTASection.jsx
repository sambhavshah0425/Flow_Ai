import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle } from '@phosphor-icons/react';
import { RevealBlock } from './MotionPrimitives';

export function FinalCTASection() {
  return (
    <section
      id="final-cta"
      aria-labelledby="final-cta-heading"
      className="bg-[#181818] py-20 px-4 sm:px-6"
    >
      <div className="max-w-6xl mx-auto">
        <RevealBlock>
          <div className="bg-[#000000] border border-[#272727] rounded-3xl p-8 sm:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-[680px]">
              <p className="caption-3 text-[#9B9B9B] uppercase tracking-wider">Ready to run locally</p>
              <h2 id="final-cta-heading" className="heading-2 text-white">
                Build your first DAG workflow in minutes
              </h2>
              <p className="body-3 text-[#9B9B9B]">
                Launch the studio locally under the MIT license. Connect Ollama for private Qwen execution, or test graphs right away in In Memory mode.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <span className="inline-flex items-center gap-2 caption-4 text-white">
                  <CheckCircle size={14} weight="fill" className="text-emerald-400" aria-hidden="true" />
                  <span>No credit card required</span>
                </span>
                <span className="inline-flex items-center gap-2 caption-4 text-white">
                  <CheckCircle size={14} weight="fill" className="text-emerald-400" aria-hidden="true" />
                  <span>Zero external AI keys</span>
                </span>
                <span className="inline-flex items-center gap-2 caption-4 text-white">
                  <CheckCircle size={14} weight="fill" className="text-emerald-400" aria-hidden="true" />
                  <span>MIT licensed codebase</span>
                </span>
              </div>
            </div>

            <div className="shrink-0">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white text-black hover:bg-[#E5E5E5] button-md lp-interactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span>Start local studio</span>
                <ArrowRight size={16} weight="bold" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </RevealBlock>
      </div>
    </section>
  );
}
