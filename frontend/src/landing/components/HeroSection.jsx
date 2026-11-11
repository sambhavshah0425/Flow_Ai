import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Cpu, Database, FilePdf, MagnifyingGlass } from '@phosphor-icons/react';
import { RevealBlock } from './MotionPrimitives';

const HERO_NODES = [
  {
    id: 'pdf_1',
    level: 'Level 0',
    title: 'PDF Reader',
    token: '{{pdf_1.text}}',
    meta: '14 pages parsed',
    time: '240ms',
    icon: FilePdf
  },
  {
    id: 'embed_1',
    level: 'Level 1',
    title: 'Embed and Index',
    token: 'chunkSize: 900',
    meta: '48 chunks indexed',
    time: '310ms',
    icon: Database
  },
  {
    id: 'retrieve_1',
    level: 'Level 2',
    title: 'Retrieve',
    token: '{{retrieve_1.context}}',
    meta: 'topK: 4 matches',
    time: '84ms',
    icon: MagnifyingGlass
  },
  {
    id: 'ollama_1',
    level: 'Level 3',
    title: 'Local AI Qwen',
    token: '{{ollama_1.text}}',
    meta: 'qwen3:1.7b local',
    time: '1.84s',
    icon: Cpu
  }
];

export function HeroSection() {
  return (
    <section
      id="top"
      aria-labelledby="hero-heading"
      className="bg-[#000000] pt-24 pb-16 sm:pb-24 px-4 sm:px-6"
    >
      <div className="max-w-6xl mx-auto pt-8 sm:pt-12">
        <RevealBlock className="flex flex-col items-start gap-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181818] border border-[#272727] caption-4 text-[#9B9B9B]">
            <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
            <span>MIT license · 10 node handlers · Local Qwen via Ollama</span>
          </div>

          <h1 id="hero-heading" className="heading-1 lp-hero-gradient max-w-[680px]">
            Ship local AI workflows
            <br />
            without cloud API bills
          </h1>

          <p className="body-3 text-[#9B9B9B] max-w-[680px]">
            Design, validate, and run directed acyclic graphs on your own machine with Qwen through Ollama, document vector search, conditional branching, REST webhooks, and AES 256 GCM secret storage.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white text-black hover:bg-[#E5E5E5] button-md lp-interactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white w-fit"
            >
              <span>Start local studio</span>
              <ArrowRight size={16} weight="bold" aria-hidden="true" />
            </Link>
            <p className="caption-2 text-[#9B9B9B]">
              Free local workspace. Runs with MongoDB or zero setup In Memory mode.
            </p>
          </div>
        </RevealBlock>

        <RevealBlock delay={0.12} className="mt-12 sm:mt-16">
          <div className="bg-[#181818] border border-[#272727] rounded-3xl p-4 sm:p-8">
            <div className="bg-[#000000] border border-[#272727] rounded-lg sm:rounded-2xl p-4 sm:p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="caption-3 text-white">Studio Canvas</span>
                  <span className="caption-5 lp-mono text-[#9B9B9B] bg-[#181818] border border-[#272727] px-2 py-1 rounded">
                    contract_qa.flow
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 caption-4 text-white bg-[#181818] border border-[#272727] px-3 py-1 rounded-full">
                    <CheckCircle size={14} weight="fill" className="text-emerald-400" aria-hidden="true" />
                    <span>Kahn DAG validated</span>
                  </span>
                  <span className="caption-4 lp-mono text-[#9B9B9B] bg-[#181818] border border-[#272727] px-3 py-1 rounded-full">
                    Socket.IO live
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {HERO_NODES.map((node, index) => {
                  const Icon = node.icon;
                  return (
                    <div
                      key={node.id}
                      className="bg-[#181818] border border-[#272727] rounded-xl p-4 flex flex-col justify-between gap-4 hover:bg-[#1F1F1F] hover:border-[#313131] lp-interactive"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="caption-5 lp-mono text-[#9B9B9B]">{node.level}</span>
                        <span className="caption-5 lp-mono text-emerald-400">{node.time}</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-[#272727] text-white flex items-center justify-center shrink-0">
                            <Icon size={16} weight="regular" aria-hidden="true" />
                          </span>
                          <span className="title-4 text-white">{node.title}</span>
                        </div>
                        <div className="bg-[#000000] border border-[#272727] rounded-lg px-2 py-1 caption-5 lp-mono text-[#9B9B9B] truncate">
                          {node.token}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="caption-5 text-[#9B9B9B]">{node.meta}</span>
                        <span className="caption-5 lp-mono text-white">
                          {index < HERO_NODES.length - 1 ? 'next →' : 'done'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-[#181818] border border-[#272727] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" aria-hidden="true" />
                  <span className="caption-4 lp-mono text-white">
                    Execution complete · 4 of 4 nodes succeeded · 2.47s elapsed · 0 external API keys
                  </span>
                </div>
                <span className="caption-5 lp-mono text-[#9B9B9B]">
                  Vault decrypted in memory only
                </span>
              </div>
            </div>
          </div>
        </RevealBlock>
      </div>
    </section>
  );
}
