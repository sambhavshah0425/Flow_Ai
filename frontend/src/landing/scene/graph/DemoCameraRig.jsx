import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { getWalkthroughPose } from './demoCameraPath';

// Scratch vectors reused every frame instead of allocated per-frame.
const targetPos = new Vector3();
const targetLook = new Vector3();

/**
 * Drives the camera through a per-node walkthrough as `progress` (this
 * section's own local scroll progress, 0–1) advances — the viewer travels
 * from Text Input through the pipeline to Download, then pulls back to a
 * wide shot for the final flowing state. Reads progress via a ref (updated
 * every render but consumed inside useFrame) so the actual position update
 * stays a smooth per-frame ease rather than a snap tied to React's render
 * rate.
 */
export function DemoCameraRig({ progress, reducedMotion }) {
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const currentLookRef = useRef(null);

  useFrame((state, delta) => {
    const pose = getWalkthroughPose(reducedMotion ? 1 : progressRef.current);
    targetPos.set(pose.position[0], pose.position[1], pose.position[2]);
    targetLook.set(pose.lookAt[0], pose.lookAt[1], pose.lookAt[2]);

    if (reducedMotion) {
      state.camera.position.copy(targetPos);
      state.camera.lookAt(targetLook);
      return;
    }

    if (!currentLookRef.current) {
      currentLookRef.current = new Vector3().copy(targetLook);
    }

    // Exponential decay factor (independent of frame rate, e.g. 7.5 controls speed)
    const dampFactor = 1 - Math.exp(-7.5 * delta);

    state.camera.position.lerp(targetPos, dampFactor);
    currentLookRef.current.lerp(targetLook, dampFactor);
    state.camera.lookAt(currentLookRef.current);
  });

  return null;
}
