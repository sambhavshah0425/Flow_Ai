import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { getSystemCameraPose } from './systemCameraPath';

const targetPos = new Vector3();
const targetLook = new Vector3();

/**
 * Drives the five-phase camera choreography from scroll progress, plus a
 * very small cursor-driven parallax offset layered on top (never enough to
 * feel like the scene is dragging behind the pointer). `pointerRef` holds
 * normalized [-1, 1] mouse coordinates tracked externally via a window
 * mousemove listener, since the canvas itself is pointer-events: none.
 */
export function SystemCameraRig({ progress, reducedMotion, pointerRef }) {
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const currentLookRef = useRef(null);

  useFrame((state, delta) => {
    const pose = getSystemCameraPose(reducedMotion ? 1 : progressRef.current);
    const px = pointerRef?.current?.x || 0;
    const py = pointerRef?.current?.y || 0;
    const parallaxX = reducedMotion ? 0 : px * 0.06;
    const parallaxY = reducedMotion ? 0 : py * 0.03;

    targetPos.set(pose.position[0] + parallaxX, pose.position[1] + parallaxY, pose.position[2]);
    targetLook.set(pose.lookAt[0], pose.lookAt[1], pose.lookAt[2]);

    if (reducedMotion) {
      state.camera.position.copy(targetPos);
      state.camera.lookAt(targetLook);
      return;
    }

    if (!currentLookRef.current) {
      currentLookRef.current = new Vector3().copy(targetLook);
    }

    const dampFactor = 1 - Math.exp(-6 * delta);
    state.camera.position.lerp(targetPos, dampFactor);
    currentLookRef.current.lerp(targetLook, dampFactor);
    state.camera.lookAt(currentLookRef.current);
  });

  return null;
}
