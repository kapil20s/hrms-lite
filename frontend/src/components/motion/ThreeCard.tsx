import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, Float, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";
import type { ReactNode } from "react";

interface GlowingMeshProps {
  color: string;
  position?: [number, number, number];
}

function GlowingMesh({ color, position = [0, 0, 0] }: GlowingMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const threeColor = useMemo(() => new THREE.Color(color), [color]);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.15;
  });

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <RoundedBox
        ref={meshRef}
        args={[2.2, 2.2, 0.3]}
        radius={0.15}
        smoothness={4}
        position={position}
      >
        <MeshTransmissionMaterial
          backside
          samples={6}
          resolution={512}
          thickness={0.3}
          roughness={0.1}
          clearcoat={0.2}
          clearcoatRoughness={0.1}
          transmission={0.95}
          chromaticAberration={0.03}
          anisotropy={0.2}
          color={threeColor}
          distortion={0.1}
          distortionScale={0.2}
          temporalDistortion={0.1}
        />
      </RoundedBox>
    </Float>
  );
}

// Floating particles around the card
function Particles({ color, count = 12 }: { color: string; count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const threeColor = useMemo(() => new THREE.Color(color), [color]);

  const positions = useMemo(() => {
    const arr: { x: number; y: number; z: number; speed: number }[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 4,
        z: (Math.random() - 0.5) * 2,
        speed: 0.5 + Math.random() * 1.5,
      });
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    positions.forEach((p, i) => {
      const t = state.clock.elapsedTime * p.speed;
      dummy.position.set(
        p.x + Math.sin(t * 0.5) * 0.3,
        p.y + Math.cos(t * 0.7) * 0.3,
        p.z + Math.sin(t * 0.3) * 0.2
      );
      dummy.scale.setScalar(0.02 + Math.sin(t) * 0.01);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color={threeColor} transparent opacity={0.6} />
    </instancedMesh>
  );
}

interface ThreeCardProps {
  color: string;
  children: ReactNode;
  className?: string;
}

export function ThreeCard({ color, children, className }: ThreeCardProps) {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazy-mount Canvas via IntersectionObserver to avoid exhausting WebGL contexts (browser limit: ~8-16)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={`relative group ${className ?? ""}`}>
      <div className="absolute inset-0 overflow-hidden rounded-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none">
        {visible && (
          <Canvas
            camera={{ position: [0, 0, 4], fov: 45 }}
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
            frameloop="demand"
            style={{ background: "transparent" }}
            onCreated={({ gl }) => {
              const dispose = () => {
                gl.dispose();
                gl.forceContextLoss();
              };
              gl.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault());
              return dispose;
            }}
          >
            <CanvasContent color={color} />
          </Canvas>
        )}
      </div>
      {/* Content overlay */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

function CanvasContent({ color }: { color: string }) {
  const frameRef = useRef(false);
  useFrame(({ invalidate }) => {
    if (!frameRef.current) {
      frameRef.current = true;
    }
    invalidate();
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-3, -3, 2]} intensity={0.4} color={color} />
      <GlowingMesh color={color} />
      <Particles color={color} />
    </>
  );
}
