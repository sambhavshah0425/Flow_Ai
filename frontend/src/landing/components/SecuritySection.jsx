import React from 'react';
import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';
import { ClaimProofCard } from './ClaimProofCard';
import { Lock, KeyRound, ShieldCheck } from 'lucide-react';

const COPY = {
  eyebrow: 'Secrets & security',
  title: 'Keys in a vault, never in your workflows',
  lede: 'API keys are stored per-user with AES-256-GCM encryption and injected into nodes at runtime. Workflow definitions stay clean and shareable — no credentials baked in.',
  cards: [
    {
      icon: Lock,
      accent: 'run',
      title: 'AES-256-GCM vault',
      description: 'Each secret is encrypted with a unique IV and auth tag. Values decrypt only at execution time, in memory, for the run that needs them.',
      proof: {
        label: 'Secret at rest',
        lines: [
          { text: 'key: GEMINI_API_KEY', dim: true },
          { text: 'iv:  9f3c1a…e07b', dim: true },
          { text: 'data: 4a1e…c2 (encrypted)', accent: true }
        ]
      }
    },
    {
      icon: KeyRound,
      accent: 'aiv',
      title: '{{secrets.KEY}} injection',
      description: 'Reference any stored secret from a node template. It resolves at runtime and never appears in the saved workflow JSON.',
      proof: {
        label: 'Runtime resolve',
        lines: [
          { text: 'apiKey: "{{secrets.GEMINI_API_KEY}}"', dim: true },
          { text: '        ↓ resolved in-memory', dim: true },
          { text: 'apiKey: •••••••••• ✓', accent: true }
        ]
      }
    },
    {
      icon: ShieldCheck,
      accent: 'brand',
      title: 'JWT auth · zero-config start',
      description: 'JWT-based sessions guard every route. And if MongoDB isn’t running, the backend falls back to in-memory storage — clone and run with nothing else installed.',
      proof: {
        label: 'Server boot',
        lines: [
          { text: '[auth] JWT middleware active', dim: true },
          { text: '[db] MongoDB not found', dim: true },
          { text: '↳ in-memory mode ready', accent: true }
        ]
      }
    }
  ]
};

export function SecuritySection() {
  return (
    <section aria-labelledby="security-heading" className="py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <SectionHeading id="security-heading" eyebrow={COPY.eyebrow} title={COPY.title} lede={COPY.lede} />
        <div className="space-y-4">
          {COPY.cards.map((card, i) => (
            <Reveal key={card.title} delay={i * 0.08}>
              <ClaimProofCard {...card} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
