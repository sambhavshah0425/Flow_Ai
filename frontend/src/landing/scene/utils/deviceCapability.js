/** One-time WebGL support probe. Devices without WebGL never pay for the 3D bundle. */
export function detectWebglSupport() {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * Coarse device-tier heuristic decided once at mount. Mobile viewport/coarse
 * pointer downgrades a tier regardless of core count, since GPU class
 * correlates with device class more than CPU cores on mobile.
 */
export function detectQualityTier() {
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  const isMobileViewport = window.matchMedia('(max-width: 768px)').matches;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const isLowPower = cores <= 4 || memory <= 4;

  if (isMobileViewport || isCoarsePointer) {
    return isLowPower ? 'low' : 'medium';
  }
  return isLowPower ? 'medium' : 'high';
}

/** Per-tier levers consumed by scene components — single source of truth for counts/quality knobs. */
export const TIER_CONFIG = {
  high: { particleCount: 400, dpr: [1, 2], shadows: true },
  medium: { particleCount: 150, dpr: [1, 1.5], shadows: false },
  low: { particleCount: 60, dpr: [1, 1], shadows: false },
};
