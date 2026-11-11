import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FlowArrow, GithubLogo, X } from '@phosphor-icons/react';

const PRODUCT_LINKS = [
  { label: 'Benefits', href: '#benefits' },
  { label: 'Preview', href: '#preview' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Nodes', href: '#nodes' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' }
];

const CONSENT_KEY = 'flowforge_storage_notice_ack';

export function LandingFooter() {
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CONSENT_KEY);
      if (!saved) setShowNotice(true);
    } catch {
      setShowNotice(false);
    }
  }, []);

  const acknowledgeNotice = () => {
    try {
      window.localStorage.setItem(CONSENT_KEY, 'accepted');
    } catch {
      // Ignore storage failures
    }
    setShowNotice(false);
  };

  return (
    <footer className="bg-[#000000] py-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto bg-[#181818] border border-[#272727] rounded-3xl p-8 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-2 max-w-md">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center shrink-0">
                <FlowArrow size={18} weight="bold" aria-hidden="true" />
              </span>
              <span className="title-3 text-white">FlowForge OS</span>
            </div>
            <p className="caption-2 text-[#9B9B9B]">
              Visual DAG workflow orchestration powered locally by Qwen through Ollama.
            </p>
          </div>

          <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-4">
            {PRODUCT_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="caption-1 text-[#9B9B9B] hover:text-white lp-interactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white rounded"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/login"
              className="caption-1 text-[#9B9B9B] hover:text-white lp-interactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white rounded"
            >
              Sign in
            </Link>
          </nav>
        </div>

        <div className="bg-[#000000] border border-[#272727] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/privacy"
              className="caption-4 text-[#9B9B9B] hover:text-white lp-interactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white rounded"
            >
              Privacy policy
            </Link>
            <Link
              to="/terms"
              className="caption-4 text-[#9B9B9B] hover:text-white lp-interactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white rounded"
            >
              Terms of service
            </Link>
            <button
              type="button"
              onClick={() => setShowNotice(true)}
              className="caption-4 text-[#9B9B9B] hover:text-white lp-interactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white rounded"
            >
              Storage notice
            </button>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/sambhavshah0425/Flow_Ai"
              target="_blank"
              rel="noreferrer"
              aria-label="FlowForge OS GitHub repository"
              className="inline-flex items-center gap-2 caption-4 text-[#9B9B9B] hover:text-white lp-interactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white rounded"
            >
              <GithubLogo size={16} weight="regular" aria-hidden="true" />
              <span>GitHub</span>
            </a>
            <span className="caption-5 text-[#737373]">MIT License · FlowForge Team</span>
          </div>
        </div>
      </div>

      {showNotice && (
        <aside
          aria-label="Essential local storage notice"
          className="fixed bottom-4 inset-x-4 sm:left-auto sm:right-4 z-50 sm:max-w-sm bg-[#181818] border border-[#313131] rounded-2xl p-4 space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="caption-2 text-[#9B9B9B]">
              FlowForge OS uses essential local storage only for authentication tokens and UI preferences. No tracking cookies are set.
            </p>
            <button
              type="button"
              onClick={acknowledgeNotice}
              aria-label="Dismiss storage notice"
              className="w-6 h-6 rounded bg-[#272727] text-white flex items-center justify-center shrink-0 lp-interactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <X size={12} weight="bold" aria-hidden="true" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={acknowledgeNotice}
              className="py-2 px-3 rounded-lg bg-white text-black hover:bg-[#E5E5E5] button-xsm lp-interactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Got it
            </button>
            <Link
              to="/privacy"
              className="caption-4 text-[#9B9B9B] hover:text-white lp-interactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white rounded"
            >
              Read privacy policy
            </Link>
          </div>
        </aside>
      )}
    </footer>
  );
}
