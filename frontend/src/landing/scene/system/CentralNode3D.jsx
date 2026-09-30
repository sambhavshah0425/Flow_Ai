import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Shape, ExtrudeGeometry } from 'three';
import { useSceneStore } from '../store/useSceneStore';

/** A single chevron wedge (">") used twice, offset, to build the double-chevron mark. */
function chevronShape(w, h, thickness) {
  const s = new Shape();
  s.moveTo(-w / 2, h / 2);
  s.lineTo(w / 2, 0);
  s.lineTo(-w / 2, -h / 2);
  s.lineTo(-w / 2 + thickness, -h / 2);
  s.lineTo(w / 2 - thickness * 1.15, 0);
  s.lineTo(-w / 2 + thickness, h / 2);
  s.closePath();
  return s;
}

/**
 * The hero's physical anchor: a thick machined puck sitting on the ground
 * plane, with a beveled sidewall, a luminous cyan-green perimeter ring, and
 * a small recessed geometric mark on the top surface. Built from layered
 * primitives (no bevel geometry helper needed) so it reads as a real object
 * with top/side/bevel surfaces rather than a flat disc.
 */
export function CentralNode3D({ activation = 0 }) {
  const ringRef = useRef(null);
  const reducedRef = useRef(false);

  const markGeometry = useMemo(() => {
    const shape = chevronShape(0.62, 0.62, 0.16);
    return new ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2 });
  }, []);

  useEffect(() => {
    const sync = (state) => { reducedRef.current = state.reducedMotion; };
    sync(useSceneStore.getState());
    return useSceneStore.subscribe(sync);
  }, []);

  useFrame((state) => {
    if (!ringRef.current) return;
    const t = state.clock.elapsedTime;
    const breathe = reducedRef.current ? 0 : Math.sin(t * 1.1) * 0.08;
    ringRef.current.material.emissiveIntensity = 1.1 + breathe + activation * 1.4;
  });

  return (
    <group position={[0, -0.62, 0]}>
      {/* Main body. These tones are deliberately lifted well clear of the
          #030923 ground plane: when the sidewall and top face matched the
          floor colour the puck read as a flat hole cut in the ground rather
          than a solid machined object sitting on it. */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[1.55, 1.62, 0.85, 64]} />
        <meshStandardMaterial color="#123a7a" metalness={0.35} roughness={0.45} />
      </mesh>

      {/* Bevel collar (slightly larger, catches rim light) */}
      <mesh position={[0, 0.395, 0]}>
        <cylinderGeometry args={[1.58, 1.55, 0.07, 64]} />
        <meshStandardMaterial color="#2158b8" metalness={0.45} roughness={0.28} />
      </mesh>

      {/* Top surface (slightly inset, glossy) */}
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[1.48, 1.48, 0.02, 64]} />
        <meshStandardMaterial color="#17408f" metalness={0.3} roughness={0.25} />
      </mesh>

      {/* Luminous perimeter ring */}
      <mesh ref={ringRef} position={[0, 0.435, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.42, 0.02, 12, 96]} />
        <meshStandardMaterial
          color="#030923"
          emissive="#0059ff"
          emissiveIntensity={1.3}
          toneMapped={false}
        />
      </mesh>

      {/* Double-chevron brand mark, recessed into the top surface */}
      <group position={[0, 0.43, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh geometry={markGeometry} position={[-0.16, 0, 0]}>
          <meshStandardMaterial color="#030923" metalness={0.7} roughness={0.2} emissive="#0059ff" emissiveIntensity={0.65} />
        </mesh>
        <mesh geometry={markGeometry} position={[0.16, 0, 0]}>
          <meshStandardMaterial color="#030923" metalness={0.7} roughness={0.2} emissive="#0059ff" emissiveIntensity={0.65} />
        </mesh>
      </group>

      {/* Contact shadow disc (soft dark gradient-ish fake AO) */}
      <mesh position={[0, -0.426, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.05, 48]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
