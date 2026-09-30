import React, { lazy, Suspense, useEffect, useState, useRef } from 'react';
import Lenis from 'lenis';
import { useSceneBootstrap } from './scene/hooks/useSceneBootstrap';
import { AmbientBackground } from './components/AmbientBackground';
import { LandingNavbar } from './components/LandingNavbar';
import { HeroSection } from './components/HeroSection';
import { StackStrip } from './components/StackStrip';
import { ProblemSolutionSection } from './components/ProblemSolutionSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { NodeShowcaseSection } from './components/NodeShowcaseSection';
import { LiveExecutionSection } from './components/LiveExecutionSection';
import { SecuritySection } from './components/SecuritySection';
import { ProductShowcaseSection } from './components/ProductShowcaseSection';
import { FinalCTASection } from './components/FinalCTASection';
import { LandingFooter } from './components/LandingFooter';
import { Slab } from './components/Slab';
import './landing.css';

const LiveDemoSection = lazy(() => import('./components/LiveDemoSection'));

/**
 * Public marketing page mounted at "/". Composes the landing sections in
 * order; all app chrome (the in-app Navbar) is hidden on this route.
 */
export function LandingPage() {
  useSceneBootstrap();
  const [loadDemo, setLoadDemo] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    // Visual-QA affordance: `?lpy=<px>` pins the page at an absolute scroll
    // offset with smooth scrolling disabled, so headless screenshot tooling
    // can capture any section. Lenis otherwise animates scroll back to 0 and
    // makes automated section captures impossible. Inert without the param.
    const qaOffset = new URLSearchParams(window.location.search).get('lpy');
    if (qaOffset !== null) {
      const y = Number(qaOffset) || 0;
      const pin = () => window.scrollTo(0, y);
      pin();
      const t1 = setTimeout(pin, 300);
      const t2 = setTimeout(pin, 1200);
      setLoadDemo(true); // the observer can't fire without a real scroll event
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }

    // Initialize Lenis smooth scroll engine
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.0,
    });

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoadDemo(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' }
    );
    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }
    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="lp-root relative text-slate-100 scroll-smooth">
      <AmbientBackground />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:bg-lp-600 focus:text-white focus:rounded-lg"
      >
        Skip to content
      </a>
      <LandingNavbar />
      <main id="main-content">
        <HeroSection />
        <StackStrip />

        {/* Bounded Scroll-Demo boundary sentinel */}
        <div ref={sentinelRef}>
          {loadDemo ? (
            <Suspense fallback={<div className="h-[270vh] bg-lp-900" />}>
              <LiveDemoSection />
            </Suspense>
          ) : (
            <div className="h-[270vh] bg-lp-900" />
          )}
        </div>

        {/* Each panel below rides up over the one before it (see .lp-slab).
            The Live Demo section above is deliberately left unwrapped — it is
            locked, and its own 270vh sticky scroll would fight an overlapping
            stacking context. */}
        <Slab as="div" tone="dark"><ProblemSolutionSection /></Slab>
        <Slab as="div" tone="dark"><HowItWorksSection /></Slab>
        <Slab as="div" tone="paper"><NodeShowcaseSection /></Slab>
        <Slab as="div" tone="dark"><LiveExecutionSection /></Slab>
        <Slab as="div" tone="dark"><SecuritySection /></Slab>
        <Slab as="div" tone="dark"><ProductShowcaseSection /></Slab>
        <Slab as="div" tone="dark"><FinalCTASection /></Slab>
      </main>
      <LandingFooter />
    </div>
  );
}

export default LandingPage;
