function smoothstep(t) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function lerpVec3(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/**
 * Elevated top-down product view — the camera looks down on the system from
 * roughly 55° above the ground plane throughout, so the puck reads as an
 * ellipse and the whole network is laid out flat like a schematic. It is one
 * continuous pull-back (no cross-cutting between far keyframes), timed to
 * SystemScene's sequential build:
 *   0.00-0.08  tight top-down on the central node while it establishes itself
 *   0.08-0.78  steady rise + pull-back as each card/tile comes online in turn
 *   0.78-1.00  holds the full top-down composition, everything visible and active
 */
const KEYFRAMES = [
  { t: 0.0, position: [0, 3.1, 1.8], lookAt: [0, 0.05, 0] },
  { t: 0.08, position: [0, 3.5, 2.2], lookAt: [0, 0.0, 0.1] },
  { t: 0.4, position: [0, 5.4, 4.0], lookAt: [0, -0.05, 0.35] },
  // Solved so every card corner, tile corner, puck rim point and tube
  // plateau projects inside |NDC| <= 0.86 down to a 1280x720 viewport —
  // i.e. nothing clips top or bottom on any common screen.
  { t: 0.78, position: [0, 7.2, 5.7], lookAt: [0, -0.1, 0.5] },
  // Identical to the previous keyframe on purpose: once the system is fully
  // built the camera holds this exact framing for the rest of the scroll
  // runway — no further drift, no matter how much extra scroll is left.
  { t: 1.0, position: [0, 7.2, 5.7], lookAt: [0, -0.1, 0.5] },
];

export function getSystemCameraPose(progress) {
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

export const SYSTEM_START_POSE = KEYFRAMES[0];
