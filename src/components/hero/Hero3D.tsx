"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

function ChakraTorusSculpture() {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Group>(null);

  // 24 spokes representing the Ashoka Chakra
  const spokes = useMemo(() => {
    const arr = [];
    const count = 24;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      arr.push({ angle, id: i });
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.25;
      meshRef.current.rotation.y += delta * 0.35;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 0.15;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <Float speed={2.5} rotationIntensity={0.6} floatIntensity={0.8}>
        {/* Central Ashoka Chakra Torus Knot */}
        <mesh ref={meshRef} scale={1.25}>
          <torusKnotGeometry args={[1.1, 0.32, 128, 32, 2, 3]} />
          <meshPhysicalMaterial
            roughness={0.15}
            metalness={0.85}
            clearcoat={1}
            clearcoatRoughness={0.1}
            color="#FAFAFA"
            emissive="#1E3A8A"
            emissiveIntensity={0.35}
            reflectivity={0.9}
            wireframe={false}
          />
        </mesh>

        {/* Outer 24-spoke Chakra Halo */}
        <group ref={ringRef} scale={1.8}>
          <mesh>
            <torusGeometry args={[1.35, 0.025, 16, 100]} />
            <meshStandardMaterial
              color="#3B82F6"
              emissive="#1E3A8A"
              emissiveIntensity={0.6}
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>

          {/* 24 Spoke rays */}
          {spokes.map((spoke) => (
            <mesh
              key={spoke.id}
              rotation={[0, 0, spoke.angle]}
              position={[0, 0, 0]}
            >
              <cylinderGeometry args={[0.012, 0.012, 1.3, 8]} />
              <meshBasicMaterial color="#60A5FA" transparent opacity={0.4} />
            </mesh>
          ))}

          {/* Central Sapphire Jewel Core */}
          <mesh position={[0, 0, 0]}>
            <octahedronGeometry args={[0.28, 2]} />
            <meshPhysicalMaterial
              color="#2563EB"
              emissive="#1E3A8A"
              emissiveIntensity={0.8}
              roughness={0.1}
              metalness={0.9}
            />
          </mesh>
        </group>
      </Float>
    </group>
  );
}

function OrbitingTricolorParticles() {
  const count = 45;
  const particles = useMemo(() => {
    const pts = [];
    const colors = ["#FF9933", "#FAFAFA", "#10B981", "#3B82F6"];
    for (let i = 0; i < count; i++) {
      const radius = 2.2 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 2;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const speed = 0.2 + Math.random() * 0.4;
      pts.push({ radius, theta, y, color, speed, size: 0.04 + Math.random() * 0.04 });
    }
    return pts;
  }, []);

  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {particles.map((p, idx) => (
        <mesh
          key={idx}
          position={[
            Math.cos(p.theta) * p.radius,
            p.y,
            Math.sin(p.theta) * p.radius,
          ]}
        >
          <sphereGeometry args={[p.size, 8, 8]} />
          <meshBasicMaterial color={p.color} />
        </mesh>
      ))}
    </group>
  );
}

export default function Hero3D() {
  return (
    <div className="w-full h-full min-h-[240px] sm:min-h-[320px] md:min-h-[440px] relative flex items-center justify-center">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ pointerEvents: "none" }}
      >
        <ambientLight intensity={0.6} />
        {/* Saffron Key Light (Top-Left) */}
        <pointLight position={[-4, 3, 3]} intensity={25} color="#FF9933" distance={12} />
        {/* India Green Fill Light (Bottom-Right) */}
        <pointLight position={[4, -3, 3]} intensity={25} color="#10B981" distance={12} />
        {/* Chakra Blue Center Glow */}
        <pointLight position={[0, 0, 2]} intensity={18} color="#3B82F6" distance={8} />

        <ChakraTorusSculpture />
        <OrbitingTricolorParticles />
      </Canvas>
    </div>
  );
}
