import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Github } from 'lucide-react';

const FOOTER_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Node Types', href: '#node-types' }
];

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-dark-800/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700">
            <Cpu className="w-4 h-4 text-white" aria-hidden="true" />
          </span>
          <span className="font-bold text-slate-200 text-sm">FlowForge OS</span>
          <span className="text-xs text-slate-500">— open-source AI workflow orchestration</span>
        </div>

        <nav aria-label="Footer">
          <ul className="flex items-center gap-5">
            {FOOTER_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 rounded"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                to="/login"
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 rounded"
              >
                Sign In
              </Link>
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            aria-label="FlowForge OS on GitHub"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
          >
            <Github className="w-5 h-5" aria-hidden="true" />
          </a>
          <p className="text-xs text-slate-600">Built by the FlowForge Team · MIT License</p>
        </div>
      </div>
    </footer>
  );
}
