import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CatmullRomCurve3, MeshStandardMaterial, TubeGeometry, Vector3 } from 'three';
import { useSceneStore } from '../store/useSceneStore';

/**
 * A physical pathway from the central node to a card or icon tile: a thick
 * corrugated hose routed as a manufactured elbow (rise out of the hub, run
 * horizontally, drop onto the target).
 *
 * Three things are deliberate here:
 *  - The corrugation is displaced into the tube's own vertices rather than
 *    built from a stack of torus rings. The ring approach cost ~48 extra
 *    meshes per conduit (~860 across the scene), each re-oriented every
 *    frame; this is one mesh with real ribbed geometry.
 *  - Energy is a lit band that travels through the tube surface itself,
 *    driven by a small injection into the standard material's emissive.
 *    Previously it was a handful of sphere "dots" sliding along the path,
 *    which never read as the conduit carrying charge.
 *  - The scroll reveal is a shader-side discard on the length coordinate, so
 *    the geometry is built once instead of being rebuilt every frame while
 *    the section is scrolling.
 */
export function Tube3D({
  start,
  end,
  lift = 1.0,
  speed = 0.22,
  offset = 0,
  revealed = true,
  revealProgress = 1.0,
  active = false,
  radius = 0.045,
}) {
  const shaderRef = useRef(null);
  const reducedRef = useRef(false);
  const activeRef = useRef(active);
  const revealRef = useRef(revealProgress);
  activeRef.current = active;
  revealRef.current = revealProgress;

  useEffect(() => {
    const sync = (state) => { reducedRef.current = state.reducedMotion; };
    sync(useSceneStore.getState());
    return useSceneStore.subscribe(sync);
  }, []);

  const curve = useMemo(() => {
    const s = new Vector3(...start);
    const e = new Vector3(...end);
    // Manufactured elbow routing: rise straight up out of the hub, run
    // horizontally at a fixed plateau height, then drop straight down onto
    // the target. The low catmull-rom tension keeps the two corners rounded
    // rather than sharp, so it reads as a bent physical conduit.
    const plateauY = Math.max(s.y, e.y) + lift * 0.55;
    const riseTop = s.clone();
    riseTop.y = plateauY;
    const overTarget = e.clone();
    overTarget.y = plateauY;
    return new CatmullRomCurve3([s, riseTop, overTarget, e], false, 'catmullrom', 0.35);
  }, [start, end, lift]);

  // Ribbed hose: build a smooth tube, then push every vertex out along its
  // own normal on a sine wave running down the length. One rib roughly every
  // 2.2 tube-radii reads as corrugation without turning into noise.
  const geometry = useMemo(() => {
    const length = curve.getLength();
    // Rib pitch must stay well under the tube diameter. At a pitch of ~2.2
    // radii (roughly one full diameter) the bumps merged into a string of
    // beads instead of a ribbed hose, so the pitch is ~0.65 of a diameter
    // and the amplitude is halved to keep them as surface ridges.
    const ribs = Math.max(10, Math.round(length / (radius * 1.3)));
    const geo = new TubeGeometry(curve, Math.max(160, ribs * 6), radius, 14, false);
    const pos = geo.attributes.position;
    const nor = geo.attributes.normal;
    const uv = geo.attributes.uv;
    const amp = radius * 0.11;
    for (let i = 0; i < pos.count; i++) {
      const bump = Math.sin(uv.getX(i) * ribs * Math.PI * 2) * amp;
      pos.setXYZ(
        i,
        pos.getX(i) + nor.getX(i) * bump,
        pos.getY(i) + nor.getY(i) * bump,
        pos.getZ(i) + nor.getZ(i) * bump
      );
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, [curve, radius]);

  const material = useMemo(() => {
    const m = new MeshStandardMaterial({
      color: '#0a2a6e',
      emissive: '#0059ff',
      emissiveIntensity: 0.05,
      metalness: 0.15,
      roughness: 0.45,
    });
    // Force the uv varying through; the standard material only declares it
    // when a texture map is bound, and there is none here.
    m.defines = { USE_UV: '' };
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.uniforms.uSpeed = { value: speed };
      shader.uniforms.uOffset = { value: offset };
      shader.uniforms.uActive = { value: 0 };
      shader.uniforms.uReveal = { value: 1 };
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
           uniform float uTime;
           uniform float uSpeed;
           uniform float uOffset;
           uniform float uActive;
           uniform float uReveal;`
        )
        // Scroll reveal: nothing past the drawn length is shaded at all.
        .replace(
          '#include <clipping_planes_fragment>',
          `#include <clipping_planes_fragment>
           if (vUv.x > uReveal) discard;`
        )
        // Travelling charge: brightest at the head, trailing off behind it,
        // so a long run of the hose is lit at once like the reference.
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
           {
             float head = fract(uTime * uSpeed + uOffset);
             float d = head - vUv.x;
             d = d - floor(d);
             float trail = exp(-d * 3.0);
             totalEmissiveRadiance += emissive * trail * uActive * 5.0;
           }`
        );
      shaderRef.current = shader;
    };
    return m;
  }, [speed, offset]);

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useFrame((state) => {
    const s = shaderRef.current;
    if (!s) return;
    s.uniforms.uReveal.value = revealRef.current;
    // Idle conduits keep a faint charge so the network never looks dead.
    const target = activeRef.current ? 1 : 0.12;
    s.uniforms.uActive.value += (target - s.uniforms.uActive.value) * 0.08;
    if (!reducedRef.current) s.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh
      geometry={geometry}
      material={material}
      visible={revealed && revealProgress > 0}
    />
  );
}
