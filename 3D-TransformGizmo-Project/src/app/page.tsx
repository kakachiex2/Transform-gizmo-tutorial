'use client';

import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { Viewport } from '@/components/viewport/Viewport';
import { Toolbar, GRADIENT_PRESETS } from '@/components/ui/Toolbar';
import { Inspector } from '@/components/ui/Inspector';
import { StatusBar } from '@/components/ui/StatusBar';
import { DebugPanel } from '@/components/ui/DebugPanel';
import { useSceneStore } from '@/store/sceneStore';
import { useGizmoStore } from '@/store/gizmoStore';
import { useSelectionStore } from '@/store/selectionStore';

export default function Home() {
  const addObject = useSceneStore((s) => s.addObject);
  const select = useSelectionStore((s) => s.select);
  const [backgroundGradient, setBackgroundGradient] = useState(GRADIENT_PRESETS[0].value);

  // Initialize default scene objects
  useEffect(() => {
    const objects = [
      {
        id: 'cube_1',
        name: 'Cube',
        type: 'cube' as const,
        transform: {
          position: new THREE.Vector3(0, 0.5, 0),
          rotation: new THREE.Euler(0, 0, 0),
          quaternion: new THREE.Quaternion(),
          scale: new THREE.Vector3(1, 1, 1),
        },
        selected: false,
        visible: true,
      },
      {
        id: 'sphere_1',
        name: 'Sphere',
        type: 'sphere' as const,
        transform: {
          position: new THREE.Vector3(-2.5, 0.5, 1),
          rotation: new THREE.Euler(0, 0, 0),
          quaternion: new THREE.Quaternion(),
          scale: new THREE.Vector3(1, 1, 1),
        },
        selected: false,
        visible: true,
      },
      {
        id: 'cylinder_1',
        name: 'Cylinder',
        type: 'cylinder' as const,
        transform: {
          position: new THREE.Vector3(2.5, 0.5, 1),
          rotation: new THREE.Euler(0, 0, 0),
          quaternion: new THREE.Quaternion(),
          scale: new THREE.Vector3(1, 1, 1),
        },
        selected: false,
        visible: true,
      },
      {
        id: 'cone_1',
        name: 'Cone',
        type: 'cone' as const,
        transform: {
          position: new THREE.Vector3(-1.5, 0.5, -2),
          rotation: new THREE.Euler(0, 0, 0),
          quaternion: new THREE.Quaternion(),
          scale: new THREE.Vector3(1, 1, 1),
        },
        selected: false,
        visible: true,
      },
      {
        id: 'torus_1',
        name: 'Torus',
        type: 'torus' as const,
        transform: {
          position: new THREE.Vector3(1.5, 0.5, -2),
          rotation: new THREE.Euler(0, 0, 0),
          quaternion: new THREE.Quaternion(),
          scale: new THREE.Vector3(1, 1, 1),
        },
        selected: false,
        visible: true,
      },
    ];

    objects.forEach((obj) => addObject(obj));
  }, [addObject]);

  // Keyboard shortcuts (no mode switching - gizmo is universal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 'q':
          select(null);
          break;
        case 'shift':
          useSceneStore.getState().setSnapSettings({ snapEnabled: true });
          break;
        case 'delete':
        case 'backspace': {
          const selId = useSelectionStore.getState().selectedId;
          if (selId) {
            useSceneStore.getState().removeObject(selId);
            useSelectionStore.getState().select(null);
          }
          break;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        useSceneStore.getState().setSnapSettings({ snapEnabled: false });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [select]);

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: backgroundGradient }}>
      {/* 3D Viewport */}
      <Viewport backgroundGradient={backgroundGradient} />

      {/* UI Overlays */}
      <Toolbar currentGradient={backgroundGradient} onGradientChange={setBackgroundGradient} />
      <Inspector />
      <StatusBar />
      <DebugPanel />
    </div>
  );
}
