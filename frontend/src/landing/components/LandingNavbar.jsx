import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight, FlowArrow } from '@phosphor-icons/react';
import { BASE_EASE } from './MotionPrimitives';

const NAV_ITEMS = [
  { id: 'benefits', label: 'Benefits' },
  { id: 'preview', label: 'Preview' },
  { id: 'nodes', label: 'Nodes' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'faq', label: 'FAQ' }
];

export function LandingNavbar() {
  const [activeId, setActiveId] = useState('benefits');
  const [menuOpen, setMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const sections = NAV_ITEMS.map((item) => document.getElementById(item.id)).filter(Boolean);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0.1, 0.4] }
    );

    sections.forEach((sec) => observer.observe(sec));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <>
      <header className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
        <nav
          aria-label="Primary navigation"
          className="pointer-events-auto w-full md:w-fit bg-[#181818]/85 backdrop-blur-xl border border-[#272727] rounded-2xl p-2 flex items-center justify-between gap-4"
        >
          <a
            href="#top"
            className="flex items-center gap-2 px-2 py-1 rounded-lg text-white lp-interactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center shrink-0">
              <FlowArrow size={18} weight="bold" aria-hidden="true" />
            </span>
            <span className="title-4 text-white whitespace-nowrap">FlowForge OS</span>
          </a>

          <ul className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeId === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    aria-current={isActive ? 'location' : undefined}
                    className={`block px-3 py-2 rounded-lg title-4 lp-interactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                      isActive
                        ? 'bg-[#272727] text-white'
                        : 'text-[#9B9B9B] hover:text-white hover:bg-[#1F1F1F]'
                    }`}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden md:inline-flex items-center gap-2 py-2 px-3 rounded-lg bg-white text-black hover:bg-[#E5E5E5] button-sm lp-interactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white whitespace-nowrap"
            >
              <span>Start studio</span>
              <ArrowRight size={14} weight="bold" aria-hidden="true" />
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="md:hidden w-10 h-10 rounded-lg bg-[#1F1F1F] border border-[#272727] flex items-center justify-center lp-interactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span className="relative w-4 h-3 flex flex-col justify-between" aria-hidden="true">
                <span
                  className={`block h-0.5 w-4 bg-white rounded-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] origin-center ${
                    menuOpen ? 'translate-y-[5px] rotate-45' : ''
                  }`}
                />
                <span
                  className={`block h-0.5 w-4 bg-white rounded-full transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    menuOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`block h-0.5 w-4 bg-white rounded-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] origin-center ${
                    menuOpen ? '-translate-y-[5px] -rotate-45' : ''
                  }`}
                />
              </span>
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: BASE_EASE }}
            className="fixed inset-0 h-screen z-40 bg-[#000000]/95 backdrop-blur-2xl md:hidden flex flex-col justify-between pt-24 pb-8 px-6"
          >
            <ul className="flex flex-col gap-3">
              {NAV_ITEMS.map((item, idx) => {
                const isActive = activeId === item.id;
                const delay = Math.min(idx * 0.06, 0.36);
                return (
                  <motion.li
                    key={item.id}
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
                    animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, delay, ease: BASE_EASE }}
                  >
                    <a
                      href={`#${item.id}`}
                      onClick={() => setMenuOpen(false)}
                      aria-current={isActive ? 'location' : undefined}
                      className={`block p-4 rounded-2xl border title-2 lp-interactive ${
                        isActive
                          ? 'bg-[#181818] border-[#313131] text-white'
                          : 'bg-[#181818] border-[#272727] text-[#9B9B9B] hover:text-white'
                      }`}
                    >
                      {item.label}
                    </a>
                  </motion.li>
                );
              })}
            </ul>

            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.36, ease: BASE_EASE }}
              className="space-y-3"
            >
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white text-black button-md lp-interactive"
              >
                <span>Start local studio</span>
                <ArrowRight size={16} weight="bold" aria-hidden="true" />
              </Link>
              <p className="caption-5 text-[#9B9B9B] text-center">
                MIT open source. Local Qwen engine via Ollama.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
