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
