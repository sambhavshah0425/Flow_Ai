import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import {
  Sparkles, Mail, Type, Search, FileText, Database, Download, Clock, GitBranch, Globe
} from 'lucide-react';
import { useSceneStore } from '../store/useSceneStore';

const ICONS = {
  Sparkles, Mail, Type, Search, FileText, Database, Download, Clock, GitBranch, Globe
};

// Matches CARD_TILT_X — tips each module back so its icon faces the elevated
// top-down camera instead of being viewed edge-on.
const TILE_TILT_X = -0.8;

/**
 * A small physical application/tool module: a compact tile floating just
 * above the surface with a recognizable icon, subtle depth, and a soft
 * green glow underneath when active. Arranged in a grid in front of the
 * central node.
 */
export function IconTile3D({ tile, revealed = true, revealProgress = 1.0, active = false }) {
  const groupRef = useRef(null);
  const glowRef = useRef(null);
  const floatSeed = useMemo(() => Math.random() * Math.PI * 2, []);
  const reducedRef = useRef(false);
  const Icon = ICONS[tile.icon] || Sparkles;

  useEffect(() => {
    const sync = (state) => { reducedRef.current = state.reducedMotion; };
    sync(useSceneStore.getState());
    return useSceneStore.subscribe(sync);
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    if (!reducedRef.current) {
      const t = state.clock.elapsedTime;
      groupRef.current.position.y = tile.position[1] + Math.sin(t * 0.5 + floatSeed) * 0.035;
    }
    if (glowRef.current) {
      glowRef.current.material.opacity = active ? 0.35 : 0.1;
    }
  });

  const scale = revealed ? 0.8 + 0.2 * revealProgress : 0.8;
  const opacity = revealed ? revealProgress : 0;

  return (
    <group
      ref={groupRef}
      position={tile.position}
      rotation={[TILE_TILT_X, 0, 0]}
      scale={revealed ? scale : 0}
      visible={revealed && revealProgress > 0}
    >
      <RoundedBox args={[0.62, 0.62, 0.08]} radius={0.13} smoothness={4}>
        <meshStandardMaterial color="#061233" metalness={0.15} roughness={0.55} transparent opacity={0.98 * opacity} />
      </RoundedBox>

      <Html center position={[0, 0, 0.05]} transform distanceFactor={3.6} style={{ pointerEvents: 'none' }}>
        <div
          className="flex items-center justify-center rounded-lg"
          style={{ width: 34, height: 34, background: tile.color || '#0059ff', opacity, transition: 'opacity 0.25s ease-out' }}
        >
          <Icon className="w-[18px] h-[18px] text-white" strokeWidth={2.3} />
        </div>
      </Html>
    </group>
  );
}
