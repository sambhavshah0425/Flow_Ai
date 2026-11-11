import React, { useState } from 'react';
import {
  Clock,
  Cpu,
  Database,
  DownloadSimple,
  EnvelopeSimple,
  FilePdf,
  GitBranch,
  Globe,
  Lightning,
  LockKey,
  MagnifyingGlass,
  ShieldCheck,
  TextT
} from '@phosphor-icons/react';
import { RevealBlock } from './MotionPrimitives';

const CATEGORIES = [
  { id: 'all', label: 'All 10 nodes' },
  { id: 'ai', label: 'AI and RAG' },
  { id: 'logic', label: 'Logic and network' },
  { id: 'delivery', label: 'Output and delivery' }
];

const NODES = [
  {
    type: 'text',
    category: 'ai',
    name: 'Text Input',
    output: '{{text_1.text}}',
    icon: TextT,
    desc: 'Supply fixed prompts, instructions, or user questions as a reusable starting point.'
  },
  {
    type: 'pdf',
    category: 'ai',
    name: 'PDF Reader',
    output: '{{pdf_1.text}}',
    icon: FilePdf,
    desc: 'Upload PDF files and extract full plain text and page metadata for downstream nodes.'
  },
  {
    type: 'ollama',
    category: 'ai',
    name: 'Local AI Qwen',
    output: '{{ollama_1.text}}',
    icon: Cpu,
    desc: 'Run local Qwen inference through Ollama for summarizing, classifying, drafting, or Q&A.'
  },
  {
    type: 'embed',
    category: 'ai',
    name: 'Embed and Index',
    output: 'Up to 60 chunks',
    icon: Database,
    desc: 'Split long text into overlapping windows and index vectors locally with Qwen embeddings or offline fallback.'
  },
  {
    type: 'retrieve',
    category: 'ai',
    name: 'Retrieve',
    output: '{{retrieve_1.context}}',
    icon: MagnifyingGlass,
    desc: 'Query indexed vectors and return the top K relevant passages before invoking Qwen.'
  },
  {
    type: 'condition',
    category: 'logic',
    name: 'Condition',
    output: 'true or false handle',
    icon: GitBranch,
    desc: 'Evaluate 15 comparison operators including equals, numeric checks, emptiness, and regex to prune inactive paths.'
  },
  {
    type: 'api',
    category: 'logic',
    name: 'REST API',
    output: '{{api_1.data}}',
    icon: Globe,
    desc: 'Execute GET or POST requests with interpolated headers, payloads, and automatic SSRF private network checks.'
  },
  {
    type: 'delay',
    category: 'logic',
    name: 'Delay Timer',
    output: 'Async wait',
    icon: Clock,
    desc: 'Pause pipeline branches cleanly between API requests or rate limited external webhooks.'
  },
  {
    type: 'download',
    category: 'delivery',
    name: 'Download File',
    output: 'Exported artifact',
    icon: DownloadSimple,
    desc: 'Package generated reports or JSON payloads into downloadable text or HTML files right from the console.'
  },
  {
    type: 'email',
    category: 'delivery',
    name: 'Send Email',
    output: 'SMTP delivery',
    icon: EnvelopeSimple,
    desc: 'Dispatch formatted summaries and alerts over SMTP using credentials stored in the encrypted vault.'
  }
];

const SECURITY_PROOF = [
  {
    icon: LockKey,
    title: 'AES 256 GCM vault',
    detail: 'User secrets encrypt with unique 12 byte initialization vectors and auth tags, decrypting in server RAM only during runs.'
  },
  {
    icon: ShieldCheck,
    title: 'SSRF and route guards',
    detail: 'Loopback, metadata, and private IP ranges are blocked on REST nodes alongside JWT auth, Helmet headers, and rate limits.'
  },
  {
    icon: Lightning,
    title: 'Deterministic retry policy',
    detail: 'Each node supports configurable maxRetries, retryDelayMs, and exponential backoff while preventing graph cycles.'
  }
];

export function NodeLibrarySection() {
  const [filter, setFilter] = useState('all');

  const visibleNodes =
    filter === 'all' ? NODES : NODES.filter((node) => node.category === filter);

  return (
    <section
      id="nodes"
      aria-labelledby="nodes-heading"
      className="bg-[#000000] py-20 px-4 sm:px-6"
    >
      <div className="max-w-6xl mx-auto space-y-12">
        <RevealBlock className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-4 max-w-[680px]">
            <p className="caption-3 text-[#9B9B9B] uppercase tracking-wider">Node registry and proof</p>
            <h2 id="nodes-heading" className="heading-2 text-white">
              Ten native handlers backed by server code
            </h2>
            <p className="body-3 text-[#9B9B9B]">
              Every block in the Node Palette maps to a modular Express handler in nodeRegistry, plus legacy compatibility for saved Gemini workflows running seamlessly on Qwen.
            </p>
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter node categories">
            {CATEGORIES.map((cat) => {
              const active = filter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFilter(cat.id)}
                  aria-pressed={active}
                  className={`py-2 px-3 rounded-lg button-xsm lp-interactive border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                    active
                      ? 'bg-white text-black border-white'
                      : 'bg-[#181818] text-[#9B9B9B] border-[#272727] hover:text-white hover:bg-[#1F1F1F]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </RevealBlock>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleNodes.map((node) => {
            const Icon = node.icon;
            return (
              <article
                key={node.type}
                className="bg-[#181818] border border-[#272727] rounded-2xl p-6 flex flex-col justify-between gap-4 hover:bg-[#1F1F1F] hover:border-[#313131] lp-interactive"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="w-10 h-10 rounded-lg bg-[#000000] border border-[#272727] text-white flex items-center justify-center shrink-0">
                      <Icon size={20} weight="regular" aria-hidden="true" />
                    </span>
                    <span className="caption-5 lp-mono text-[#9B9B9B] bg-[#000000] border border-[#272727] px-2 py-1 rounded">
                      {node.output}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="title-2 text-white">{node.name}</h3>
                    <p className="body-6 text-[#9B9B9B]">{node.desc}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Architecture & Security Proof Row */}
        <RevealBlock delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            {SECURITY_PROOF.map((proof) => {
              const Icon = proof.icon;
              return (
                <div
                  key={proof.title}
                  className="bg-[#131209] border border-[#272727] rounded-2xl p-6 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} weight="regular" className="text-white shrink-0" aria-hidden="true" />
                    <h3 className="title-3 text-white">{proof.title}</h3>
                  </div>
                  <p className="body-6 text-[#9B9B9B]">{proof.detail}</p>
                </div>
              );
            })}
          </div>
        </RevealBlock>
      </div>
    </section>
  );
}

