import React from 'react';
import { LandingNavbar } from './components/LandingNavbar';
import { HeroSection } from './components/HeroSection';
import { BenefitsSection } from './components/BenefitsSection';
import { InteractivePreviewSection } from './components/InteractivePreviewSection';
import { TaglineRevealSection } from './components/TaglineRevealSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { NodeLibrarySection } from './components/NodeLibrarySection';
import { PricingSection } from './components/PricingSection';
import { FaqSection } from './components/FaqSection';
import { FinalCTASection } from './components/FinalCTASection';
import { LandingFooter } from './components/LandingFooter';
import './landing.css';

/**
 * Public marketing landing page mounted at "/".
 * Self-contained under .lp-root so authenticated studio pages remain isolated.
 */
export function LandingPage() {
  return (
    <div className="lp-root min-h-screen bg-[#000000] text-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-lg button-sm"
      >
        Skip to content
      </a>

      <LandingNavbar />

      <main id="main-content">
        <HeroSection />
        <BenefitsSection />
        <InteractivePreviewSection />
        <TaglineRevealSection />
        <HowItWorksSection />
        <NodeLibrarySection />
        <PricingSection />
        <FaqSection />
        <FinalCTASection />
      </main>

      <LandingFooter />
    </div>
  );
}

export default LandingPage;
