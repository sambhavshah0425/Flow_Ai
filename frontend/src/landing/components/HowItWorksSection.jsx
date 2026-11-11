import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChatCircleDots, GitFork, Play } from '@phosphor-icons/react';
import { RevealBlock } from './MotionPrimitives';

const STEPS = [
  {
    step: '01',
    icon: ChatCircleDots,
    title: 'Generate with Qwen or place nodes',
    body: 'Ask Chat with Qwen to compose a full pipeline, use the prompt automator modal, or pick directly from 10 node handlers on the canvas.'
  },
  {
    step: '02',
    icon: GitFork,
    title: 'Bind variables and encrypted secrets',
    body: 'Pass upstream results cleanly using {{node_id.field}} templates and inject API or SMTP keys from the AES 256 GCM vault.'
  },
  {
    step: '03',
    icon: Play,
    title: 'Validate DAG and stream execution',
    body: 'Run the graph to check for cycles, execute parallel dependency levels, monitor live Socket.IO logs, and download or email outputs.'
  }
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="bg-[#181818] py-20 px-4 sm:px-6"
    >
      <div className="max-w-6xl mx-auto space-y-12">
        <RevealBlock className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4 max-w-[680px]">
            <p className="caption-3 text-[#9B9B9B] uppercase tracking-wider">How it works</p>
            <h2 id="how-heading" className="heading-2 text-white">
              Three steps from prompt to live execution
            </h2>
          </div>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 py-2 px-3 rounded-lg bg-[#000000] border border-[#272727] hover:bg-[#1F1F1F] hover:border-[#313131] text-white button-sm lp-interactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white w-fit"
          >
            <span>Open workflow builder</span>
            <ArrowRight size={14} weight="bold" aria-hidden="true" />
          </Link>
        </RevealBlock>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <RevealBlock key={item.step} delay={idx * 0.08}>
                <article className="h-full bg-[#000000] border border-[#272727] rounded-2xl p-6 flex flex-col justify-between gap-8 hover:bg-[#1F1F1F] hover:border-[#313131] lp-interactive">
                  <div className="flex items-center justify-between gap-4">
                    <span className="w-10 h-10 rounded-lg bg-[#181818] border border-[#272727] text-white flex items-center justify-center shrink-0">
                      <Icon size={20} weight="regular" aria-hidden="true" />
                    </span>
                    <span className="heading-5 lp-mono text-[#737373]">{item.step}</span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="heading-6 text-white">{item.title}</h3>
                    <p className="body-6 text-[#9B9B9B]">{item.body}</p>
                  </div>
                </article>
              </RevealBlock>
            );
          })}
        </div>
      </div>
    </section>
  );
}
