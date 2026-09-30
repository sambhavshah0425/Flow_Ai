import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial, ContactShadows } from '@react-three/drei';
import { useSceneStore } from '../store/useSceneStore';

/** Pale physical ground plane (matches the reference's light product-render environment) + drifting ambient/energy particles + a soft grounded contact shadow under the central node. */
export function Environment3D({ particleCount = 140 }) {
  const pointsRef = useRef(null);
  const reducedRef = useRef(false);

  useEffect(() => {
    const sync = (state) => { reducedRef.current = state.reducedMotion; };
    sync(useSceneStore.getState());
    return useSceneStore.subscribe(sync);
  }, []);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 3 + Math.random() * 6;
      const angle = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.random() * 2.2 - 0.3;
      pos[i * 3 + 2] = Math.sin(angle) * radius - 1;
      const isAccent = Math.random() < 0.18;
      const c = isAccent ? [0.0, 0.35, 1.0] : [0.32, 0.44, 0.68];
      col[i * 3] = c[0];
      col[i * 3 + 1] = c[1];
      col[i * 3 + 2] = c[2];
    }
    return { positions: pos, colors: col };
  }, [particleCount]);

  useFrame((state) => {
    if (reducedRef.current || !pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.008;
  });

  return (
    <group>
      {/* Ground plane — near-black navy, the deepest surface in the hierarchy */}
      <mesh position={[0, -1.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40, 1, 1]} />
        <meshStandardMaterial color="#030923" roughness={0.9} metalness={0.1} />
      </mesh>

      <ContactShadows position={[0, -1.04, 0]} opacity={0.5} scale={12} blur={2.6} far={3} resolution={512} color="#000000" />

      <Points ref={pointsRef} positions={positions} colors={colors} stride={3}>
        <PointMaterial size={0.035} vertexColors transparent opacity={0.55} sizeAttenuation depthWrite={false} />
      </Points>
    </group>
  );
}
