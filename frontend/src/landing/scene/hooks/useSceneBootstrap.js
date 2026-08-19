import { useEffect, useState } from 'react';
import { useSceneStore } from '../store/useSceneStore';
import { detectWebglSupport, detectQualityTier } from '../utils/deviceCapability';

/**
 * Mounted once from LandingPage. Decides whether the 3D layer loads at all,
 * feeds the shared scene store (reduced-motion, quality tier, scroll
 * progress, viewport), and warms the Scene3DCanvas chunk on idle so the
 * lazy import resolves instantly once rendered rather than flashing Suspense.
 */
export function useSceneBootstrap() {
  const [webglSupported, setWebglSupported] = useState(() => detectWebglSupport());

  useEffect(() => {
    const supported = detectWebglSupport();
    setWebglSupported(supported);
    useSceneStore.getState().setWebglSupported(supported);

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    useSceneStore.getState().setReducedMotion(media.matches);
    const onReducedMotionChange = (e) => useSceneStore.getState().setReducedMotion(e.matches);
    media.addEventListener('change', onReducedMotionChange);

    const onResize = () => {
      useSceneStore.getState().setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', onResize);
    onResize();

    if (supported) {
      useSceneStore.getState().setQualityTier(detectQualityTier());
    }

    return () => {
      media.removeEventListener('change', onReducedMotionChange);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return { webglSupported };
}
