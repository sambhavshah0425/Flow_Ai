import React from 'react';
import { Cpu, GitBranch, LockKey, TerminalWindow } from '@phosphor-icons/react';
import { RevealBlock } from './MotionPrimitives';

const BENEFITS = [
  {
    icon: Cpu,
    title: 'Zero cloud AI fees on every run',
    metric: '180s local AI ceiling',
    body: 'Execute qwen3 models locally through Ollama with a 30 minute keep alive cache and automatic offline keyword embedding fallback when no embedding model is pulled.'
  },
  {
    icon: GitBranch,
    title: 'Acyclic graphs validated before launch',
    metric: 'Kahn topological sort',
    body: 'Every workflow is parsed into dependency levels before execution starts. Circular connections fail fast, and independent branches run concurrently with Promise.all.'
  },
  {
    icon: TerminalWindow,
    title: 'Live node telemetry over Socket.IO',
    metric: 'Millisecond step logs',
    body: 'Watch pending, running, completed, and skipped states stream into the Execution Console in real time alongside exponential backoff retry counts.'
  },
  {
    icon: LockKey,
    title: 'Secrets stay encrypted until execution',
    metric: 'AES 256 GCM vault',
    body: 'Store SMTP passwords and REST tokens encrypted at rest. Templates resolve {{secrets.KEY}} in server memory only while a run is active.'
  }
];

export function BenefitsSection() {
  return (
    <section
      id="benefits"
      aria-labelledby="benefits-heading"
      className="bg-[#181818] py-20 px-4 sm:px-6"
    >
      <div className="max-w-6xl mx-auto space-y-12">
        <RevealBlock className="space-y-4 max-w-[680px]">
          <p className="caption-3 text-[#9B9B9B] uppercase tracking-wider">Why FlowForge OS</p>
          <h2 id="benefits-heading" className="heading-2 text-white">
            Engineered for deterministic local automation
          </h2>
          <p className="body-3 text-[#9B9B9B]">
            Every visual node on the React Flow canvas maps directly to a server handler with strict validation, configurable retries, and isolated secret resolution.
          </p>
        </RevealBlock>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {BENEFITS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <RevealBlock key={item.title} delay={idx * 0.06}>
                <article className="h-full bg-[#000000] border border-[#272727] rounded-2xl p-6 hover:bg-[#1F1F1F] hover:border-[#313131] lp-interactive flex flex-col justify-between gap-6">
                  <div className="flex items-start justify-between gap-4">
                    <span className="w-10 h-10 rounded-lg bg-[#181818] border border-[#272727] text-white flex items-center justify-center shrink-0">
                      <Icon size={20} weight="regular" aria-hidden="true" />
                    </span>
                    <span className="caption-4 lp-mono text-[#9B9B9B] bg-[#181818] border border-[#272727] px-3 py-1 rounded-full">
                      {item.metric}
                    </span>
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

