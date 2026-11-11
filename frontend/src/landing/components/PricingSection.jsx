import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, CheckCircle, WarningCircle, X } from '@phosphor-icons/react';
import { RevealBlock } from './MotionPrimitives';

const PLANS = [
  {
    id: 'local',
    name: 'Community Local',
    price: '$0',
    cadence: 'MIT open source forever',
    featured: false,
    desc: 'Run the complete MERN orchestrator, React Flow studio, and Qwen copilot directly on your laptop or server.',
    features: [
      'All 10 server side node handlers',
      'Conversational Chat with Qwen and 1 prompt AI Copilot',
      'Local Ollama qwen3 inference and keyword RAG fallback',
      'AES 256 GCM secret vault and In Memory or MongoDB mode'
    ],
    ctaLabel: 'Start local studio',
    to: '/login'
  },
  {
    id: 'pro',
    name: 'Cloud Studio Pro',
    price: '{{price}}',
    cadence: 'per seat monthly',
    featured: true,
    desc: 'Managed hosting for builders and small teams who want shared pipelines and hosted Qwen endpoints.',
    features: [
      'Everything in Community Local',
      'Managed MongoDB persistence and execution logs',
      'Shared team secrets vault and workspace permissions',
      'Dedicated remote Ollama GPU worker routing'
    ],
    ctaLabel: 'Request early access',
    planKey: 'Cloud Studio Pro'
  },
  {
    id: 'enterprise',
    name: 'Enterprise VPC',
    price: '{{price}}',
    cadence: 'custom annual agreement',
    featured: false,
    desc: 'Private VPC deployment for engineering organizations with strict network isolation and custom node registries.',
    features: [
      'Everything in Cloud Studio Pro',
      'Private VPC and air gapped Ollama model registry',
      'Custom Express node handler plugins and onboarding',
      'Dedicated security review and SLA terms'
    ],
    ctaLabel: 'Request VPC access',
    planKey: 'Enterprise VPC'
  }
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function PricingSection() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [email, setEmail] = useState('');
  const [formState, setFormState] = useState('idle'); // 'idle' | 'submitting' | 'success'
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedEmail, setConfirmedEmail] = useState('');

  const openWaitlist = (planName) => {
    setSelectedPlan(planName);
    setFormState('idle');
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleaned = email.trim();
    if (!cleaned) {
      setErrorMsg('Work email address is required.');
      return;
    }
    if (!EMAIL_PATTERN.test(cleaned)) {
      setErrorMsg('Enter a valid email address such as alex@company.com.');
      return;
    }

    setErrorMsg('');
    setFormState('submitting');
    setTimeout(() => {
      setConfirmedEmail(cleaned);
      setFormState('success');
      setEmail('');
    }, 500);
  };

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="bg-[#181818] py-20 px-4 sm:px-6"
    >
      <div className="max-w-6xl mx-auto space-y-12">
        <RevealBlock className="space-y-4 max-w-[680px]">
          <p className="caption-3 text-[#9B9B9B] uppercase tracking-wider">Plans and licensing</p>
          <h2 id="pricing-heading" className="heading-2 text-white">
            Free on your machine. Scales when your team is ready.
          </h2>
          <p className="body-3 text-[#9B9B9B]">
            Self host under the MIT license at zero cost today, or join the early access list for managed team workspaces.
          </p>
        </RevealBlock>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {PLANS.map((plan, idx) => (
            <RevealBlock key={plan.id} delay={idx * 0.06}>
              <article
                className={`h-full rounded-2xl p-6 border flex flex-col justify-between gap-8 lp-interactive ${
                  plan.featured
                    ? 'bg-[#131209] border-[#313131]'
                    : 'bg-[#000000] border-[#272727] hover:bg-[#1F1F1F] hover:border-[#313131]'
                }`}
              >
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="title-2 text-white">{plan.name}</h3>
                      {plan.featured && (
                        <span className="caption-4 bg-[#272727] text-white px-2 py-1 rounded">
                          Managed option
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2 pt-2">
                      <span className="heading-3 lp-mono text-white">{plan.price}</span>
                      <span className="caption-2 text-[#9B9B9B]">{plan.cadence}</span>
                    </div>
                    <p className="body-6 text-[#9B9B9B] pt-2">{plan.desc}</p>
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2 body-6 text-white">
                        <Check size={16} weight="bold" className="text-[#9B9B9B] shrink-0 mt-1" aria-hidden="true" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {plan.to ? (
                  <Link
                    to={plan.to}
                    className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white text-black hover:bg-[#E5E5E5] button-md lp-interactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <span>{plan.ctaLabel}</span>
                    <ArrowRight size={16} weight="bold" aria-hidden="true" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => openWaitlist(plan.planKey)}
                    className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#1F1F1F] border border-[#313131] text-white hover:bg-[#272727] button-md lp-interactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <span>{plan.ctaLabel}</span>
                    <ArrowRight size={16} weight="bold" aria-hidden="true" />
                  </button>
                )}
              </article>
            </RevealBlock>
          ))}
        </div>

        {/* Inline Early Access Form (opens when user picks a managed tier) */}
        {selectedPlan && (
          <div
            role="region"
            aria-label="Managed tier early access request"
            className="bg-[#000000] border border-[#313131] rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="title-2 text-white">Early access for {selectedPlan}</h3>
                <p className="caption-2 text-[#9B9B9B]">
                  Leave your email to receive managed pricing details and onboarding availability when team seats open.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                aria-label="Close early access form"
                className="w-8 h-8 rounded-lg bg-[#181818] border border-[#272727] text-[#9B9B9B] hover:text-white flex items-center justify-center lp-interactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <X size={16} weight="bold" aria-hidden="true" />
              </button>
            </div>

            {formState === 'success' ? (
              <p role="status" className="body-5 text-white flex items-center gap-2 bg-[#181818] border border-[#272727] rounded-xl p-4">
                <CheckCircle size={18} weight="fill" className="text-emerald-400 shrink-0" aria-hidden="true" />
                <span>Early access request recorded for {confirmedEmail}. Meanwhile, launch the local studio free anytime.</span>
              </p>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-3">
                  <label htmlFor="waitlist-email" className="sr-only">
                    Work email address
                  </label>
                  <input
                    id="waitlist-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="you@company.com"
                    aria-invalid={Boolean(errorMsg)}
                    aria-describedby={errorMsg ? 'waitlist-email-error' : undefined}
                    className="flex-1 bg-[#181818] border border-[#272727] focus:border-white rounded-lg px-3 py-2 body-6 text-white placeholder-[#737373] focus:outline-none transition-colors duration-300"
                  />
                  <button
                    type="submit"
                    disabled={formState === 'submitting'}
                    className="py-2 px-3 rounded-lg bg-white text-black hover:bg-[#E5E5E5] disabled:opacity-60 button-md lp-interactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white shrink-0"
                  >
                    {formState === 'submitting' ? 'Saving request...' : 'Join early access'}
                  </button>
                </div>
                {errorMsg && (
                  <p id="waitlist-email-error" role="alert" className="caption-4 text-rose-400 flex items-center gap-2">
                    <WarningCircle size={14} weight="fill" aria-hidden="true" />
                    <span>{errorMsg}</span>
                  </p>
                )}
              </form>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

