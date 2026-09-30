import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useSceneStore } from '../scene/store/useSceneStore';
import { SystemScene } from '../scene/system/SystemScene';
import { SystemCameraRig } from '../scene/system/SystemCameraRig';
import { SYSTEM_START_POSE } from '../scene/system/systemCameraPath';
import { SYSTEM_DESCRIPTION } from '../scene/system/systemData';
import NodeNetwork from './NodeNetwork';
import { ChevronDown } from 'lucide-react';

const COPY = {
  eyebrow: 'The core system',
  title: 'One engine. Every connection.',
  lede: 'Scroll to travel through the nodes and explore the complete FlowForge network.'
};

const STEPS = [
  { label: 'Core Engine', end: 0.08 },
  { label: 'Connecting Nodes', end: 0.78 },
  { label: 'Full System Live', end: 1.0 },
];

function getCurrentStepIndex(progress) {
  for (let i = 0; i < STEPS.length; i++) {
    if (progress < STEPS[i].end) return i;
  }
  return STEPS.length - 1;
}

export default function LiveDemoSection() {
  const wrapperRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const qualityTier = useSceneStore((state) => state.qualityTier);
  const reducedMotion = useSceneStore((state) => state.reducedMotion);
  const webglSupported = useSceneStore((state) => state.webglSupported);
  const [targetProgress, setTargetProgress] = useState(reducedMotion ? 1.0 : 0);
  const [easedProgress, setEasedProgress] = useState(reducedMotion ? 1.0 : 0);

  useEffect(() => {
    if (reducedMotion) {
      setTargetProgress(1.0);
      setEasedProgress(1.0);
      return;
    }
    const onScroll = () => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return;
      const computedProgress = Math.min(1, Math.max(0, -rect.top / total));
      setTargetProgress(computedProgress);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [reducedMotion]);

  // Subtle cursor parallax input, tracked window-wide since the canvas is pointer-events: none.
  useEffect(() => {
    if (reducedMotion) return;
    const onMove = (e) => {
      pointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [reducedMotion]);

  // Smoothly interpolate progress over animation frames
  useEffect(() => {
    if (reducedMotion) return;
    let rafId;
    const ease = () => {
      setEasedProgress((prev) => {
        const diff = targetProgress - prev;
        if (Math.abs(diff) < 0.0005) return targetProgress;
        return prev + diff * 0.12; // 0.12 coefficient provides smooth momentum
      });
      rafId = requestAnimationFrame(ease);
    };
    ease();
    return () => cancelAnimationFrame(rafId);
  }, [targetProgress, reducedMotion]);

  const progress = reducedMotion ? 1.0 : easedProgress;
  const dpr = qualityTier === 'high' ? [1, 2] : 1;
  const currentStep = getCurrentStepIndex(progress);

  return (
    <section
      ref={wrapperRef}
      id="interactive-demo"
      className="relative h-[270vh]"
      style={{ background: 'linear-gradient(180deg, #030923 0%, #061233 55%, #030923 100%)' }}
    >
      <span className="sr-only">{SYSTEM_DESCRIPTION}</span>
      <div className="sticky top-0 h-screen w-full flex flex-col justify-between overflow-hidden py-16">
        {/* Header Overlay */}
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center pointer-events-none">
          <span className="text-xs font-bold uppercase tracking-widest text-lp-400 bg-lp-500/10 px-3 py-1 rounded-full border border-lp-500/25">
            {COPY.eyebrow}
          </span>
          <h2 className="mt-4 text-2xl sm:text-4xl font-bold text-white tracking-tight">
            {COPY.title}
          </h2>
          <p className="mt-2 text-slate-400 text-sm max-w-xl mx-auto">
            {COPY.lede}
          </p>
        </div>

        {/* Bounded visual area */}
        <div className="absolute inset-x-0 bottom-14 top-[220px] z-0 pointer-events-none flex items-center justify-center">
          {webglSupported ? (
            <Canvas
              dpr={dpr}
              flat
              camera={{ position: SYSTEM_START_POSE.position, fov: 42, near: 0.1, far: 30 }}
              gl={{ antialias: true, alpha: true }}
            >
              <fog attach="fog" args={['#030923', 9, 22]} />
              <ambientLight intensity={0.55} />
              <directionalLight position={[3, 6, 4]} intensity={0.9} color="#ffffff" />
              <directionalLight position={[-4, 3, -2]} intensity={0.45} color="#4d8cff" />
              <directionalLight position={[0, 2, -5]} intensity={0.35} color="#7aa7ff" />
              <pointLight position={[0, 1.2, 0]} intensity={1.4} color="#0059ff" distance={6} />

              <SystemScene progress={progress} reducedMotion={reducedMotion} />
              <SystemCameraRig progress={progress} reducedMotion={reducedMotion} pointerRef={pointerRef} />
            </Canvas>
          ) : (
            <div className="w-[800px] h-[400px] max-w-full opacity-70">
              <NodeNetwork />
            </div>
          )}
        </div>

        {/* Scroll invitation helper, replaced by the step indicator once scrolling starts */}
        {progress < 0.05 && !reducedMotion ? (
          <div className="relative z-10 flex flex-col items-center gap-1.5 text-xs font-mono text-slate-500 animate-bounce pointer-events-none pb-6">
            <span>Scroll to reveal the system</span>
            <ChevronDown className="w-4 h-4" />
          </div>
        ) : (
          <div className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2.5 px-4 pb-6 flex-wrap pointer-events-none">
            {STEPS.map((step, i) => (
              <span key={step.label} className="flex items-center gap-1.5 sm:gap-2.5">
                <span
                  className={`text-[10px] sm:text-[11px] font-mono tracking-wide transition-colors duration-300 ${
                    i === currentStep ? 'text-lp-400 font-semibold' : i < currentStep ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  {String(i + 1).padStart(2, '0')} {step.label}
                </span>
                {i < STEPS.length - 1 && <span className="text-slate-700 text-[10px]">→</span>}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
