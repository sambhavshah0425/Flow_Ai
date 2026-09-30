import React from 'react';
import { Reveal } from './Reveal';
import { Atom, Server, Database, Wifi, Sparkles } from 'lucide-react';

const STACK = [
  { name: 'React 18', icon: Atom },
  { name: 'Node.js + Express', icon: Server },
  { name: 'MongoDB', icon: Database },
  { name: 'Socket.IO', icon: Wifi },
  { name: 'Ollama + Qwen', icon: Sparkles }
];

export function StackStrip() {
  return (
    <section aria-label="Technology stack" className="border-y border-white/[0.05] bg-lp-800/30">
      <Reveal className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 mb-7">
          Built on a stack you already know
        </p>
        <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
          {STACK.map(({ name, icon: Icon }) => (
            <li key={name} className="flex items-center gap-2.5 text-slate-400 hover:text-slate-200 transition-colors">
              <Icon className="w-5 h-5 text-slate-500" aria-hidden="true" />
              <span className="text-sm font-medium">{name}</span>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
