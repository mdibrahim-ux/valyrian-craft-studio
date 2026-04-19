import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, RoundedBox, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import type { CustomConfig } from '@/contexts/CartContext';
import type { Category } from '@/data/products';

// ─── Wood grain texture generation ───────────────────────────────────
const WOOD_PALETTES: Record<string, { base: string; dark: string; light: string; grain: string }> = {
  teak:     { base: '#B8860B', dark: '#8B6914', light: '#D4A832', grain: '#9A7209' },
  sheesham: { base: '#8B4513', dark: '#5C2D0E', light: '#A0522D', grain: '#6B3410' },
  oak:      { base: '#C4A35A', dark: '#A68B42', light: '#DBBF72', grain: '#B49448' },
  walnut:   { base: '#5C4033', dark: '#3E2A22', light: '#7A5B4D', grain: '#4A342A' },
  pine:     { base: '#DEB887', dark: '#C8A06E', light: '#F0D4A8', grain: '#CAAA76' },
  mahogany: { base: '#C04000', dark: '#8B2500', light: '#D45A20', grain: '#9B3200' },
};

function createWoodTexture(woodType: string, size = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const palette = WOOD_PALETTES[woodType] || WOOD_PALETTES.oak;

  // Base fill
  ctx.fillStyle = palette.base;
  ctx.fillRect(0, 0, size, size);

  // Draw grain lines with variation
  const grainCount = 60 + Math.floor(Math.random() * 40);
  for (let i = 0; i < grainCount; i++) {
    const y = (i / grainCount) * size;
    const thickness = 0.5 + Math.random() * 2.5;
    const alpha = 0.08 + Math.random() * 0.18;
    ctx.strokeStyle = Math.random() > 0.5 ? palette.dark : palette.grain;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(0, y);
    // Wavy grain line
    for (let x = 0; x < size; x += 8) {
      const wave = Math.sin(x * 0.015 + i * 0.7) * (3 + Math.random() * 4)
                 + Math.sin(x * 0.005 + i * 0.3) * (2 + Math.random() * 3);
      ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Knots (subtle)
  const knotCount = 1 + Math.floor(Math.random() * 3);
  for (let k = 0; k < knotCount; k++) {
    const kx = 80 + Math.random() * (size - 160);
    const ky = 80 + Math.random() * (size - 160);
    const kr = 8 + Math.random() * 18;
    const grad = ctx.createRadialGradient(kx, ky, 0, kx, ky, kr);
    grad.addColorStop(0, palette.dark);
    grad.addColorStop(0.6, palette.grain);
    grad.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(kx, ky, kr, kr * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
    // Ring lines around knot
    for (let r = 0; r < 5; r++) {
      ctx.globalAlpha = 0.06;
      ctx.strokeStyle = palette.dark;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.ellipse(kx, ky, kr + r * 6, (kr + r * 6) * 0.7, Math.random() * 0.3, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  // Subtle noise for texture
  const imgData = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 12;
    imgData.data[i] += noise;
    imgData.data[i + 1] += noise;
    imgData.data[i + 2] += noise;
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  return tex;
}

function createNormalMap(size = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Neutral normal (128,128,255)
  ctx.fillStyle = '#8080FF';
  ctx.fillRect(0, 0, size, size);

  // Grain bumps
  for (let i = 0; i < 80; i++) {
    const y = (i / 80) * size;
    ctx.globalAlpha = 0.04 + Math.random() * 0.06;
    ctx.strokeStyle = `rgb(${128 + (Math.random() - 0.5) * 30}, ${128 + Math.random() * 15}, 255)`;
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < size; x += 6) {
      const wave = Math.sin(x * 0.02 + i * 0.5) * 2;
      ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createRoughnessMap(finish: string, size = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const baseVal = finish === 'glossy' ? 40 : finish === 'polished' ? 30 : finish === 'laminated' ? 100 : finish === 'natural' ? 170 : 200;
  ctx.fillStyle = `rgb(${baseVal},${baseVal},${baseVal})`;
  ctx.fillRect(0, 0, size, size);

  // Variation along grain
  const imgData = ctx.getImageData(0, 0, size, size);
  for (let y = 0; y < size; y++) {
    const lineVar = Math.sin(y * 0.1) * 8;
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const noise = (Math.random() - 0.5) * 15 + lineVar;
      const v = Math.max(0, Math.min(255, baseVal + noise));
      imgData.data[idx] = imgData.data[idx + 1] = imgData.data[idx + 2] = v;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ─── Shared hook for wood material ───────────────────────────────────
function useWoodMaterial(woodType: string, finish: string, material: string) {
  return useMemo(() => {
    const colorTex = createWoodTexture(woodType);
    const normalTex = createNormalMap();
    const roughTex = createRoughnessMap(finish);
    const palette = WOOD_PALETTES[woodType] || WOOD_PALETTES.oak;

    const FINISH_PROPS: Record<string, { roughness: number; metalness: number }> = {
      matte: { roughness: 0.85, metalness: 0.0 },
      glossy: { roughness: 0.12, metalness: 0.08 },
      natural: { roughness: 0.65, metalness: 0.0 },
      laminated: { roughness: 0.35, metalness: 0.04 },
      polished: { roughness: 0.08, metalness: 0.12 },
    };

    const MATERIAL_ADJUST: Record<string, { metalness: number; opacity: number; useTexture: boolean }> = {
      'solid-wood': { metalness: 0, opacity: 1, useTexture: true },
      'engineered': { metalness: 0, opacity: 1, useTexture: true },
      'metal': { metalness: 0.85, opacity: 1, useTexture: false },
      'glass': { metalness: 0.1, opacity: 0.35, useTexture: false },
      'upholstery': { metalness: 0, opacity: 1, useTexture: false },
    };

    const fp = FINISH_PROPS[finish] || FINISH_PROPS.matte;
    const ma = MATERIAL_ADJUST[material] || MATERIAL_ADJUST['solid-wood'];

    const props: Record<string, any> = {
      roughness: fp.roughness,
      metalness: Math.max(fp.metalness, ma.metalness),
      transparent: ma.opacity < 1,
      opacity: ma.opacity,
      envMapIntensity: finish === 'glossy' || finish === 'polished' ? 1.2 : 0.5,
    };

    if (ma.useTexture) {
      props.map = colorTex;
      props.normalMap = normalTex;
      props.normalScale = new THREE.Vector2(0.3, 0.3);
      props.roughnessMap = roughTex;
    } else if (material === 'metal') {
      props.color = '#888888';
    } else if (material === 'glass') {
      props.color = '#AADDEE';
    } else {
      props.color = palette.base;
    }

    return props;
  }, [woodType, finish, material]);
}

// ─── Upholstery material ────────────────────────────────────────────
const UPHOLSTERY_COLORS: Record<string, string> = {
  modern: '#404040',
  rustic: '#8B7355',
  industrial: '#555555',
  scandinavian: '#E8DFD0',
  vintage: '#9B7653',
  luxury: '#2C1810',
};

function useFabricMaterial(style: string) {
  return useMemo(() => {
    const color = UPHOLSTERY_COLORS[style] || '#E8D5B7';
    return { color, roughness: 0.95, metalness: 0 };
  }, [style]);
}

// ─── Joinery helpers ─────────────────────────────────────────────────
function DowelJoint({ position, rotation }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <mesh position={position} rotation={rotation}>
      <cylinderGeometry args={[0.008, 0.008, 0.03, 8]} />
      <meshStandardMaterial color="#A08050" roughness={0.6} metalness={0} />
    </mesh>
  );
}

function BrassAccent({ position, size }: { position: [number, number, number]; size: [number, number, number] }) {
  return (
    <RoundedBox args={size} radius={0.003} position={position}>
      <meshStandardMaterial color="#B8860B" metalness={0.9} roughness={0.15} envMapIntensity={1.5} />
    </RoundedBox>
  );
}

// ─── CHAIR ───────────────────────────────────────────────────────────
function ChairModel({ config }: { config: CustomConfig }) {
  const w = config.width / 100;
  const h = config.height / 100;
  const d = config.depth / 100;
  const woodMat = useWoodMaterial(config.woodType, config.finish, config.material);
  const fabricMat = useFabricMaterial(config.style);

  const legH = h * 0.45;
  const seatT = 0.055;
  const backH = h * 0.5;
  const hasArmrest = config.components.includes('armrest');
  const hasCushion = config.components.includes('cushion');
  const hasHeadrest = config.components.includes('headrest');
  const hasLumbar = config.components.includes('lumbar');

  return (
    <group position={[0, -h / 2, 0]}>
      {/* Tapered legs with foot caps */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
        <group key={i} position={[x * (w / 2 - 0.04), 0, z * (d / 2 - 0.04)]}>
          {/* Leg (tapered, higher segment count) */}
          <mesh position={[0, legH / 2, 0]}>
            <cylinderGeometry args={[0.02, 0.032, legH, 16]} />
            <meshStandardMaterial {...woodMat} />
          </mesh>
          {/* Brass foot cap */}
          <mesh position={[0, 0.005, 0]}>
            <cylinderGeometry args={[0.034, 0.036, 0.01, 16]} />
            <meshStandardMaterial color="#B8860B" metalness={0.9} roughness={0.15} />
          </mesh>
          {/* Dowel joint at top */}
          <DowelJoint position={[0, legH - 0.01, 0]} />
        </group>
      ))}

      {/* Cross stretchers between legs */}
      {[
        { from: [-w / 2 + 0.04, legH * 0.2, -d / 2 + 0.04], to: [w / 2 - 0.04, legH * 0.2, -d / 2 + 0.04] },
        { from: [-w / 2 + 0.04, legH * 0.2, d / 2 - 0.04], to: [w / 2 - 0.04, legH * 0.2, d / 2 - 0.04] },
      ].map((s, i) => {
        const len = Math.abs(s.to[0] - s.from[0]);
        return (
          <mesh key={i} position={[0, s.from[1], s.from[2]]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.012, 0.012, len, 12]} />
            <meshStandardMaterial {...woodMat} />
          </mesh>
        );
      })}

      {/* Seat (bevelled edges via RoundedBox) */}
      <RoundedBox args={[w, seatT, d]} radius={0.018} smoothness={4} position={[0, legH + seatT / 2, 0]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>

      {/* Seat edge detail */}
      <mesh position={[0, legH + seatT, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[Math.min(w, d) / 2 - 0.02, Math.min(w, d) / 2, 32]} />
        <meshStandardMaterial {...woodMat} side={THREE.DoubleSide} />
      </mesh>

      {/* Cushion */}
      {hasCushion && (
        <RoundedBox args={[w * 0.88, 0.06, d * 0.88]} radius={0.025} smoothness={4} position={[0, legH + seatT + 0.03, 0]}>
          <meshStandardMaterial {...fabricMat} />
        </RoundedBox>
      )}

      {/* Backrest with subtle curve */}
      <group position={[0, legH + seatT, -d / 2 + 0.025]}>
        {/* Main backrest panel */}
        <RoundedBox args={[w * 0.95, backH, 0.04]} radius={0.015} smoothness={4} position={[0, backH / 2, 0]}>
          <meshStandardMaterial {...woodMat} />
        </RoundedBox>
        {/* Backrest splat (vertical center detail) */}
        <RoundedBox args={[w * 0.15, backH * 0.7, 0.025]} radius={0.01} smoothness={4} position={[0, backH * 0.45, 0.02]}>
          <meshStandardMaterial {...woodMat} />
        </RoundedBox>
        {/* Dowels at backrest connection */}
        <DowelJoint position={[-w * 0.35, 0.01, 0.02]} />
        <DowelJoint position={[w * 0.35, 0.01, 0.02]} />
      </group>

      {/* Lumbar support */}
      {hasLumbar && (
        <RoundedBox args={[w * 0.6, 0.1, 0.035]} radius={0.02} smoothness={4}
          position={[0, legH + seatT + backH * 0.3, -d / 2 + 0.06]}>
          <meshStandardMaterial {...fabricMat} />
        </RoundedBox>
      )}

      {/* Headrest */}
      {hasHeadrest && (
        <group position={[0, legH + seatT + backH + 0.02, -d / 2 + 0.03]}>
          <RoundedBox args={[w * 0.55, 0.1, 0.05]} radius={0.025} smoothness={4} position={[0, 0.05, 0]}>
            <meshStandardMaterial {...fabricMat} />
          </RoundedBox>
          {/* Headrest bracket */}
          {[-1, 1].map(s => (
            <mesh key={s} position={[s * w * 0.2, -0.01, 0]}>
              <cylinderGeometry args={[0.006, 0.006, 0.04, 8]} />
              <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
            </mesh>
          ))}
        </group>
      )}

      {/* Armrests */}
      {hasArmrest && [-1, 1].map(side => (
        <group key={side}>
          {/* Arm support (curved profile) */}
          <mesh position={[side * (w / 2 - 0.015), legH + seatT + backH * 0.18, d * 0.15]}>
            <cylinderGeometry args={[0.016, 0.018, backH * 0.38, 12]} />
            <meshStandardMaterial {...woodMat} />
          </mesh>
          {/* Arm top pad */}
          <RoundedBox
            args={[0.045, 0.03, d * 0.65]}
            radius={0.012}
            smoothness={4}
            position={[side * (w / 2 - 0.015), legH + seatT + backH * 0.38, 0.02]}
          >
            <meshStandardMaterial {...woodMat} />
          </RoundedBox>
          {/* Brass detail on armrest end */}
          <BrassAccent position={[side * (w / 2 - 0.015), legH + seatT + backH * 0.38, d * 0.33]} size={[0.048, 0.008, 0.015]} />
        </group>
      ))}
    </group>
  );
}

// ─── TABLE ───────────────────────────────────────────────────────────
function TableModel({ config }: { config: CustomConfig }) {
  const w = config.width / 100;
  const h = config.height / 100;
  const d = config.depth / 100;
  const woodMat = useWoodMaterial(config.woodType, config.finish, config.material);

  const topT = 0.045;
  const legH = h - topT;
  const hasDrawers = config.components.includes('drawers');
  const hasGlassTop = config.components.includes('glass-top');
  const hasExtension = config.components.includes('extension');

  return (
    <group position={[0, -h / 2, 0]}>
      {/* Legs — tapered with chamfered edges */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
        <group key={i} position={[x * (w / 2 - 0.055), 0, z * (d / 2 - 0.055)]}>
          <RoundedBox args={[0.055, legH, 0.055]} radius={0.008} smoothness={4} position={[0, legH / 2, 0]}>
            <meshStandardMaterial {...woodMat} />
          </RoundedBox>
          {/* Foot detail */}
          <BrassAccent position={[0, 0.005, 0]} size={[0.06, 0.01, 0.06]} />
          {/* Top joint */}
          <DowelJoint position={[0, legH, 0]} />
        </group>
      ))}

      {/* Apron rails */}
      {[
        { pos: [0, legH - 0.04, -d / 2 + 0.055] as [number, number, number], size: [w - 0.12, 0.06, 0.02] as [number, number, number] },
        { pos: [0, legH - 0.04, d / 2 - 0.055] as [number, number, number], size: [w - 0.12, 0.06, 0.02] as [number, number, number] },
        { pos: [-w / 2 + 0.055, legH - 0.04, 0] as [number, number, number], size: [0.02, 0.06, d - 0.12] as [number, number, number] },
        { pos: [w / 2 - 0.055, legH - 0.04, 0] as [number, number, number], size: [0.02, 0.06, d - 0.12] as [number, number, number] },
      ].map((rail, i) => (
        <RoundedBox key={i} args={rail.size} radius={0.005} smoothness={3} position={rail.pos}>
          <meshStandardMaterial {...woodMat} />
        </RoundedBox>
      ))}

      {/* Table top with edge profile */}
      <RoundedBox args={[w, topT, d]} radius={0.012} smoothness={4} position={[0, legH + topT / 2, 0]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>
      {/* Chamfer underside edge */}
      <RoundedBox args={[w - 0.01, 0.008, d - 0.01]} radius={0.004} position={[0, legH - 0.004, 0]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>

      {/* Glass top */}
      {hasGlassTop && (
        <RoundedBox args={[w * 0.92, 0.012, d * 0.92]} radius={0.008} smoothness={4} position={[0, legH + topT + 0.008, 0]}>
          <meshPhysicalMaterial
            color="#AADDEE"
            roughness={0.02}
            metalness={0.05}
            transparent
            opacity={0.25}
            transmission={0.9}
            thickness={0.5}
            ior={1.5}
          />
        </RoundedBox>
      )}

      {/* Drawers */}
      {hasDrawers && [-1, 1].map(side => (
        <group key={side} position={[side * (w * 0.22), legH - 0.12, d / 2 - 0.05]}>
          <RoundedBox args={[w * 0.35, 0.08, 0.08]} radius={0.008} smoothness={3}>
            <meshStandardMaterial {...woodMat} />
          </RoundedBox>
          {/* Drawer handle */}
          <mesh position={[0, 0, 0.045]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.018, 0.004, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#B8860B" metalness={0.9} roughness={0.12} />
          </mesh>
          {/* Drawer face line */}
          <mesh position={[0, 0, 0.041]}>
            <planeGeometry args={[w * 0.33, 0.001]} />
            <meshBasicMaterial color="#000" transparent opacity={0.15} />
          </mesh>
        </group>
      ))}

      {/* Extension leaf */}
      {hasExtension && (
        <group position={[w / 2 + 0.15, legH + topT / 2, 0]}>
          <RoundedBox args={[0.3, topT, d * 0.9]} radius={0.01} smoothness={4}>
            <meshStandardMaterial {...woodMat} />
          </RoundedBox>
          {/* Hinge detail */}
          {[-1, 1].map(s => (
            <mesh key={s} position={[-0.15, 0, s * (d * 0.3)]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.006, 0.006, topT + 0.01, 8]} />
              <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

// ─── BED ─────────────────────────────────────────────────────────────
function BedModel({ config }: { config: CustomConfig }) {
  const w = config.width / 100;
  const h = config.height / 100;
  const d = config.depth / 100;
  const woodMat = useWoodMaterial(config.woodType, config.finish, config.material);
  const fabricMat = useFabricMaterial(config.style);

  const frameH = h * 0.28;
  const headH = h * 0.72;
  const hasLed = config.components.includes('led');
  const hasStorage = config.components.includes('storage');
  const hasSlats = config.components.includes('slats');

  return (
    <group position={[0, -h * 0.25, 0]}>
      {/* Frame — with rounded profile */}
      <group>
        {/* Side rails */}
        {[-1, 1].map(s => (
          <RoundedBox key={s} args={[0.06, frameH, d]} radius={0.01} smoothness={4}
            position={[s * (w / 2 - 0.03), frameH / 2, 0]}>
            <meshStandardMaterial {...woodMat} />
          </RoundedBox>
        ))}
        {/* Foot rail */}
        <RoundedBox args={[w - 0.12, frameH * 0.7, 0.06]} radius={0.01} smoothness={4}
          position={[0, frameH * 0.35, d / 2 - 0.03]}>
          <meshStandardMaterial {...woodMat} />
        </RoundedBox>
        {/* Corner posts */}
        {[[-1, 1], [1, 1]].map(([x, z], i) => (
          <RoundedBox key={i} args={[0.065, frameH + 0.02, 0.065]} radius={0.01} smoothness={4}
            position={[x * (w / 2 - 0.03), frameH / 2 + 0.01, z * (d / 2 - 0.03)]}>
            <meshStandardMaterial {...woodMat} />
          </RoundedBox>
        ))}
      </group>

      {/* Slats */}
      {hasSlats && Array.from({ length: 10 }).map((_, i) => (
        <RoundedBox key={i} args={[w - 0.14, 0.015, 0.06]} radius={0.005} smoothness={3}
          position={[0, frameH - 0.02, -d / 2 + 0.1 + (i / 9) * (d - 0.2)]}>
          <meshStandardMaterial {...woodMat} />
        </RoundedBox>
      ))}

      {/* Under-bed storage */}
      {hasStorage && (
        <group position={[0, 0.06, d * 0.15]}>
          <RoundedBox args={[w * 0.85, 0.1, d * 0.55]} radius={0.008} smoothness={3}>
            <meshStandardMaterial {...woodMat} />
          </RoundedBox>
          <mesh position={[0, 0, d * 0.28]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.02, 0.005, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#B8860B" metalness={0.9} roughness={0.12} />
          </mesh>
        </group>
      )}

      {/* Mattress */}
      <RoundedBox args={[w * 0.93, 0.18, d * 0.9]} radius={0.05} smoothness={6}
        position={[0, frameH + 0.09, 0.02]}>
        <meshStandardMaterial color="#F8F4ED" roughness={0.98} />
      </RoundedBox>
      {/* Mattress piping edge */}
      <mesh position={[0, frameH + 0.18, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[Math.min(w * 0.93, d * 0.9) / 2 - 0.02, Math.min(w * 0.93, d * 0.9) / 2, 48]} />
        <meshStandardMaterial color="#EDE8DF" roughness={0.95} side={THREE.DoubleSide} />
      </mesh>

      {/* Headboard — panelled design */}
      <group position={[0, 0, -d / 2 + 0.04]}>
        {/* Main panel */}
        <RoundedBox args={[w, headH, 0.06]} radius={0.02} smoothness={4}
          position={[0, frameH / 2 + headH / 2, 0]}>
          <meshStandardMaterial {...woodMat} />
        </RoundedBox>
        {/* Inset panels */}
        {[-1, 0, 1].map(p => (
          <RoundedBox key={p} args={[w * 0.27, headH * 0.65, 0.015]} radius={0.01} smoothness={4}
            position={[p * w * 0.3, frameH / 2 + headH * 0.55, 0.038]}>
            <meshStandardMaterial {...woodMat} />
          </RoundedBox>
        ))}
        {/* Crown moulding */}
        <RoundedBox args={[w + 0.02, 0.04, 0.08]} radius={0.01} smoothness={4}
          position={[0, frameH / 2 + headH + 0.02, 0]}>
          <meshStandardMaterial {...woodMat} />
        </RoundedBox>
      </group>

      {/* Pillows — more realistic */}
      {[-0.25, 0.25].map((x, i) => (
        <group key={i} position={[x * w, frameH + 0.23, -d * 0.28]}>
          <RoundedBox args={[w * 0.28, 0.1, 0.22]} radius={0.04} smoothness={6}>
            <meshStandardMaterial color="#FFFFFF" roughness={0.96} />
          </RoundedBox>
        </group>
      ))}

      {/* LED ambient strip */}
      {hasLed && (
        <>
          {[-1, 1].map(s => (
            <mesh key={s} position={[s * (w / 2 - 0.01), 0.015, 0]}>
              <boxGeometry args={[0.015, 0.015, d * 0.95]} />
              <meshStandardMaterial color="#C8A45C" emissive="#C8A45C" emissiveIntensity={1.2} transparent opacity={0.5} />
            </mesh>
          ))}
          <pointLight position={[0, 0.05, 0]} intensity={0.3} color="#C8A45C" distance={1.5} />
        </>
      )}
    </group>
  );
}

// ─── STORAGE ─────────────────────────────────────────────────────────
function StorageModel({ config }: { config: CustomConfig }) {
  const w = config.width / 100;
  const h = config.height / 100;
  const d = config.depth / 100;
  const woodMat = useWoodMaterial(config.woodType, config.finish, config.material);

  const hasHandles = config.components.includes('handles');
  const hasMirror = config.components.includes('mirror');
  const hasLighting = config.components.includes('lighting');
  const panelT = 0.022;

  return (
    <group position={[0, -h / 2, 0]}>
      {/* Back panel */}
      <RoundedBox args={[w - panelT * 2, h - panelT, panelT * 0.6]} radius={0.003} smoothness={3}
        position={[0, h / 2 + panelT / 2, -d / 2 + panelT * 0.3]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>

      {/* Side panels with edge banding */}
      {[-1, 1].map(s => (
        <group key={s}>
          <RoundedBox args={[panelT, h, d]} radius={0.006} smoothness={4}
            position={[s * (w / 2 - panelT / 2), h / 2, 0]}>
            <meshStandardMaterial {...woodMat} />
          </RoundedBox>
        </group>
      ))}

      {/* Top panel with crown */}
      <RoundedBox args={[w, panelT, d]} radius={0.006} smoothness={4}
        position={[0, h - panelT / 2, 0]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>
      {/* Crown moulding */}
      <RoundedBox args={[w + 0.02, 0.015, d + 0.01]} radius={0.005} smoothness={4}
        position={[0, h + 0.005, 0]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>

      {/* Bottom with kick plate */}
      <RoundedBox args={[w, panelT, d]} radius={0.006} smoothness={4}
        position={[0, panelT / 2, 0]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>
      {/* Kick plate recess */}
      <RoundedBox args={[w - 0.08, 0.05, 0.03]} radius={0.005} smoothness={3}
        position={[0, 0.025, d / 2 - 0.015]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>

      {/* Shelves with dowel joints */}
      {[0.25, 0.5, 0.75].map(frac => (
        <group key={frac}>
          <RoundedBox args={[w - panelT * 2 - 0.01, 0.018, d - 0.02]} radius={0.004} smoothness={3}
            position={[0, h * frac, 0]}>
            <meshStandardMaterial {...woodMat} />
          </RoundedBox>
          {/* Shelf pin details */}
          {[-1, 1].map(s => (
            <mesh key={s} position={[s * (w / 2 - panelT - 0.01), h * frac - 0.012, d * 0.2]}>
              <cylinderGeometry args={[0.004, 0.004, 0.01, 6]} />
              <meshStandardMaterial color="#B8860B" metalness={0.8} roughness={0.2} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Doors with panel insets */}
      {[-1, 1].map(side => (
        <group key={side} position={[side * (w / 4), h / 2, d / 2 - 0.005]}>
          {/* Door panel */}
          <RoundedBox args={[w / 2 - panelT - 0.01, h - panelT * 2 - 0.02, panelT]} radius={0.006} smoothness={4}>
            <meshStandardMaterial {...woodMat} />
          </RoundedBox>
          {/* Raised center panel */}
          <RoundedBox args={[w / 2 - panelT - 0.08, h * 0.65, 0.008]} radius={0.008} smoothness={4}
            position={[0, 0, panelT / 2 + 0.004]}>
            <meshStandardMaterial {...woodMat} />
          </RoundedBox>
          {/* Frame moulding lines */}
          {[[-1, 0], [1, 0], [0, -1], [0, 1]].map(([dx, dy], i) => {
            const isHoriz = dy === 0;
            const len = isHoriz ? w / 2 - panelT - 0.06 : h * 0.7;
            return (
              <mesh key={i}
                position={[dx * (w / 4 - panelT / 2 - 0.02), dy * (h * 0.35 - 0.02), panelT / 2 + 0.002]}
                rotation={isHoriz ? [0, 0, 0] : [0, 0, Math.PI / 2]}>
                <boxGeometry args={[len, 0.004, 0.003]} />
                <meshStandardMaterial color="#000" transparent opacity={0.08} />
              </mesh>
            );
          })}
        </group>
      ))}

      {/* Handles */}
      {hasHandles && [-1, 1].map(side => (
        <group key={`h${side}`} position={[side * 0.04, h / 2, d / 2 + 0.01]}>
          {/* Elegant curved handle */}
          <mesh rotation={[0, 0, 0]}>
            <torusGeometry args={[0.025, 0.005, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#B8860B" metalness={0.92} roughness={0.1} envMapIntensity={1.5} />
          </mesh>
          {/* Mount points */}
          {[-1, 1].map(m => (
            <mesh key={m} position={[m * 0.025, 0, -0.005]}>
              <cylinderGeometry args={[0.007, 0.007, 0.012, 8]} />
              <meshStandardMaterial color="#B8860B" metalness={0.9} roughness={0.12} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Mirror */}
      {hasMirror && (
        <group position={[0, h / 2, d / 2 + 0.015]}>
          <mesh>
            <planeGeometry args={[w * 0.38, h * 0.65]} />
            <meshPhysicalMaterial color="#E8E8EE" metalness={0.98} roughness={0.02} envMapIntensity={2} />
          </mesh>
          {/* Mirror frame */}
          <mesh position={[0, 0, -0.002]}>
            <boxGeometry args={[w * 0.4, h * 0.67, 0.008]} />
            <meshStandardMaterial color="#B8860B" metalness={0.85} roughness={0.15} />
          </mesh>
        </group>
      )}

      {/* Interior lighting */}
      {hasLighting && (
        <>
          <mesh position={[0, h - panelT - 0.008, 0]}>
            <boxGeometry args={[w * 0.6, 0.005, 0.005]} />
            <meshStandardMaterial color="#FFF5E0" emissive="#FFF5E0" emissiveIntensity={2} />
          </mesh>
          <pointLight position={[0, h * 0.85, 0]} intensity={0.4} color="#FFF5E0" distance={h * 0.8} />
        </>
      )}
    </group>
  );
}

// ─── OFFICE / GENERIC ────────────────────────────────────────────────
function GenericModel({ config }: { config: CustomConfig }) {
  const w = config.width / 100;
  const h = config.height / 100;
  const d = config.depth / 100;
  const woodMat = useWoodMaterial(config.woodType, config.finish, config.material);
  const fabricMat = useFabricMaterial(config.style);

  const hasCableMgmt = config.components.includes('cable-mgmt');
  const hasMonitorArm = config.components.includes('monitor-arm');

  return (
    <group position={[0, -h / 2, 0]}>
      {/* Legs — A-frame style */}
      {[-1, 1].map(side => (
        <group key={side} position={[side * (w / 2 - 0.06), 0, 0]}>
          <RoundedBox args={[0.05, h * 0.9, d * 0.8]} radius={0.008} smoothness={4}
            position={[0, h * 0.45, 0]}>
            <meshStandardMaterial {...woodMat} />
          </RoundedBox>
          {/* Cross brace */}
          <mesh position={[0, h * 0.15, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.04, 0.02, d * 0.6]} />
            <meshStandardMaterial {...woodMat} />
          </mesh>
          <BrassAccent position={[0, 0.005, -d * 0.35]} size={[0.055, 0.01, 0.03]} />
          <BrassAccent position={[0, 0.005, d * 0.35]} size={[0.055, 0.01, 0.03]} />
        </group>
      ))}

      {/* Desktop surface */}
      <RoundedBox args={[w, 0.04, d]} radius={0.01} smoothness={4}
        position={[0, h * 0.9 + 0.02, 0]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>

      {/* Cable management tray */}
      {hasCableMgmt && (
        <group position={[0, h * 0.82, -d * 0.3]}>
          <mesh>
            <boxGeometry args={[w * 0.5, 0.005, 0.1]} />
            <meshStandardMaterial color="#333" metalness={0.6} roughness={0.3} />
          </mesh>
          {[-1, 1].map(s => (
            <mesh key={s} position={[s * w * 0.25, 0.02, 0]}>
              <boxGeometry args={[0.005, 0.04, 0.1]} />
              <meshStandardMaterial color="#333" metalness={0.6} roughness={0.3} />
            </mesh>
          ))}
        </group>
      )}

      {/* Monitor arm mount */}
      {hasMonitorArm && (
        <group position={[0, h * 0.92, -d * 0.35]}>
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.015, 0.02, 0.3, 12]} />
            <meshStandardMaterial color="#444" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.3, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.12, 8]} />
            <meshStandardMaterial color="#444" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Clamp */}
          <mesh position={[0, -0.01, 0]}>
            <boxGeometry args={[0.05, 0.02, 0.05]} />
            <meshStandardMaterial color="#333" metalness={0.7} roughness={0.25} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ─── SCENE WRAPPER ───────────────────────────────────────────────────
function FurnitureModel({ config, category, subtype }: { config: CustomConfig; category: Category; subtype?: string }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.12;
    }
  });

  const ModelComponent = useMemo(() => {
    // Subtype-specific overrides
    switch (subtype) {
      case 'sofa':
      case 'sectional': return SofaModel;
      case 'recliner': return ReclinerModel;
      case 'bench': return BenchModel;
      case 'stool': return BarStoolModel;
      case 'coffee': return CoffeeTableModel;
      case 'side': return SideTableModel;
      case 'console': return ConsoleTableModel;
      case 'nesting': return NestingTablesModel;
      case 'nightstand': return NightstandModel;
      case 'canopy': return CanopyBedModel;
      case 'bookshelf': return BookshelfModel;
      case 'tv-unit': return TVUnitModel;
      case 'wardrobe': return WardrobeModel;
      case 'wine': return WineCabinetModel;
      case 'dresser': return DresserModel;
      case 'ergonomic': return ErgonomicChairModel;
      case 'standing': return StandingDeskModel;
      case 'filing': return FilingCabinetModel;
      case 'conference': return ConferenceTableModel;
      case 'credenza': return CredenzaModel;
    }
    switch (category) {
      case 'seating': return ChairModel;
      case 'tables': return TableModel;
      case 'beds': return BedModel;
      case 'storage': return StorageModel;
      default: return GenericModel;
    }
  }, [category, subtype]);

  return (
    <group ref={groupRef}>
      <ModelComponent config={config} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SUBTYPE-SPECIFIC MODELS — high-detail variants per furniture kind
// ═══════════════════════════════════════════════════════════════════════

// ─── SOFA / SECTIONAL (long, multi-cushion) ──────────────────────────
function SofaModel({ config }: { config: CustomConfig }) {
  const w = Math.max(config.width / 100, 1.6); // sofa minimum width
  const h = config.height / 100;
  const d = config.depth / 100;
  const woodMat = useWoodMaterial(config.woodType, config.finish, config.material);
  const fabricMat = useFabricMaterial(config.style);
  const seatH = h * 0.38;
  const backH = h * 0.55;
  const hasArmrest = config.components.includes('armrest') || true;
  const hasHeadrest = config.components.includes('headrest');
  const seatCount = w > 2.4 ? 3 : 2;

  return (
    <group position={[0, -h / 2, 0]}>
      {/* Wooden base frame (just visible feet) */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
        <RoundedBox key={i} args={[0.05, 0.06, 0.05]} radius={0.008}
          position={[x * (w / 2 - 0.08), 0.03, z * (d / 2 - 0.08)]}>
          <meshStandardMaterial {...woodMat} />
        </RoundedBox>
      ))}
      {/* Sofa body — main upholstered shell */}
      <RoundedBox args={[w, seatH, d]} radius={0.08} smoothness={6} position={[0, seatH / 2 + 0.06, 0]}>
        <meshStandardMaterial {...fabricMat} />
      </RoundedBox>
      {/* Seat cushions */}
      {Array.from({ length: seatCount }).map((_, i) => {
        const cushW = (w - (hasArmrest ? 0.4 : 0.1)) / seatCount - 0.02;
        const startX = -w / 2 + (hasArmrest ? 0.22 : 0.06) + cushW / 2;
        return (
          <RoundedBox key={i} args={[cushW, 0.12, d * 0.7]} radius={0.05} smoothness={6}
            position={[startX + i * (cushW + 0.02), seatH + 0.08, 0.02]}>
            <meshStandardMaterial {...fabricMat} />
          </RoundedBox>
        );
      })}
      {/* Backrest — multi-pillow */}
      {Array.from({ length: seatCount }).map((_, i) => {
        const cushW = (w - (hasArmrest ? 0.4 : 0.1)) / seatCount - 0.02;
        const startX = -w / 2 + (hasArmrest ? 0.22 : 0.06) + cushW / 2;
        return (
          <RoundedBox key={i} args={[cushW, backH, 0.18]} radius={0.06} smoothness={6}
            position={[startX + i * (cushW + 0.02), seatH + backH / 2 + 0.06, -d / 2 + 0.14]}>
            <meshStandardMaterial {...fabricMat} />
          </RoundedBox>
        );
      })}
      {/* Headrests */}
      {hasHeadrest && Array.from({ length: seatCount }).map((_, i) => {
        const cushW = (w - 0.4) / seatCount - 0.02;
        const startX = -w / 2 + 0.22 + cushW / 2;
        return (
          <RoundedBox key={i} args={[cushW * 0.7, 0.16, 0.14]} radius={0.05} smoothness={6}
            position={[startX + i * (cushW + 0.02), seatH + backH + 0.14, -d / 2 + 0.16]}>
            <meshStandardMaterial {...fabricMat} />
          </RoundedBox>
        );
      })}
      {/* Armrests — chunky upholstered */}
      {hasArmrest && [-1, 1].map(side => (
        <RoundedBox key={side} args={[0.18, seatH + 0.18, d]} radius={0.06} smoothness={6}
          position={[side * (w / 2 - 0.09), (seatH + 0.18) / 2 + 0.06, 0]}>
          <meshStandardMaterial {...fabricMat} />
        </RoundedBox>
      ))}
      {/* Decorative throw pillows */}
      {[-0.3, 0.3].map((x, i) => (
        <RoundedBox key={i} args={[0.22, 0.18, 0.08]} radius={0.04} smoothness={6}
          position={[x * w * 0.7, seatH + 0.25, d * 0.1]}
          rotation={[0.2, i === 0 ? 0.15 : -0.15, i === 0 ? 0.1 : -0.1]}>
          <meshStandardMaterial color="#C8A45C" roughness={0.85} />
        </RoundedBox>
      ))}
    </group>
  );
}

// ─── RECLINER ────────────────────────────────────────────────────────
function ReclinerModel({ config }: { config: CustomConfig }) {
  const w = config.width / 100;
  const h = config.height / 100;
  const d = config.depth / 100;
  const woodMat = useWoodMaterial(config.woodType, config.finish, config.material);
  const fabricMat = useFabricMaterial(config.style);

  return (
    <group position={[0, -h / 2, 0]}>
      {/* Pedestal swivel base */}
      <mesh position={[0, 0.025, 0]}>
        <cylinderGeometry args={[w * 0.35, w * 0.42, 0.05, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.06, 16]} />
        <meshStandardMaterial color="#444" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* Seat with thick padding */}
      <RoundedBox args={[w * 0.85, 0.18, d * 0.85]} radius={0.06} smoothness={6}
        position={[0, h * 0.32, d * 0.05]}>
        <meshStandardMaterial {...fabricMat} />
      </RoundedBox>
      {/* Backrest — tall, segmented (tufted look via dowels) */}
      <RoundedBox args={[w * 0.85, h * 0.55, 0.22]} radius={0.07} smoothness={6}
        position={[0, h * 0.62, -d * 0.32]} rotation={[-0.08, 0, 0]}>
        <meshStandardMaterial {...fabricMat} />
      </RoundedBox>
      {/* Tufting buttons */}
      {[[-1, 1], [1, 1], [-1, 0], [1, 0], [-1, -1], [1, -1]].map(([x, y], i) => (
        <mesh key={i} position={[x * w * 0.18, h * 0.62 + y * 0.12, -d * 0.32 + 0.115]}>
          <sphereGeometry args={[0.012, 12, 12]} />
          <meshStandardMaterial color="#B8860B" metalness={0.85} roughness={0.2} />
        </mesh>
      ))}
      {/* Headrest */}
      <RoundedBox args={[w * 0.7, 0.18, 0.18]} radius={0.07} smoothness={6}
        position={[0, h * 0.95, -d * 0.3]} rotation={[-0.05, 0, 0]}>
        <meshStandardMaterial {...fabricMat} />
      </RoundedBox>
      {/* Armrests — wide padded */}
      {[-1, 1].map(side => (
        <RoundedBox key={side} args={[0.14, 0.16, d * 0.95]} radius={0.05} smoothness={6}
          position={[side * (w / 2 - 0.07), h * 0.45, 0]}>
          <meshStandardMaterial {...fabricMat} />
        </RoundedBox>
      ))}
      {/* Footrest extension */}
      <RoundedBox args={[w * 0.7, 0.1, 0.4]} radius={0.04} smoothness={5}
        position={[0, h * 0.28, d * 0.55]} rotation={[-0.4, 0, 0]}>
        <meshStandardMaterial {...fabricMat} />
      </RoundedBox>
      {/* Side control panel */}
      <RoundedBox args={[0.05, 0.04, 0.12]} radius={0.01}
        position={[w / 2 - 0.04, h * 0.5, d * 0.15]}>
        <meshStandardMaterial color="#222" metalness={0.6} roughness={0.4} />
      </RoundedBox>
    </group>
  );
}

// ─── BENCH ───────────────────────────────────────────────────────────
function BenchModel({ config }: { config: CustomConfig }) {
  const w = Math.max(config.width / 100, 1.0);
  const h = config.height / 100 * 0.5; // benches are low
  const d = config.depth / 100 * 0.55;
  const woodMat = useWoodMaterial(config.woodType, config.finish, config.material);
  const fabricMat = useFabricMaterial(config.style);
  const hasCushion = config.components.includes('cushion');

  return (
    <group position={[0, -h / 2, 0]}>
      {/* Sturdy legs */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
        <group key={i} position={[x * (w / 2 - 0.08), 0, z * (d / 2 - 0.06)]}>
          <RoundedBox args={[0.06, h, 0.06]} radius={0.008} position={[0, h / 2, 0]}>
            <meshStandardMaterial {...woodMat} />
          </RoundedBox>
          <BrassAccent position={[0, 0.005, 0]} size={[0.07, 0.01, 0.07]} />
        </group>
      ))}
      {/* Long stretcher */}
      <mesh position={[0, h * 0.25, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.014, 0.014, w - 0.16, 12]} />
        <meshStandardMaterial {...woodMat} />
      </mesh>
      {/* Seat slab */}
      <RoundedBox args={[w, 0.06, d]} radius={0.015} smoothness={4} position={[0, h + 0.03, 0]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>
      {/* Cushion */}
      {hasCushion && (
        <RoundedBox args={[w * 0.95, 0.08, d * 0.9]} radius={0.03} smoothness={5}
          position={[0, h + 0.1, 0]}>
          <meshStandardMaterial {...fabricMat} />
        </RoundedBox>
      )}
    </group>
  );
}

// ─── BAR STOOL ───────────────────────────────────────────────────────
function BarStoolModel({ config }: { config: CustomConfig }) {
  const w = config.width / 100 * 0.6;
  const h = config.height / 100;
  const woodMat = useWoodMaterial(config.woodType, config.finish, config.material);
  const fabricMat = useFabricMaterial(config.style);
  const hasCushion = config.components.includes('cushion');

  return (
    <group position={[0, -h / 2, 0]}>
      {/* Base disc */}
      <mesh position={[0, 0.015, 0]}>
        <cylinderGeometry args={[w * 0.7, w * 0.8, 0.03, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.85} roughness={0.18} />
      </mesh>
      {/* Central pole */}
      <mesh position={[0, h * 0.45, 0]}>
        <cylinderGeometry args={[0.025, 0.03, h * 0.85, 16]} />
        <meshStandardMaterial color="#888" metalness={0.92} roughness={0.12} envMapIntensity={1.5} />
      </mesh>
      {/* Footrest ring */}
      <mesh position={[0, h * 0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[w * 0.5, 0.012, 12, 32]} />
        <meshStandardMaterial color="#888" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Seat — round, contoured */}
      <mesh position={[0, h * 0.92, 0]}>
        <cylinderGeometry args={[w * 0.7, w * 0.7, 0.06, 32]} />
        <meshStandardMaterial {...woodMat} />
      </mesh>
      {hasCushion && (
        <mesh position={[0, h * 0.97, 0]}>
          <cylinderGeometry args={[w * 0.65, w * 0.7, 0.05, 32]} />
          <meshStandardMaterial {...fabricMat} />
        </mesh>
      )}
      {/* Curved low backrest */}
      <mesh position={[0, h * 1.05, -w * 0.55]} rotation={[0.2, 0, 0]}>
        <torusGeometry args={[w * 0.5, 0.025, 12, 32, Math.PI]} />
        <meshStandardMaterial {...woodMat} />
      </mesh>
    </group>
  );
}

// ─── COFFEE TABLE ────────────────────────────────────────────────────
function CoffeeTableModel({ config }: { config: CustomConfig }) {
  const w = config.width / 100;
  const h = config.height / 100 * 0.45; // low
  const d = config.depth / 100;
  const woodMat = useWoodMaterial(config.woodType, config.finish, config.material);
  const hasGlassTop = config.components.includes('glass-top');

  return (
    <group position={[0, -h / 2, 0]}>
      {/* Sculptural X-frame base */}
      {[[-1, 1], [1, -1]].map(([sx, sz], i) => (
        <mesh key={i} position={[0, h * 0.45, 0]}
          rotation={[0, Math.atan2(sz, sx), 0]}>
          <boxGeometry args={[Math.hypot(w, d) * 0.85, 0.04, 0.04]} />
          <meshStandardMaterial {...woodMat} />
        </mesh>
      ))}
      {/* Bottom cross feet */}
      {[[-1, 0], [1, 0], [0, -1], [0, 1]].map(([x, z], i) => (
        <RoundedBox key={i} args={[0.08, 0.025, 0.08]} radius={0.005}
          position={[x * (w / 2 - 0.06), 0.012, z * (d / 2 - 0.06)]}>
          <meshStandardMaterial {...woodMat} />
        </RoundedBox>
      ))}
      {/* Lower shelf */}
      <RoundedBox args={[w * 0.7, 0.025, d * 0.7]} radius={0.008}
        position={[0, h * 0.25, 0]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>
      {/* Top */}
      <RoundedBox args={[w, 0.04, d]} radius={0.012} smoothness={4}
        position={[0, h - 0.02, 0]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>
      {hasGlassTop && (
        <RoundedBox args={[w * 0.95, 0.012, d * 0.95]} radius={0.008}
          position={[0, h + 0.008, 0]}>
          <meshPhysicalMaterial color="#AADDEE" roughness={0.02} metalness={0.05}
            transparent opacity={0.3} transmission={0.9} thickness={0.5} ior={1.5} />
        </RoundedBox>
      )}
    </group>
  );
}

// ─── SIDE TABLE (round, marble) ──────────────────────────────────────
function SideTableModel({ config }: { config: CustomConfig }) {
  const r = Math.min(config.width, config.depth) / 200;
  const h = config.height / 100;
  const woodMat = useWoodMaterial(config.woodType, config.finish, config.material);

  return (
    <group position={[0, -h / 2, 0]}>
      {/* Tripod brass legs */}
      {[0, 1, 2].map(i => {
        const angle = (i / 3) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * r * 0.6, h * 0.45, Math.sin(angle) * r * 0.6]}
            rotation={[0, -angle, 0.08]}>
            <cylinderGeometry args={[0.012, 0.014, h * 0.9, 12]} />
            <meshStandardMaterial color="#B8860B" metalness={0.9} roughness={0.18} envMapIntensity={1.5} />
          </mesh>
        );
      })}
      {/* Bottom hub */}
      <mesh position={[0, 0.015, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.025, 16]} />
        <meshStandardMaterial color="#B8860B" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Marble round top */}
      <mesh position={[0, h - 0.02, 0]}>
        <cylinderGeometry args={[r, r, 0.04, 48]} />
        <meshPhysicalMaterial color="#F5F1EA" roughness={0.15} metalness={0.05} clearcoat={0.6} clearcoatRoughness={0.2} />
      </mesh>
      {/* Marble veining (fake via emissive lines) */}
      <mesh position={[0, h, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[r * 0.3, r * 0.32, 48]} />
        <meshBasicMaterial color="#A8A095" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ─── CONSOLE TABLE (long narrow with drawers) ────────────────────────
function ConsoleTableModel({ config }: { config: CustomConfig }) {
  const w = Math.max(config.width / 100, 1.2);
  const h = config.height / 100;
  const d = config.depth / 100 * 0.5; // narrow
  const woodMat = useWoodMaterial(config.woodType, config.finish, config.material);
  const hasDrawers = config.components.includes('drawers');

  return (
    <group position={[0, -h / 2, 0]}>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
        <RoundedBox key={i} args={[0.04, h * 0.92, 0.04]} radius={0.008}
          position={[x * (w / 2 - 0.04), h * 0.46, z * (d / 2 - 0.04)]}>
          <meshStandardMaterial {...woodMat} />
        </RoundedBox>
      ))}
      {/* Drawer row */}
      {hasDrawers && Array.from({ length: 3 }).map((_, i) => (
        <group key={i} position={[(-w / 2 + 0.1) + (i + 0.5) * ((w - 0.2) / 3), h * 0.7, d / 2 - 0.025]}>
          <RoundedBox args={[(w - 0.2) / 3 - 0.02, 0.18, 0.04]} radius={0.005}>
            <meshStandardMaterial {...woodMat} />
          </RoundedBox>
          <mesh position={[0, 0, 0.025]}>
            <torusGeometry args={[0.018, 0.004, 8, 16]} />
            <meshStandardMaterial color="#B8860B" metalness={0.9} roughness={0.15} />
          </mesh>
        </group>
      ))}
      {/* Lower shelf */}
      <RoundedBox args={[w * 0.92, 0.025, d * 0.85]} radius={0.005}
        position={[0, h * 0.3, 0]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>
      {/* Top */}
      <RoundedBox args={[w, 0.04, d]} radius={0.01} smoothness={4}
        position={[0, h * 0.92 + 0.02, 0]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>
    </group>
  );
}

// ─── NESTING TABLES (3 stacked) ──────────────────────────────────────
function NestingTablesModel({ config }: { config: CustomConfig }) {
  const w = config.width / 100;
  const h = config.height / 100 * 0.5;
  const d = config.depth / 100;
  const woodMat = useWoodMaterial(config.woodType, config.finish, config.material);

  return (
    <group position={[0, -h / 2, 0]}>
      {[0, 1, 2].map(i => {
        const scale = 1 - i * 0.18;
        const offset = i * 0.12;
        return (
          <group key={i} position={[offset * w * 0.4, 0, offset * d * 0.3]}>
            {/* 4 thin legs */}
            {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], j) => (
              <mesh key={j} position={[x * (w * scale / 2 - 0.025), h * scale * 0.45, z * (d * scale / 2 - 0.025)]}>
                <cylinderGeometry args={[0.015, 0.02, h * scale * 0.9, 12]} />
                <meshStandardMaterial {...woodMat} />
              </mesh>
            ))}
            {/* Top */}
            <RoundedBox args={[w * scale, 0.025, d * scale]} radius={0.008}
              position={[0, h * scale * 0.92, 0]}>
              <meshStandardMaterial {...woodMat} />
            </RoundedBox>
          </group>
        );
      })}
    </group>
  );
}

// ─── NIGHTSTAND (small cabinet, 1-2 drawers) ─────────────────────────
function NightstandModel({ config }: { config: CustomConfig }) {
  const w = config.width / 100 * 0.55;
  const h = config.height / 100 * 0.7;
  const d = config.depth / 100 * 0.55;
  const woodMat = useWoodMaterial(config.woodType, config.finish, config.material);

  return (
    <group position={[0, -h / 2, 0]}>
      {/* Body */}
      <RoundedBox args={[w, h, d]} radius={0.012} smoothness={4} position={[0, h / 2, 0]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>
      {/* Top with overhang */}
      <RoundedBox args={[w + 0.04, 0.025, d + 0.04]} radius={0.008}
        position={[0, h + 0.012, 0]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>
      {/* Two drawers */}
      {[0, 1].map(i => (
        <group key={i} position={[0, h * 0.3 + i * h * 0.4, d / 2 + 0.005]}>
          <RoundedBox args={[w * 0.85, h * 0.32, 0.012]} radius={0.005}>
            <meshStandardMaterial {...woodMat} />
          </RoundedBox>
          <mesh position={[0, 0, 0.012]}>
            <torusGeometry args={[0.022, 0.005, 8, 16]} />
            <meshStandardMaterial color="#B8860B" metalness={0.9} roughness={0.15} />
          </mesh>
        </group>
      ))}
      {/* Tapered legs */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
        <mesh key={i} position={[x * (w / 2 - 0.02), -0.04, z * (d / 2 - 0.02)]}>
          <cylinderGeometry args={[0.012, 0.018, 0.08, 12]} />
          <meshStandardMaterial {...woodMat} />
        </mesh>
      ))}
    </group>
  );
}

// ─── CANOPY BED (4-poster) ───────────────────────────────────────────
function CanopyBedModel({ config }: { config: CustomConfig }) {
  const w = config.width / 100;
  const h = config.height / 100;
  const d = config.depth / 100;
  const woodMat = useWoodMaterial(config.woodType, config.finish, config.material);
  const fabricMat = useFabricMaterial(config.style);
  const frameH = h * 0.22;
  const postH = h * 1.4;

  return (
    <group position={[0, -h / 2, 0]}>
      {/* Frame rails */}
      {[-1, 1].map(s => (
        <RoundedBox key={s} args={[0.08, frameH, d]} radius={0.012}
          position={[s * (w / 2 - 0.04), frameH / 2, 0]}>
          <meshStandardMaterial {...woodMat} />
        </RoundedBox>
      ))}
      {/* 4 tall posts */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
        <group key={i} position={[x * (w / 2 - 0.04), 0, z * (d / 2 - 0.04)]}>
          <mesh position={[0, postH / 2, 0]}>
            <cylinderGeometry args={[0.04, 0.05, postH, 16]} />
            <meshStandardMaterial {...woodMat} />
          </mesh>
          {/* Decorative finial */}
          <mesh position={[0, postH + 0.04, 0]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial {...woodMat} />
          </mesh>
        </group>
      ))}
      {/* Canopy top frame */}
      {[
        { p: [0, postH, -d / 2 + 0.04] as [number, number, number], s: [w - 0.08, 0.04, 0.05] as [number, number, number] },
        { p: [0, postH, d / 2 - 0.04] as [number, number, number], s: [w - 0.08, 0.04, 0.05] as [number, number, number] },
        { p: [-w / 2 + 0.04, postH, 0] as [number, number, number], s: [0.05, 0.04, d - 0.08] as [number, number, number] },
        { p: [w / 2 - 0.04, postH, 0] as [number, number, number], s: [0.05, 0.04, d - 0.08] as [number, number, number] },
      ].map((rail, i) => (
        <RoundedBox key={i} args={rail.s} radius={0.008} position={rail.p}>
          <meshStandardMaterial {...woodMat} />
        </RoundedBox>
      ))}
      {/* Draping fabric panels (corners) */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
        <mesh key={i} position={[x * (w / 2 - 0.05), postH * 0.55, z * (d / 2 - 0.05)]}>
          <planeGeometry args={[0.08, postH * 0.85]} />
          <meshStandardMaterial color="#3d2818" transparent opacity={0.7} side={THREE.DoubleSide} roughness={0.95} />
        </mesh>
      ))}
      {/* Mattress */}
      <RoundedBox args={[w * 0.92, 0.18, d * 0.9]} radius={0.05} smoothness={6}
        position={[0, frameH + 0.09, 0]}>
        <meshStandardMaterial color="#F8F4ED" roughness={0.98} />
      </RoundedBox>
      {/* Pillows */}
      {[-0.25, 0.25].map((x, i) => (
        <RoundedBox key={i} args={[w * 0.3, 0.1, 0.22]} radius={0.04} smoothness={6}
          position={[x * w, frameH + 0.23, -d * 0.28]}>
          <meshStandardMaterial color="#FFFFFF" roughness={0.96} />
        </RoundedBox>
      ))}
    </group>
  );
}

// ─── BOOKSHELF (tall, many shelves) ──────────────────────────────────
function BookshelfModel({ config }: { config: CustomConfig }) {
  const w = config.width / 100 * 0.8;
  const h = Math.max(config.height / 100, 1.6);
  const d = config.depth / 100 * 0.45;
  const woodMat = useWoodMaterial(config.woodType, config.finish, config.material);
  const panelT = 0.022;

  return (
    <group position={[0, -h / 2, 0]}>
      {/* Sides */}
      {[-1, 1].map(s => (
        <RoundedBox key={s} args={[panelT, h, d]} radius={0.005}
          position={[s * (w / 2 - panelT / 2), h / 2, 0]}>
          <meshStandardMaterial {...woodMat} />
        </RoundedBox>
      ))}
      {/* Back */}
      <RoundedBox args={[w - panelT * 2, h, panelT * 0.5]} radius={0.003}
        position={[0, h / 2, -d / 2 + panelT * 0.25]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>
      {/* Top, bottom */}
      <RoundedBox args={[w, panelT, d]} radius={0.005} position={[0, h - panelT / 2, 0]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>
      <RoundedBox args={[w, panelT, d]} radius={0.005} position={[0, panelT / 2, 0]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>
      {/* 5 shelves with books */}
      {[0.2, 0.36, 0.52, 0.68, 0.84].map((frac, idx) => (
        <group key={frac} position={[0, h * frac, 0]}>
          <RoundedBox args={[w - panelT * 2, 0.018, d - 0.02]} radius={0.003}>
            <meshStandardMaterial {...woodMat} />
          </RoundedBox>
          {/* Books — varied colors and heights */}
          {Array.from({ length: 8 }).map((_, b) => {
            const colors = ['#8B2500', '#1F3A5F', '#2D5016', '#5C2D0E', '#3D2818', '#4A4A4A', '#7B3F00', '#1a3a3a'];
            const bookH = 0.1 + ((b + idx) % 4) * 0.025;
            return (
              <mesh key={b} position={[(-w / 2 + panelT + 0.04) + b * ((w - panelT * 2 - 0.08) / 8), bookH / 2 + 0.012, 0]}>
                <boxGeometry args={[(w - panelT * 2 - 0.08) / 8 - 0.005, bookH, d * 0.7]} />
                <meshStandardMaterial color={colors[(b + idx) % colors.length]} roughness={0.85} />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

// ─── TV UNIT (low, wide, with media compartments) ────────────────────
function TVUnitModel({ config }: { config: CustomConfig }) {
  const w = Math.max(config.width / 100, 1.4);
  const h = config.height / 100 * 0.5;
  const d = config.depth / 100 * 0.5;
  const woodMat = useWoodMaterial(config.woodType, config.finish, config.material);
  const hasLighting = config.components.includes('lighting');

  return (
    <group position={[0, -h / 2, 0]}>
      {/* Body */}
      <RoundedBox args={[w, h, d]} radius={0.01} smoothness={4} position={[0, h / 2, 0]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>
      {/* Open shelves middle */}
      <mesh position={[0, h * 0.5, d / 2 + 0.001]}>
        <boxGeometry args={[w * 0.5, h * 0.6, 0.005]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
      </mesh>
      {/* Side cabinet doors */}
      {[-1, 1].map(side => (
        <group key={side} position={[side * (w * 0.32), h / 2, d / 2 + 0.005]}>
          <RoundedBox args={[w * 0.3, h * 0.85, 0.012]} radius={0.005}>
            <meshStandardMaterial {...woodMat} />
          </RoundedBox>
          {/* Vertical handle bar */}
          <RoundedBox args={[0.008, h * 0.35, 0.012]} radius={0.003}
            position={[side * w * 0.12, 0, 0.012]}>
            <meshStandardMaterial color="#B8860B" metalness={0.9} roughness={0.15} />
          </RoundedBox>
        </group>
      ))}
      {/* Top with overhang */}
      <RoundedBox args={[w + 0.03, 0.025, d + 0.03]} radius={0.008}
        position={[0, h + 0.012, 0]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>
      {/* Short legs */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
        <mesh key={i} position={[x * (w / 2 - 0.06), -0.025, z * (d / 2 - 0.04)]}
          rotation={[Math.PI, 0, x * 0.1]}>
          <cylinderGeometry args={[0.012, 0.018, 0.05, 12]} />
          <meshStandardMaterial {...woodMat} />
        </mesh>
      ))}
      {/* Underglow */}
      {hasLighting && (
        <>
          <mesh position={[0, 0.01, 0]}>
            <boxGeometry args={[w * 0.9, 0.005, 0.005]} />
            <meshStandardMaterial color="#C8A45C" emissive="#C8A45C" emissiveIntensity={2} />
          </mesh>
          <pointLight position={[0, 0.05, 0]} intensity={0.4} color="#C8A45C" distance={1.2} />
        </>
      )}
    </group>
  );
}

// ─── WARDROBE (tall triple-door) ─────────────────────────────────────
function WardrobeModel({ config }: { config: CustomConfig }) {
  const w = Math.max(config.width / 100, 1.6);
  const h = Math.max(config.height / 100, 1.8);
  const d = config.depth / 100 * 0.6;
  const woodMat = useWoodMaterial(config.woodType, config.finish, config.material);
  const hasMirror = config.components.includes('mirror');
  const hasHandles = config.components.includes('handles');

  return (
    <group position={[0, -h / 2, 0]}>
      {/* Main body */}
      <RoundedBox args={[w, h, d]} radius={0.012} smoothness={4} position={[0, h / 2, 0]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>
      {/* 3 doors */}
      {[-1, 0, 1].map(idx => (
        <group key={idx} position={[idx * (w / 3), h / 2, d / 2 + 0.005]}>
          <RoundedBox args={[w / 3 - 0.015, h - 0.04, 0.015]} radius={0.005}>
            {idx === 0 && hasMirror ? (
              <meshPhysicalMaterial color="#E8E8EE" metalness={0.95} roughness={0.05} envMapIntensity={2} />
            ) : (
              <meshStandardMaterial {...woodMat} />
            )}
          </RoundedBox>
          {/* Long vertical handle */}
          {hasHandles && (
            <RoundedBox args={[0.012, h * 0.5, 0.018]} radius={0.005}
              position={[(idx === 1 ? w * 0.12 : (idx === -1 ? w * 0.12 : -w * 0.12)), 0, 0.018]}>
              <meshStandardMaterial color="#B8860B" metalness={0.92} roughness={0.12} envMapIntensity={1.5} />
            </RoundedBox>
          )}
          {/* Inset panel detail */}
          {!(idx === 0 && hasMirror) && (
            <RoundedBox args={[w / 3 - 0.08, h * 0.85, 0.005]} radius={0.005}
              position={[0, 0, 0.012]}>
              <meshStandardMaterial {...woodMat} />
            </RoundedBox>
          )}
        </group>
      ))}
      {/* Crown moulding */}
      <RoundedBox args={[w + 0.04, 0.04, d + 0.04]} radius={0.01}
        position={[0, h + 0.02, 0]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>
      {/* Base plinth */}
      <RoundedBox args={[w + 0.02, 0.06, d + 0.02]} radius={0.008}
        position={[0, 0.03, 0]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>
    </group>
  );
}

// ─── WINE CABINET (glass front, racks) ───────────────────────────────
function WineCabinetModel({ config }: { config: CustomConfig }) {
  const w = config.width / 100;
  const h = config.height / 100;
  const d = config.depth / 100 * 0.55;
  const woodMat = useWoodMaterial(config.woodType, config.finish, config.material);

  return (
    <group position={[0, -h / 2, 0]}>
      {/* Body */}
      <RoundedBox args={[w, h, d]} radius={0.012} smoothness={4} position={[0, h / 2, 0]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>
      {/* Glass front door */}
      <mesh position={[0, h / 2, d / 2 + 0.005]}>
        <boxGeometry args={[w * 0.85, h * 0.8, 0.008]} />
        <meshPhysicalMaterial color="#1a2a3a" roughness={0.05} metalness={0.1}
          transparent opacity={0.4} transmission={0.7} thickness={0.3} ior={1.5} />
      </mesh>
      {/* Glass frame */}
      {[-1, 1].map(s => (
        <RoundedBox key={`v${s}`} args={[0.025, h * 0.85, 0.015]} radius={0.003}
          position={[s * (w * 0.43), h / 2, d / 2 + 0.005]}>
          <meshStandardMaterial {...woodMat} />
        </RoundedBox>
      ))}
      {/* Wine bottle racks visible */}
      {[0.25, 0.42, 0.58, 0.75].map((frac, row) => (
        <group key={frac} position={[0, h * frac, 0]}>
          {Array.from({ length: 6 }).map((_, b) => {
            const x = (-w * 0.35) + b * (w * 0.7 / 5);
            return (
              <mesh key={b} position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.18, 12]} />
                <meshStandardMaterial color={row % 2 ? '#2a4a1a' : '#3a1a1a'} roughness={0.4} metalness={0.1} />
              </mesh>
            );
          })}
        </group>
      ))}
      {/* Internal warm light */}
      <pointLight position={[0, h * 0.5, d * 0.2]} intensity={0.5} color="#FFC97A" distance={1.2} />
      {/* Top moulding */}
      <RoundedBox args={[w + 0.02, 0.025, d + 0.02]} radius={0.008}
        position={[0, h + 0.012, 0]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>
    </group>
  );
}

// ─── DRESSER (6 drawers in a 3x2 grid) ───────────────────────────────
function DresserModel({ config }: { config: CustomConfig }) {
  const w = Math.max(config.width / 100, 1.2);
  const h = config.height / 100 * 0.7;
  const d = config.depth / 100 * 0.5;
  const woodMat = useWoodMaterial(config.woodType, config.finish, config.material);

  return (
    <group position={[0, -h / 2, 0]}>
      <RoundedBox args={[w, h, d]} radius={0.012} smoothness={4} position={[0, h / 2, 0]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>
      {/* Drawer grid 3x2 */}
      {[0, 1, 2].map(row =>
        [-1, 1].map(col => (
          <group key={`${row}-${col}`} position={[col * w * 0.245, h * 0.18 + row * h * 0.27, d / 2 + 0.005]}>
            <RoundedBox args={[w * 0.45, h * 0.22, 0.012]} radius={0.005}>
              <meshStandardMaterial {...woodMat} />
            </RoundedBox>
            {/* Two knobs per drawer */}
            {[-1, 1].map(k => (
              <mesh key={k} position={[k * w * 0.1, 0, 0.013]}>
                <sphereGeometry args={[0.02, 16, 16]} />
                <meshStandardMaterial color="#B8860B" metalness={0.92} roughness={0.12} envMapIntensity={1.5} />
              </mesh>
            ))}
          </group>
        ))
      )}
      {/* Top with overhang */}
      <RoundedBox args={[w + 0.04, 0.03, d + 0.04]} radius={0.008}
        position={[0, h + 0.015, 0]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>
      {/* Splayed legs */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
        <mesh key={i} position={[x * (w / 2 - 0.05), -0.05, z * (d / 2 - 0.04)]}
          rotation={[0, 0, x * 0.12]}>
          <cylinderGeometry args={[0.014, 0.022, 0.1, 12]} />
          <meshStandardMaterial {...woodMat} />
        </mesh>
      ))}
    </group>
  );
}

// ─── ERGONOMIC OFFICE CHAIR (5-star base, mesh back) ─────────────────
function ErgonomicChairModel({ config }: { config: CustomConfig }) {
  const w = config.width / 100;
  const h = config.height / 100;
  const fabricMat = useFabricMaterial(config.style);

  return (
    <group position={[0, -h / 2, 0]}>
      {/* 5-star base with casters */}
      {[0, 1, 2, 3, 4].map(i => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <group key={i} rotation={[0, angle, 0]}>
            <mesh position={[w * 0.28, 0.04, 0]} rotation={[0, 0, 0.1]}>
              <boxGeometry args={[w * 0.4, 0.025, 0.04]} />
              <meshStandardMaterial color="#222" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Caster wheel */}
            <mesh position={[w * 0.45, 0.025, 0]}>
              <sphereGeometry args={[0.025, 16, 16]} />
              <meshStandardMaterial color="#111" roughness={0.5} metalness={0.3} />
            </mesh>
          </group>
        );
      })}
      {/* Gas-lift cylinder */}
      <mesh position={[0, h * 0.3, 0]}>
        <cylinderGeometry args={[0.025, 0.03, h * 0.5, 16]} />
        <meshStandardMaterial color="#888" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Seat — contoured */}
      <RoundedBox args={[w * 0.55, 0.08, w * 0.55]} radius={0.04} smoothness={6}
        position={[0, h * 0.55, 0]}>
        <meshStandardMaterial {...fabricMat} />
      </RoundedBox>
      {/* Mesh backrest */}
      <RoundedBox args={[w * 0.5, h * 0.45, 0.05]} radius={0.04} smoothness={6}
        position={[0, h * 0.82, -w * 0.2]} rotation={[-0.1, 0, 0]}>
        <meshStandardMaterial color="#1a1a1a" roughness={0.85} metalness={0.05} />
      </RoundedBox>
      {/* Mesh holes (visual lattice) */}
      {Array.from({ length: 6 }).map((_, r) =>
        Array.from({ length: 4 }).map((_, c) => (
          <mesh key={`${r}-${c}`} position={[(c - 1.5) * 0.07, h * 0.7 + r * 0.06, -w * 0.18]}>
            <ringGeometry args={[0.012, 0.018, 16]} />
            <meshBasicMaterial color="#000" transparent opacity={0.4} side={THREE.DoubleSide} />
          </mesh>
        ))
      )}
      {/* Headrest */}
      <RoundedBox args={[w * 0.35, 0.1, 0.06]} radius={0.03}
        position={[0, h * 1.1, -w * 0.18]}>
        <meshStandardMaterial color="#1a1a1a" roughness={0.85} />
      </RoundedBox>
      {/* Armrests */}
      {[-1, 1].map(side => (
        <group key={side}>
          <mesh position={[side * w * 0.32, h * 0.6, 0.02]}>
            <cylinderGeometry args={[0.018, 0.022, 0.18, 12]} />
            <meshStandardMaterial color="#222" metalness={0.7} roughness={0.3} />
          </mesh>
          <RoundedBox args={[0.05, 0.025, 0.18]} radius={0.012}
            position={[side * w * 0.32, h * 0.7, 0.02]}>
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}

// ─── STANDING DESK (motorized, 2 column legs) ────────────────────────
function StandingDeskModel({ config }: { config: CustomConfig }) {
  const w = Math.max(config.width / 100, 1.2);
  const h = config.height / 100;
  const d = config.depth / 100;
  const woodMat = useWoodMaterial(config.woodType, config.finish, config.material);

  return (
    <group position={[0, -h / 2, 0]}>
      {/* Two telescoping column legs */}
      {[-1, 1].map(side => (
        <group key={side} position={[side * (w / 2 - 0.15), 0, 0]}>
          {/* Foot */}
          <RoundedBox args={[0.08, 0.03, d * 0.85]} radius={0.005}
            position={[0, 0.015, 0]}>
            <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.3} />
          </RoundedBox>
          {/* Lower column (wider) */}
          <RoundedBox args={[0.07, h * 0.5, 0.07]} radius={0.005}
            position={[0, h * 0.27, 0]}>
            <meshStandardMaterial color="#2a2a2a" metalness={0.75} roughness={0.25} />
          </RoundedBox>
          {/* Upper column (narrower, telescoping) */}
          <RoundedBox args={[0.055, h * 0.45, 0.055]} radius={0.004}
            position={[0, h * 0.72, 0]}>
            <meshStandardMaterial color="#3a3a3a" metalness={0.8} roughness={0.22} />
          </RoundedBox>
        </group>
      ))}
      {/* Cross brace */}
      <mesh position={[0, h * 0.92, 0]}>
        <boxGeometry args={[w - 0.3, 0.015, 0.04]} />
        <meshStandardMaterial color="#222" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Desktop */}
      <RoundedBox args={[w, 0.035, d]} radius={0.008} smoothness={4}
        position={[0, h * 0.95 + 0.018, 0]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>
      {/* Control panel */}
      <RoundedBox args={[0.12, 0.025, 0.05]} radius={0.005}
        position={[w / 2 - 0.1, h * 0.92, d / 2 - 0.04]}>
        <meshStandardMaterial color="#0a0a0a" roughness={0.4} metalness={0.5} />
      </RoundedBox>
      {/* Display LED */}
      <mesh position={[w / 2 - 0.1, h * 0.93, d / 2 - 0.014]}>
        <planeGeometry args={[0.08, 0.015]} />
        <meshBasicMaterial color="#00FF88" />
      </mesh>
    </group>
  );
}

// ─── FILING CABINET (4 lateral drawers) ──────────────────────────────
function FilingCabinetModel({ config }: { config: CustomConfig }) {
  const w = config.width / 100 * 0.7;
  const h = config.height / 100;
  const d = config.depth / 100 * 0.55;
  const woodMat = useWoodMaterial(config.woodType, config.finish, config.material);

  return (
    <group position={[0, -h / 2, 0]}>
      <RoundedBox args={[w, h, d]} radius={0.008} smoothness={4} position={[0, h / 2, 0]}>
        <meshStandardMaterial color="#3a3a3a" metalness={0.6} roughness={0.4} />
      </RoundedBox>
      {/* 4 drawers */}
      {[0, 1, 2, 3].map(i => (
        <group key={i} position={[0, h * 0.12 + i * h * 0.235, d / 2 + 0.005]}>
          <RoundedBox args={[w * 0.92, h * 0.2, 0.012]} radius={0.004}>
            <meshStandardMaterial color="#4a4a4a" metalness={0.65} roughness={0.35} />
          </RoundedBox>
          {/* Pull handle */}
          <RoundedBox args={[w * 0.3, 0.025, 0.018]} radius={0.005}
            position={[0, -h * 0.06, 0.015]}>
            <meshStandardMaterial color="#888" metalness={0.9} roughness={0.15} />
          </RoundedBox>
          {/* Label slot */}
          <mesh position={[0, h * 0.05, 0.013]}>
            <planeGeometry args={[w * 0.25, 0.025]} />
            <meshStandardMaterial color="#fff" roughness={0.8} />
          </mesh>
          {/* Lock */}
          {i === 0 && (
            <mesh position={[w * 0.4, 0.015, 0.013]}>
              <cylinderGeometry args={[0.012, 0.012, 0.008, 16]} rotation={[Math.PI / 2, 0, 0]} />
              <meshStandardMaterial color="#B8860B" metalness={0.9} roughness={0.15} />
            </mesh>
          )}
        </group>
      ))}
      {/* Top */}
      <RoundedBox args={[w + 0.01, 0.012, d + 0.01]} radius={0.003}
        position={[0, h + 0.006, 0]}>
        <meshStandardMaterial color="#2a2a2a" metalness={0.65} roughness={0.35} />
      </RoundedBox>
    </group>
  );
}

// ─── CONFERENCE TABLE (long, oval-ish) ───────────────────────────────
function ConferenceTableModel({ config }: { config: CustomConfig }) {
  const w = Math.max(config.width / 100, 2.5);
  const h = config.height / 100;
  const d = Math.max(config.depth / 100, 1.0);
  const woodMat = useWoodMaterial(config.woodType, config.finish, config.material);
  const hasCableMgmt = config.components.includes('cable-mgmt');

  return (
    <group position={[0, -h / 2, 0]}>
      {/* Two pedestal bases */}
      {[-1, 1].map(side => (
        <group key={side} position={[side * (w * 0.32), 0, 0]}>
          {/* Wide foot */}
          <RoundedBox args={[0.5, 0.04, d * 0.7]} radius={0.01}
            position={[0, 0.02, 0]}>
            <meshStandardMaterial {...woodMat} />
          </RoundedBox>
          {/* Pedestal column */}
          <RoundedBox args={[0.18, h * 0.85, d * 0.4]} radius={0.015}
            position={[0, h * 0.45, 0]}>
            <meshStandardMaterial {...woodMat} />
          </RoundedBox>
          {/* Brass cap */}
          <BrassAccent position={[0, 0.005, 0]} size={[0.52, 0.012, d * 0.72]} />
        </group>
      ))}
      {/* Oval-ish top (rounded rectangle) */}
      <RoundedBox args={[w, 0.05, d]} radius={Math.min(0.3, d * 0.35)} smoothness={8}
        position={[0, h * 0.9 + 0.025, 0]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>
      {/* Cable grommets */}
      {hasCableMgmt && [-2, -1, 0, 1, 2].map(i => (
        <mesh key={i} position={[i * (w / 6), h * 0.92 + 0.026, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.015, 16]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

// ─── CREDENZA (long low storage with 4 doors) ────────────────────────
function CredenzaModel({ config }: { config: CustomConfig }) {
  const w = Math.max(config.width / 100, 1.8);
  const h = config.height / 100 * 0.6;
  const d = config.depth / 100 * 0.5;
  const woodMat = useWoodMaterial(config.woodType, config.finish, config.material);

  return (
    <group position={[0, -h / 2, 0]}>
      <RoundedBox args={[w, h, d]} radius={0.012} smoothness={4} position={[0, h / 2, 0]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>
      {/* 4 doors */}
      {[-1.5, -0.5, 0.5, 1.5].map(idx => (
        <group key={idx} position={[idx * (w / 4), h / 2, d / 2 + 0.005]}>
          <RoundedBox args={[w / 4 - 0.02, h - 0.04, 0.012]} radius={0.005}>
            <meshStandardMaterial {...woodMat} />
          </RoundedBox>
          {/* Inset square */}
          <RoundedBox args={[w / 4 - 0.1, h * 0.7, 0.005]} radius={0.005}
            position={[0, 0, 0.012]}>
            <meshStandardMaterial {...woodMat} />
          </RoundedBox>
          {/* Knob */}
          <mesh position={[0, h * 0.3, 0.018]}>
            <sphereGeometry args={[0.018, 16, 16]} />
            <meshStandardMaterial color="#B8860B" metalness={0.9} roughness={0.15} />
          </mesh>
        </group>
      ))}
      {/* Splayed mid-century legs */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
        <mesh key={i} position={[x * (w / 2 - 0.08), -0.06, z * (d / 2 - 0.04)]}
          rotation={[0, 0, x * 0.18]}>
          <cylinderGeometry args={[0.012, 0.022, 0.12, 12]} />
          <meshStandardMaterial {...woodMat} />
        </mesh>
      ))}
      {/* Top */}
      <RoundedBox args={[w + 0.02, 0.025, d + 0.02]} radius={0.008}
        position={[0, h + 0.012, 0]}>
        <meshStandardMaterial {...woodMat} />
      </RoundedBox>
    </group>
  );
}

// ─── Ground plane ────────────────────────────────────────────────────
function GroundPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.52, 0]} receiveShadow>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial color="#111111" roughness={0.9} metalness={0} transparent opacity={0.3} />
    </mesh>
  );
}

interface Props {
  config: CustomConfig;
  category: Category;
  subtype?: string;
}

const ProductViewer3D: React.FC<Props> = ({ config, category, subtype }) => {
  return (
    <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-secondary/20 border border-border/30">
      <Canvas
        camera={{ position: [2.2, 1.6, 2.2], fov: 38 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        dpr={[1, 2]}
        shadows
      >
        <color attach="background" args={['#0A0A0B']} />
        <fog attach="fog" args={['#0A0A0B', 4, 12]} />

        <ambientLight intensity={0.25} />
        <directionalLight position={[4, 8, 4]} intensity={1.2} castShadow shadow-mapSize={1024} />
        <directionalLight position={[-3, 5, -3]} intensity={0.35} color="#FFE8C8" />
        <spotLight position={[0, 5, 0]} intensity={0.5} angle={0.6} penumbra={0.8} color="#FFF5E0" />

        <FurnitureModel config={config} category={category} subtype={subtype} />
        <GroundPlane />

        <ContactShadows position={[0, -0.51, 0]} opacity={0.5} scale={5} blur={2.5} far={2} />
        <Environment preset="studio" />
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={1.2}
          maxDistance={6}
          minPolarAngle={Math.PI * 0.1}
          maxPolarAngle={Math.PI * 0.55}
          autoRotate={false}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>
    </div>
  );
};

export default ProductViewer3D;
