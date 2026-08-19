import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { QuadraticBezierLine } from '@react-three/drei';
import { QuadraticBezierCurve3, Vector3 } from 'three';
import { useSceneStore } from '../store/useSceneStore';

/**
 * A connection between two nodes: draws progressively as scroll advances,
 * and spawns a traveling data pulse particle on a loop once fully drawn.
 * Frozen under reduced motion.
 */
export function Edge3D({ start, end, speed = 0.35, offset = 0, revealed = true, revealProgress = 1.0, execBoost = 1.0, isActive = true }) {
  const particleRef = useRef(null);
  const reducedRef = useRef(false);

  const mid = useMemo(() => {
    const s = new Vector3(...start);
    const e = new Vector3(...end);
    return s.clone().lerp(e, 0.5).add(new Vector3(0, 0.35, 0));
  }, [start, end]);

  const curve = useMemo(
    () => new QuadraticBezierCurve3(new Vector3(...start), mid, new Vector3(...end)),
    [start, end, mid]
  );

  useEffect(() => {
    const sync = (state) => { reducedRef.current = state.reducedMotion; };
    sync(useSceneStore.getState());
    return useSceneStore.subscribe(sync);
  }, []);

  const currentEnd = useMemo(() => {
    if (!revealed) return start;
    if (revealProgress >= 1.0) return end;
    const pt = curve.getPoint(revealProgress);
    return [pt.x, pt.y, pt.z];
  }, [revealed, revealProgress, curve, start, end]);

  const currentMid = useMemo(() => {
    if (!revealed) return start;
    if (revealProgress >= 1.0) return mid.toArray();
    const pt = curve.getPoint(revealProgress * 0.5);
    return [pt.x, pt.y, pt.z];
  }, [revealed, revealProgress, curve, start, mid]);

  useFrame((state) => {
    if (reducedRef.current || !particleRef.current || !revealed || revealProgress < 1.0) return;
    const t = (state.clock.elapsedTime * speed * execBoost + offset) % 1;
    curve.getPoint(t, particleRef.current.position);
  });

  // Dark-slate once a connection has already been made and focus has moved
  // on; sky-blue while its nodes are the current camera focal point (or
  // during the finale, when everything lights up together).
  const lineColor = isActive ? '#0ea5e9' : '#1e293b';
  const baseOpacity = isActive ? 0.75 : 0.28;

  return (
    <group visible={revealed && revealProgress > 0}>
      <QuadraticBezierLine
        start={start}
        end={currentEnd}
        mid={currentMid}
        color={lineColor}
        lineWidth={isActive ? 2.4 : 1.6}
        transparent
        opacity={baseOpacity * (revealed ? revealProgress : 0)}
        dashed
        dashScale={12}
        dashSize={0.5}
        gapSize={0.35}
      />
      <mesh ref={particleRef} position={start} visible={revealed && revealProgress >= 1.0 && isActive}>
        <sphereGeometry args={[0.04, 10, 10]} />
        <meshBasicMaterial color="#38bdf8" toneMapped={false} />
      </mesh>
    </group>
  );
}
