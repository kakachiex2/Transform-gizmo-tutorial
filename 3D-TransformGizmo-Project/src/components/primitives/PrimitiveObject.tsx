'use client';

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSelectionStore } from '@/store/selectionStore';
import { useSceneStore } from '@/store/sceneStore';

interface PrimitiveProps {
  id: string;
  geometry: THREE.BufferGeometry;
  color: string;
}

export function PrimitiveObject({ id, geometry, color }: PrimitiveProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const selectedId = useSelectionStore((s) => s.selectedId);
  const hoveredId = useSelectionStore((s) => s.hoveredId);
  const select = useSelectionStore((s) => s.select);
  const setHovered = useSelectionStore((s) => s.setHovered);
  const obj = useSceneStore((s) => s.objects.find((o) => o.id === id));

  const isSelected = selectedId === id;
  const isHovered = hoveredId === id;

  useFrame(() => {
    if (!meshRef.current || !obj) return;
    meshRef.current.position.copy(obj.transform.position);
    meshRef.current.rotation.copy(obj.transform.rotation);
    meshRef.current.scale.copy(obj.transform.scale);
  });

  return (
    <group userData={{ sceneObjectId: id }}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        onClick={(e) => {
          e.stopPropagation();
          select(id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(id);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(null);
          document.body.style.cursor = 'default';
        }}
      >
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.75}
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>
      {/* Selection wireframe outline */}
      {isSelected && obj && (
        <mesh
          position={obj.transform.position}
          rotation={obj.transform.rotation}
          scale={obj.transform.scale.clone().multiplyScalar(1.02)}
          geometry={geometry}
        >
          <meshBasicMaterial
            color="#4FC3F7"
            wireframe
            transparent
            opacity={0.6}
            depthTest={false}
          />
        </mesh>
      )}
      {/* Hover wireframe outline */}
      {!isSelected && isHovered && obj && (
        <mesh
          position={obj.transform.position}
          rotation={obj.transform.rotation}
          scale={obj.transform.scale.clone().multiplyScalar(1.015)}
          geometry={geometry}
        >
          <meshBasicMaterial
            color="#81D4FA"
            wireframe
            transparent
            opacity={0.35}
            depthTest={false}
          />
        </mesh>
      )}
    </group>
  );
}

export function Cube({ id }: { id: string }) {
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  return <PrimitiveObject id={id} geometry={geo} color="#5C6BC0" />;
}

export function Sphere({ id }: { id: string }) {
  const geo = useMemo(() => new THREE.SphereGeometry(0.5, 32, 32), []);
  return <PrimitiveObject id={id} geometry={geo} color="#66BB6A" />;
}

export function Cylinder({ id }: { id: string }) {
  const geo = useMemo(() => new THREE.CylinderGeometry(0.4, 0.4, 1, 32), []);
  return <PrimitiveObject id={id} geometry={geo} color="#EF5350" />;
}

export function Cone({ id }: { id: string }) {
  const geo = useMemo(() => new THREE.ConeGeometry(0.4, 1, 32), []);
  return <PrimitiveObject id={id} geometry={geo} color="#FFA726" />;
}

export function Torus({ id }: { id: string }) {
  const geo = useMemo(() => new THREE.TorusGeometry(0.4, 0.15, 16, 48), []);
  return <PrimitiveObject id={id} geometry={geo} color="#AB47BC" />;
}
