import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Github, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Node Types', href: '#node-types' },
  { label: 'GitHub', href: 'https://github.com', external: true }
];

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-[padding] duration-300 ease-expo ${scrolled ? 'sm:pt-3' : ''}`}>
      <nav
        aria-label="Main"
        className={`max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 transition-all duration-300 ease-expo ${
          scrolled
            ? 'bg-dark-900/85 backdrop-blur-xl border-b border-white/[0.06] sm:border sm:rounded-2xl shadow-lg shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        {/* Logo */}
        <a href="#top" className="flex items-center gap-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500">
          <span className="p-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-500/30">
            <Cpu className="w-5 h-5 text-white" aria-hidden="true" />
          </span>
          <span className="font-bold text-white text-lg tracking-tight whitespace-nowrap">
            FlowForge <span className="text-[10px] align-top font-semibold text-brand-500 border border-brand-500/40 rounded px-1 py-0.5 ml-0.5">OS</span>
          </span>
        </a>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                {...(link.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
              >
                {link.external && <Github className="w-4 h-4" aria-hidden="true" />}
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            to="/login"
            className="px-3.5 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
          >
            Sign In
          </Link>
          <Link
            to="/login"
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-brand-500 to-brand-700 hover:from-brand-500 hover:to-brand-600 shadow-lg shadow-brand-500/25 transition-all hover:shadow-brand-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
        >
          {menuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div id="mobile-nav" className="md:hidden bg-dark-900/95 backdrop-blur-xl border-b border-white/[0.06] px-4 pb-4">
          <ul className="flex flex-col gap-1 pt-2">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  {...(link.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="pt-2 flex flex-col gap-2">
              <Link
                to="/login"
                className="block text-center px-3 py-2.5 rounded-lg text-sm text-slate-200 border border-white/10 hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
              >
                Sign In
              </Link>
              <Link
                to="/login"
                className="block text-center px-3 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-brand-500 to-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                Get Started
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
