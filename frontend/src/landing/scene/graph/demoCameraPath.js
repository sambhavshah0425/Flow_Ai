function smoothstep(t) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function lerpVec3(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/**
 * One camera pose per reveal milestone from WorkflowGraphScene's ranges —
 * the camera visits each node as it's revealed (Text Input → PDF Reader →
 * Gemini AI → REST API/Delay Timer → Download), then pulls back to a wide
 * shot for the final "whole pipeline flowing" beat.
 */
const KEYFRAMES = [
  { t: 0.0, position: [-2.2, 1.3, 5.0], lookAt: [-3.0, 0.4, -0.4] }, // Text Input
  { t: 0.15, position: [-2.2, 0.5, 5.0], lookAt: [-3.0, -0.85, -1.3] }, // PDF Reader
  { t: 0.3, position: [0.0, 1.3, 4.8], lookAt: [0.0, -0.1, 0.4] }, // Gemini AI
  { t: 0.45, position: [2.2, 1.3, 5.0], lookAt: [3.0, 0.4, -1.0] }, // REST API / Delay Timer
  { t: 0.6, position: [2.2, 0.3, 5.0], lookAt: [3.0, -1.2, -2.2] }, // Download
  { t: 0.75, position: [0.0, 1.5, 8.2], lookAt: [0.0, -0.6, -0.8] }, // pull back, full pipeline flowing
  { t: 1.0, position: [0.0, 1.5, 8.2], lookAt: [0.0, -0.6, -0.8] },
];

export function getWalkthroughPose(progress) {
  const p = Math.min(1, Math.max(0, progress));
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    const a = KEYFRAMES[i];
    const b = KEYFRAMES[i + 1];
    if (p >= a.t && p <= b.t) {
      const localT = smoothstep((p - a.t) / (b.t - a.t || 1));
      return { position: lerpVec3(a.position, b.position, localT), lookAt: lerpVec3(a.lookAt, b.lookAt, localT) };
    }
  }
  const last = KEYFRAMES[KEYFRAMES.length - 1];
  return { position: last.position, lookAt: last.lookAt };
}

export const WALKTHROUGH_START_POSE = KEYFRAMES[0];
