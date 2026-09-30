import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import { Code2, Globe, Database, Mail } from 'lucide-react';
import { useSceneStore } from '../store/useSceneStore';

const ICONS = { Code2, Globe, Database, Mail };

// The scene is viewed from ~55° above the ground plane. Tipping each panel
// back by ~46° leaves it nearly square-on to that camera (so the label stays
// crisp) while still reading as a physical object standing in the world
// rather than a flat sticker lying on the floor.
const CARD_TILT_X = -0.8;

/**
 * A floating physical UI panel mounted at the end of a tube pathway: a
 * "stacked card" — a slightly offset duplicate layer beneath a white body —
 * wrapped in a thin green outline frame, with a small icon chip and bold
 * label. Settles into position with a slight vertical hover.
 */
export function InfoCard3D({ card, revealed = true, revealProgress = 1.0, active = false }) {
  const groupRef = useRef(null);
  const floatSeed = useMemo(() => Math.random() * Math.PI * 2, []);
  const reducedRef = useRef(false);
  const Icon = ICONS[card.icon] || Code2;

  useEffect(() => {
    const sync = (state) => { reducedRef.current = state.reducedMotion; };
    sync(useSceneStore.getState());
    return useSceneStore.subscribe(sync);
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    if (!reducedRef.current) {
      const t = state.clock.elapsedTime;
      groupRef.current.position.y = card.position[1] + Math.sin(t * 0.35 + floatSeed) * 0.05;
    }
  });

  const scale = revealed ? 0.85 + 0.15 * revealProgress : 0.85;
  const opacity = revealed ? revealProgress : 0;

  return (
    <group
      ref={groupRef}
      position={card.position}
      rotation={[CARD_TILT_X, 0, 0]}
      scale={revealed ? scale : 0}
      visible={revealed && revealProgress > 0}
    >
      {/* Stack of sheets: two duplicate layers peeking out below-right of the
          main body, as in the reference. Each is progressively darker so the
          stack reads as depth rather than a blurry double-image. */}
      <RoundedBox args={[1.68, 0.62, 0.07]} radius={0.08} smoothness={4} position={[0.13, -0.16, -0.09]}>
        <meshStandardMaterial color="#020a1f" metalness={0.2} roughness={0.65} transparent opacity={0.95 * opacity} />
      </RoundedBox>
      <RoundedBox args={[1.68, 0.62, 0.08]} radius={0.08} smoothness={4} position={[0.065, -0.08, -0.045]}>
        <meshStandardMaterial color="#041a53" metalness={0.2} roughness={0.6} transparent opacity={0.96 * opacity} />
      </RoundedBox>

      {/* Main card body — solid deep-navy interface module, not frosted glass */}
      <RoundedBox args={[1.68, 0.62, 0.09]} radius={0.08} smoothness={4}>
        <meshStandardMaterial color="#061233" metalness={0.15} roughness={0.5} transparent opacity={0.98 * opacity} />
      </RoundedBox>

      <Html center position={[0, 0, 0.055]} transform distanceFactor={4.0} style={{ pointerEvents: 'none' }}>
        <div className="relative w-[172px] h-[68px] select-none" style={{ opacity, transition: 'opacity 0.25s ease-out' }}>
          {/* Offset accent frame — sits outside the card body and shifted
              down-left, the way the reference draws it, rather than hugging
              the card edge like an ordinary border. */}
          <div
            className="absolute rounded-xl pointer-events-none"
            style={{
              inset: '-9px 7px 9px -11px',
              border: `1.5px solid ${active ? 'rgba(0,89,255,0.95)' : 'rgba(77,140,255,0.5)'}`,
              boxShadow: active ? '0 0 18px rgba(0,89,255,0.45)' : '0 0 10px rgba(0,89,255,0.15)',
            }}
          />
          <div className="relative h-full flex items-center gap-2.5 px-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-md bg-lp-500/15 border border-lp-500/35 shrink-0">
              <Icon className="w-4 h-4 text-lp-400" strokeWidth={2.2} />
            </span>
            <span className="text-[13px] font-extrabold tracking-tight text-white leading-tight">{card.label}</span>
          </div>
        </div>
      </Html>
    </group>
  );
}
