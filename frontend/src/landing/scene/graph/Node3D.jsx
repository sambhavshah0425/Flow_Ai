import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import { useSceneStore } from '../store/useSceneStore';

/**
 * A highly refined, cinematic dark-graphite workflow node card.
 * Integrates glassmorphism, thin reflective borders, and subtle active glows.
 * Status indicators are nested directly in clean technical HTML typography.
 */
export function Node3D({
  node,
  revealed = true,
  revealProgress = 1.0,
  isActive = false,
  isDim = false,
  execBoost = 1.0
}) {
  const groupRef = useRef(null);
  const cardMaterialRef = useRef(null);
  const outlineMaterialRef = useRef(null);
  const reducedRef = useRef(false);
  const floatSeed = useMemo(() => Math.random() * Math.PI * 2, []);
  const isRunning = node.status === 'running';

  useEffect(() => {
    const sync = (state) => { reducedRef.current = state.reducedMotion; };
    sync(useSceneStore.getState());
    return useSceneStore.subscribe(sync);
  }, []);

  useFrame((state) => {
    if (reducedRef.current || !groupRef.current) return;
    const t = state.clock.elapsedTime;
    
    // Very subtle, physically controlled floating hover (half previous amplitude)
    groupRef.current.position.y = node.position[1] + Math.sin(t * 0.4 + floatSeed) * 0.04;

    if (cardMaterialRef.current) {
      const baseIntensity = isActive ? (isRunning ? 0.45 : 0.2) : (isDim ? 0.02 : 0.08);
      const pulse = isRunning ? (0.5 + Math.sin(t * 2.2) * 0.5) * 0.25 * execBoost : 0;
      cardMaterialRef.current.emissiveIntensity = (baseIntensity + pulse) * revealProgress;
    }
  });

  const scale = revealed ? 0.88 + (1.0 - 0.88) * revealProgress : 0.88;
  const opacity = revealed ? revealProgress : 0.0;

  // Determine dynamic edge/rim color based on state
  const rimColor = isActive ? '#0ea5e9' : (isDim ? '#161d2a' : '#273549');

  return (
    <group
      ref={groupRef}
      position={node.position}
      scale={revealed ? scale : 0}
      visible={revealed && revealProgress > 0}
    >
      {/* Thin reflective micro-border wrapped around card */}
      <RoundedBox args={[1.715, 0.735, 0.09]} radius={0.075} smoothness={4} position={[0, 0, 0]}>
        {/* metalness/roughness kept moderate on purpose: metals only reflect
            environment light, and this scene has no <Environment>/HDRI — at
            0.8/0.2 this would render flat/near-black under point lights
            alone. The glow comes from emissive intensity, not reflections. */}
        <meshStandardMaterial
          ref={outlineMaterialRef}
          color={rimColor}
          emissive={isActive ? '#0ea5e9' : '#030712'}
          emissiveIntensity={isActive ? 0.75 : 0.05}
          metalness={0.35}
          roughness={0.45}
          transparent
          opacity={0.85 * opacity}
        />
      </RoundedBox>

      {/* Card body - dark polished graphite glass */}
      <RoundedBox args={[1.7, 0.72, 0.1]} radius={0.07} smoothness={4}>
        <meshStandardMaterial
          ref={cardMaterialRef}
          color="#0b0f19"
          emissive={node.color}
          emissiveIntensity={0.05}
          metalness={0.3}
          roughness={0.4}
          toneMapped={false}
          transparent
          opacity={0.98 * opacity}
        />
      </RoundedBox>

      {/* Premium Technical Typography & Indicators in HTML Overlay */}
      <Html center position={[0, 0, 0.06]} transform distanceFactor={4.2} style={{ pointerEvents: 'none' }}>
        <div
          className={`w-[150px] text-left select-none px-3.5 py-2.5 rounded-lg border backdrop-blur-md transition-all duration-500 ${
            isActive
              ? 'bg-slate-950/85 border-sky-500/25 shadow-[0_0_15px_rgba(14,165,233,0.08)]'
              : 'bg-slate-950/40 border-white/[0.02]'
          }`}
          style={{ opacity: opacity, transition: 'opacity 0.25s ease-out' }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[11px] font-semibold tracking-tight transition-colors duration-300 ${isActive ? 'text-sky-200 font-bold' : 'text-slate-400'}`}>
              {node.label}
            </span>
            <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
              node.status === 'running' && isActive ? 'bg-sky-400 animate-pulse' : node.status === 'done' ? 'bg-emerald-500/80' : 'bg-slate-700'
            }`} />
          </div>
          <div className={`text-[8px] font-mono mt-1.5 truncate transition-colors duration-300 ${isActive ? 'text-slate-400' : 'text-slate-600'}`}>
            {node.sub}
          </div>
        </div>
      </Html>
    </group>
  );
}
