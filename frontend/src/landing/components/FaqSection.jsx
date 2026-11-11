import React, { useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { RevealBlock } from './MotionPrimitives';

const FAQS = [
  {
    q: 'Does FlowForge OS require paid OpenAI or Gemini API keys?',
    a: 'No. Gemini has been removed from the runtime. The Local AI node, Chat with Qwen, AI Copilot modal, and RAG embedding nodes run through your local Ollama service at zero per token cost.'
  },
  {
    q: 'Which local models work out of the box?',
    a: 'The backend defaults to qwen3:1.7b for 8 GB CPU machines and supports qwen3:4b via OLLAMA_MODEL in backend/.env. Document embeddings default to the local Qwen embedding model and fall back automatically when not installed.'
  },
  {
    q: 'Do I need MongoDB running just to test workflows?',
    a: 'No. When MongoDB is unreachable at 127.0.0.1:27017 in development, the backend automatically switches into In Memory mode so you can sign up, build flows, save secrets, and execute DAGs right away.'
  },
  {
    q: 'How are API keys and SMTP passwords stored?',
    a: 'Secrets are encrypted on the server using AES 256 GCM with random 12 byte initialization vectors and auth tags. Plaintext values decrypt in server memory only while an active execution resolves {{secrets.KEY}}.'
  },
  {
    q: 'How does the engine prevent loops and unsafe API requests?',
    a: 'Kahn topological sorting rejects any graph containing a cycle before nodes run. On REST API nodes, the SSRF guard blocks loopback, private subnets, and cloud metadata endpoints such as 169.254.169.254.'
  },
  {
    q: 'How does Chat with Qwen differ from the AI Copilot modal?',
    a: 'Chat with Qwen runs inside the Workflow Builder, warms Ollama in the background, asks one clarifying question when details are missing, verifies email recipients against your message, and iteratively updates your active canvas.'
  },
  {
    q: 'Can workflows branch based on AI output or HTTP status codes?',
    a: 'Yes. The Condition node supports 15 comparison operators including equals, contains, regex, and numeric comparisons, routing execution down true or false handles while skipping untaken branches.'
  },
  {
    q: 'What happens if Ollama is offline when a RAG workflow runs?',
    a: 'Embed and Retrieve nodes include a deterministic keyword hash embedding fallback so document chunking and retrieval still succeed, while the Chat with Qwen panel status badge shows offline setup instructions.'
  }
];

export function FaqSection() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="bg-[#000000] py-20 px-4 sm:px-6"
    >
      <div className="max-w-4xl mx-auto space-y-12">
        <RevealBlock className="space-y-4 max-w-[680px]">
          <p className="caption-3 text-[#9B9B9B] uppercase tracking-wider">Frequently asked questions</p>
          <h2 id="faq-heading" className="heading-2 text-white">
            Technical answers before you deploy
          </h2>
        </RevealBlock>

        <div className="space-y-3">
          {FAQS.map((item, idx) => {
            const isOpen = openIdx === idx;
            const panelId = `faq-panel-${idx}`;
            const btnId = `faq-btn-${idx}`;

            return (
              <div
                key={item.q}
                className="bg-[#181818] border border-[#272727] rounded-2xl overflow-hidden"
              >
                <h3>
                  <button
                    id={btnId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                    className="w-full text-left p-6 flex items-center justify-between gap-4 hover:bg-[#1F1F1F] lp-interactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <span className="title-3 text-white">{item.q}</span>
                    <CaretDown
                      size={18}
                      weight="bold"
                      aria-hidden="true"
                      className={`text-[#9B9B9B] shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        isOpen ? 'rotate-180 text-white' : ''
                      }`}
                    />
                  </button>
                </h3>
                {isOpen && (
                  <div id={panelId} role="region" aria-labelledby={btnId} className="px-6 pb-6">
                    <p className="body-6 text-[#9B9B9B]">{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
