import { create } from 'zustand';

/**
 * Shared device capabilities and hardware tier parameters for the R3F demo canvas.
 */
export const useSceneStore = create((set) => ({
  qualityTier: 'medium',
  reducedMotion: false,
  webglSupported: false,
  viewport: { width: 0, height: 0 },

  setQualityTier: (qualityTier) => set({ qualityTier }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setWebglSupported: (webglSupported) => set({ webglSupported }),
  setViewport: (viewport) => set({ viewport }),
}));
