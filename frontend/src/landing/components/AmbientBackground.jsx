import React from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Page-wide atmospheric backdrop: a fixed dot-grid with a soft radial vignette
 * plus slow-drifting colored glow blobs. Purely decorative — aria-hidden. The
 * blobs stop drifting under prefers-reduced-motion (the CSS animation classes
 * are simply not applied).
 */
export function AmbientBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient — deep navy falling away to black */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,#061233_0%,#030923_45%,#000000_100%)]" />

      {/* Dot grid with a fade-to-edges mask */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(122,167,255,0.16) 1px, transparent 0)',
          backgroundSize: '30px 30px',
          maskImage: 'radial-gradient(110% 70% at 50% 0%, #000 40%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(110% 70% at 50% 0%, #000 40%, transparent 85%)',
        }}
      />

      {/* Drifting glow blobs — restrained electric-blue light spill */}
      <div className={`absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[520px] rounded-full bg-lp-500/12 blur-[150px] ${reduceMotion ? '' : 'animate-blob-a'}`} />
      <div className={`absolute top-1/3 -left-40 w-[460px] h-[460px] rounded-full bg-lp-700/10 blur-[130px] ${reduceMotion ? '' : 'animate-blob-b'}`} />
      <div className={`absolute top-2/3 -right-40 w-[440px] h-[440px] rounded-full bg-lp-600/10 blur-[130px] ${reduceMotion ? '' : 'animate-blob-a'}`} />
    </div>
  );
}
