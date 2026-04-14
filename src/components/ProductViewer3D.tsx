import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { CustomConfig } from '@/contexts/CartContext';
import type { Category } from '@/data/products';

const WOOD_COLORS: Record<string, string> = {
  teak: '#B8860B',
  sheesham: '#8B4513',
  oak: '#C4A35A',
  walnut: '#5C4033',
  pine: '#DEB887',
  mahogany: '#C04000',
};

const FINISH_PROPS: Record<string, { roughness: number; metalness: number }> = {
  matte: { roughness: 0.9, metalness: 0.0 },
  glossy: { roughness: 0.15, metalness: 0.1 },
  natural: { roughness: 0.7, metalness: 0.0 },
  laminated: { roughness: 0.4, metalness: 0.05 },
  polished: { roughness: 0.1, metalness: 0.15 },
};

const MATERIAL_ADJUST: Record<string, { metalness: number; opacity: number }> = {
  'solid-wood': { metalness: 0, opacity: 1 },
  'engineered': { metalness: 0, opacity: 1 },
  'metal': { metalness: 0.8, opacity: 1 },
  'glass': { metalness: 0.1, opacity: 0.4 },
  'upholstery': { metalness: 0, opacity: 1 },
};

// Chair/Seating model
function ChairModel({ config }: { config: CustomConfig }) {
  const w = config.width / 100;
  const h = config.height / 100;
  const d = config.depth / 100;
  const color = WOOD_COLORS[config.woodType] || '#C4A35A';
  const finish = FINISH_PROPS[config.finish] || FINISH_PROPS.matte;
  const mat = MATERIAL_ADJUST[config.material] || MATERIAL_ADJUST['solid-wood'];

  const materialProps = {
    color,
    roughness: finish.roughness,
    metalness: Math.max(finish.metalness, mat.metalness),
    transparent: mat.opacity < 1,
    opacity: mat.opacity,
  };

  const legH = h * 0.45;
  const seatT = 0.06;
  const backH = h * 0.5;
  const hasArmrest = config.components.includes('armrest');
  const hasCushion = config.components.includes('cushion');
  const hasHeadrest = config.components.includes('headrest');

  return (
    <group position={[0, -h / 2, 0]}>
      {/* Legs */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
        <mesh key={i} position={[x * (w / 2 - 0.04), legH / 2, z * (d / 2 - 0.04)]}>
          <cylinderGeometry args={[0.025, 0.03, legH, 8]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      ))}
      {/* Seat */}
      <RoundedBox args={[w, seatT, d]} radius={0.02} position={[0, legH + seatT / 2, 0]}>
        <meshStandardMaterial {...materialProps} />
      </RoundedBox>
      {/* Cushion */}
      {hasCushion && (
        <RoundedBox args={[w * 0.85, 0.05, d * 0.85]} radius={0.02} position={[0, legH + seatT + 0.025, 0]}>
          <meshStandardMaterial color="#E8D5B7" roughness={0.95} />
        </RoundedBox>
      )}
      {/* Backrest */}
      <RoundedBox args={[w, backH, 0.05]} radius={0.02} position={[0, legH + seatT + backH / 2, -d / 2 + 0.025]}>
        <meshStandardMaterial {...materialProps} />
      </RoundedBox>
      {/* Headrest */}
      {hasHeadrest && (
        <RoundedBox args={[w * 0.6, 0.12, 0.06]} radius={0.03} position={[0, legH + seatT + backH + 0.06, -d / 2 + 0.03]}>
          <meshStandardMaterial color="#D4C4A0" roughness={0.9} />
        </RoundedBox>
      )}
      {/* Armrests */}
      {hasArmrest && [-1, 1].map(side => (
        <group key={side}>
          <mesh position={[side * (w / 2 - 0.02), legH + seatT + backH * 0.35, 0]}>
            <boxGeometry args={[0.04, 0.04, d * 0.7]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[side * (w / 2 - 0.02), legH + seatT + backH * 0.18, d * 0.2]}>
            <cylinderGeometry args={[0.02, 0.02, backH * 0.35, 8]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Table model
function TableModel({ config }: { config: CustomConfig }) {
  const w = config.width / 100;
  const h = config.height / 100;
  const d = config.depth / 100;
  const color = WOOD_COLORS[config.woodType] || '#C4A35A';
  const finish = FINISH_PROPS[config.finish] || FINISH_PROPS.matte;
  const mat = MATERIAL_ADJUST[config.material] || MATERIAL_ADJUST['solid-wood'];

  const materialProps = {
    color,
    roughness: finish.roughness,
    metalness: Math.max(finish.metalness, mat.metalness),
    transparent: mat.opacity < 1,
    opacity: mat.opacity,
  };

  const topT = 0.05;
  const legH = h - topT;
  const hasDrawers = config.components.includes('drawers');
  const hasGlassTop = config.components.includes('glass-top');

  return (
    <group position={[0, -h / 2, 0]}>
      {/* Legs */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
        <mesh key={i} position={[x * (w / 2 - 0.05), legH / 2, z * (d / 2 - 0.05)]}>
          <boxGeometry args={[0.06, legH, 0.06]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      ))}
      {/* Table top */}
      <RoundedBox args={[w, topT, d]} radius={0.015} position={[0, legH + topT / 2, 0]}>
        <meshStandardMaterial {...materialProps} />
      </RoundedBox>
      {/* Glass top */}
      {hasGlassTop && (
        <RoundedBox args={[w * 0.9, 0.015, d * 0.9]} radius={0.01} position={[0, legH + topT + 0.01, 0]}>
          <meshStandardMaterial color="#88CCEE" roughness={0.05} metalness={0.1} transparent opacity={0.3} />
        </RoundedBox>
      )}
      {/* Drawers */}
      {hasDrawers && (
        <group position={[0, legH - 0.1, d / 2 - 0.06]}>
          <RoundedBox args={[w * 0.6, 0.12, 0.1]} radius={0.01}>
            <meshStandardMaterial {...materialProps} color={new THREE.Color(color).offsetHSL(0, 0, -0.1).getStyle()} />
          </RoundedBox>
          <mesh position={[0, 0, 0.055]}>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshStandardMaterial color="#B8860B" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// Bed model
function BedModel({ config }: { config: CustomConfig }) {
  const w = config.width / 100;
  const h = config.height / 100;
  const d = config.depth / 100;
  const color = WOOD_COLORS[config.woodType] || '#C4A35A';
  const finish = FINISH_PROPS[config.finish] || FINISH_PROPS.matte;
  const mat = MATERIAL_ADJUST[config.material] || MATERIAL_ADJUST['solid-wood'];

  const materialProps = {
    color,
    roughness: finish.roughness,
    metalness: Math.max(finish.metalness, mat.metalness),
  };

  const frameH = h * 0.3;
  const headH = h * 0.7;
  const hasLed = config.components.includes('led');

  return (
    <group position={[0, -h * 0.3, 0]}>
      {/* Frame */}
      <RoundedBox args={[w, frameH, d]} radius={0.02} position={[0, frameH / 2, 0]}>
        <meshStandardMaterial {...materialProps} />
      </RoundedBox>
      {/* Mattress */}
      <RoundedBox args={[w * 0.95, 0.15, d * 0.92]} radius={0.04} position={[0, frameH + 0.075, 0.02]}>
        <meshStandardMaterial color="#F5F0E8" roughness={0.95} />
      </RoundedBox>
      {/* Headboard */}
      <RoundedBox args={[w, headH, 0.08]} radius={0.03} position={[0, frameH / 2 + headH / 2, -d / 2 + 0.04]}>
        <meshStandardMaterial {...materialProps} />
      </RoundedBox>
      {/* Pillows */}
      {[-0.25, 0.25].map((x, i) => (
        <RoundedBox key={i} args={[w * 0.3, 0.08, 0.2]} radius={0.03} position={[x * w, frameH + 0.19, -d * 0.3]}>
          <meshStandardMaterial color="#FFFFFF" roughness={0.95} />
        </RoundedBox>
      ))}
      {/* LED strip */}
      {hasLed && (
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[w + 0.02, 0.02, d + 0.02]} />
          <meshStandardMaterial color="#C8A45C" emissive="#C8A45C" emissiveIntensity={0.8} transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
}

// Storage / cabinet model
function StorageModel({ config }: { config: CustomConfig }) {
  const w = config.width / 100;
  const h = config.height / 100;
  const d = config.depth / 100;
  const color = WOOD_COLORS[config.woodType] || '#C4A35A';
  const finish = FINISH_PROPS[config.finish] || FINISH_PROPS.matte;

  const materialProps = {
    color,
    roughness: finish.roughness,
    metalness: finish.metalness,
  };

  const hasHandles = config.components.includes('handles');
  const hasMirror = config.components.includes('mirror');
  const hasLighting = config.components.includes('lighting');

  return (
    <group position={[0, -h / 2, 0]}>
      {/* Back panel */}
      <mesh position={[0, h / 2, -d / 2 + 0.01]}>
        <boxGeometry args={[w, h, 0.02]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      {/* Sides */}
      {[-1, 1].map(side => (
        <mesh key={side} position={[side * (w / 2 - 0.01), h / 2, 0]}>
          <boxGeometry args={[0.02, h, d]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      ))}
      {/* Top & bottom */}
      {[0, h].map((y, i) => (
        <mesh key={i} position={[0, y + 0.01, 0]}>
          <boxGeometry args={[w, 0.02, d]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      ))}
      {/* Shelves */}
      {[0.33, 0.66].map(frac => (
        <mesh key={frac} position={[0, h * frac, 0]}>
          <boxGeometry args={[w * 0.96, 0.015, d * 0.95]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      ))}
      {/* Doors */}
      {[-1, 1].map(side => (
        <RoundedBox key={side} args={[w / 2 - 0.02, h - 0.04, 0.02]} radius={0.005}
          position={[side * (w / 4), h / 2, d / 2 - 0.01]}>
          <meshStandardMaterial {...materialProps} color={new THREE.Color(color).offsetHSL(0, 0, 0.05).getStyle()} />
        </RoundedBox>
      ))}
      {/* Handles */}
      {hasHandles && [-1, 1].map(side => (
        <mesh key={`h${side}`} position={[side * 0.03, h / 2, d / 2 + 0.01]}>
          <cylinderGeometry args={[0.008, 0.008, 0.1, 8]} />
          <meshStandardMaterial color="#B8860B" metalness={0.9} roughness={0.15} />
        </mesh>
      ))}
      {/* Mirror */}
      {hasMirror && (
        <mesh position={[0, h / 2, d / 2 + 0.005]}>
          <planeGeometry args={[w * 0.35, h * 0.6]} />
          <meshStandardMaterial color="#E8E8E8" metalness={0.95} roughness={0.05} />
        </mesh>
      )}
      {/* Interior lighting */}
      {hasLighting && (
        <pointLight position={[0, h * 0.8, 0]} intensity={0.5} color="#FFF5E0" distance={1} />
      )}
    </group>
  );
}

// Generic box fallback (office etc)
function GenericModel({ config }: { config: CustomConfig }) {
  const w = config.width / 100;
  const h = config.height / 100;
  const d = config.depth / 100;
  const color = WOOD_COLORS[config.woodType] || '#C4A35A';
  const finish = FINISH_PROPS[config.finish] || FINISH_PROPS.matte;

  return (
    <group position={[0, -h / 2, 0]}>
      {/* Base/legs */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[w * 0.8, 0.08, d * 0.8]} />
        <meshStandardMaterial color={color} roughness={finish.roughness} metalness={0.3} />
      </mesh>
      {/* Body */}
      <RoundedBox args={[w, h * 0.85, d]} radius={0.02} position={[0, 0.08 + h * 0.425, 0]}>
        <meshStandardMaterial color={color} roughness={finish.roughness} metalness={finish.metalness} />
      </RoundedBox>
      {/* Top surface accent */}
      <mesh position={[0, h, 0]}>
        <boxGeometry args={[w * 1.02, 0.02, d * 1.02]} />
        <meshStandardMaterial color={color} roughness={finish.roughness * 0.7} metalness={finish.metalness + 0.1} />
      </mesh>
    </group>
  );
}

function FurnitureModel({ config, category }: { config: CustomConfig; category: Category }) {
  const groupRef = useRef<THREE.Group>(null);

  // Gentle idle rotation
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  const ModelComponent = useMemo(() => {
    switch (category) {
      case 'seating': return ChairModel;
      case 'tables': return TableModel;
      case 'beds': return BedModel;
      case 'storage': return StorageModel;
      default: return GenericModel;
    }
  }, [category]);

  return (
    <group ref={groupRef}>
      <ModelComponent config={config} />
    </group>
  );
}

interface Props {
  config: CustomConfig;
  category: Category;
}

const ProductViewer3D: React.FC<Props> = ({ config, category }) => {
  return (
    <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-secondary/20 border border-border/30">
      <Canvas
        camera={{ position: [2, 1.5, 2], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 8, 5]} intensity={1} castShadow />
        <directionalLight position={[-3, 4, -2]} intensity={0.3} />

        <FurnitureModel config={config} category={category} />

        <ContactShadows position={[0, -0.5, 0]} opacity={0.4} scale={4} blur={2.5} />
        <Environment preset="studio" />
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={1.5}
          maxDistance={6}
          minPolarAngle={Math.PI * 0.15}
          maxPolarAngle={Math.PI * 0.55}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
};

export default ProductViewer3D;
