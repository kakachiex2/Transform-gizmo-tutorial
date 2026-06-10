'use client';

import React, { useEffect, useCallback, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { TransformGizmo } from '@/components/gizmo/TransformGizmo';
import { Cube, Sphere, Cylinder, Cone, Torus } from '@/components/primitives';
import { useSceneStore } from '@/store/sceneStore';
import { useSelectionStore } from '@/store/selectionStore';
import { useGizmoStore } from '@/store/gizmoStore';
import { GizmoHandleType, TransformMode, getHandleMode } from '@/types/gizmo';
import {
  handleToAxis,
  computeTranslationDelta,
  computeRotationDelta,
  computeScaleDelta,
  getTranslationPlane,
} from '@/utils/transforms';

function SceneContent() {
  const objects = useSceneStore((s) => s.objects);
  const selectedId = useSelectionStore((s) => s.selectedId);
  const space = useGizmoStore((s) => s.space);
  const setHoveredHandle = useGizmoStore((s) => s.setHoveredHandle);
  const setDragState = useGizmoStore((s) => s.setDragState);
  const resetDragState = useGizmoStore((s) => s.resetDragState);
  const setActiveMode = useGizmoStore((s) => s.setActiveMode);
  const updateTransform = useSceneStore((s) => s.updateTransform);
  const snapSettings = useSceneStore((s) => s.snapSettings);

  const { camera, gl, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const pointer = useRef(new THREE.Vector2());
  const isDragging = useRef(false);
  const dragData = useRef<{
    handle: GizmoHandleType;
    mode: TransformMode;          // Auto-detected from handle name
    startIntersection: THREE.Vector3;
    startPosition: THREE.Vector3;
    startQuaternion: THREE.Quaternion;
    startScale: THREE.Vector3;
    dragPlane: THREE.Plane;
  } | null>(null);
  const isPointerOverGizmo = useRef(false);
  const altHeld = useRef(false);

  // Find a gizmo handle from intersected objects
  const findHandleFromIntersection = useCallback((intersects: THREE.Intersection[]): GizmoHandleType | null => {
    for (const hit of intersects) {
      let obj: THREE.Object3D | null = hit.object;
      while (obj) {
        const name = obj.name as GizmoHandleType;
        if (Object.values(GizmoHandleType).includes(name)) {
          return name;
        }
        obj = obj.parent;
      }
    }
    return null;
  }, []);

  // Set up DOM-level event handlers for gizmo interaction
  useEffect(() => {
    const canvas = gl.domElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        e.preventDefault();
        altHeld.current = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        altHeld.current = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const handlePointerDown = (event: PointerEvent) => {
      if (altHeld.current) return;
      if (event.button !== 0) return;

      const rect = canvas.getBoundingClientRect();
      pointer.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(pointer.current, camera);

      // Find the gizmo root group
      let gizmoRoot: THREE.Object3D | null = null;
      scene.traverse((child) => {
        if (child.name === '__gizmo_root__') gizmoRoot = child;
      });

      // Check if we clicked a gizmo handle
      if (gizmoRoot && selectedId) {
        const gizmoIntersects = raycaster.current.intersectObjects(gizmoRoot.children, true);
        const handle = findHandleFromIntersection(gizmoIntersects);

        if (handle) {
          event.preventDefault();
          event.stopPropagation();

          const obj = useSceneStore.getState().objects.find((o) => o.id === selectedId);
          if (!obj) return;

          // AUTO-DETECT the transform mode from the handle name
          const detectedMode = getHandleMode(handle);
          setActiveMode(detectedMode);

          const hitPoint = gizmoIntersects[0].point.clone();
          const objQuat = new THREE.Quaternion().setFromEuler(obj.transform.rotation);
          const dragPlane = new THREE.Plane();

          // Set up drag plane based on the auto-detected mode
          if (detectedMode === TransformMode.TRANSLATE) {
            const { normal, point } = getTranslationPlane(handle, space, objQuat, obj.transform.position);
            dragPlane.setFromNormalAndCoplanarPoint(normal, point);
          } else if (detectedMode === TransformMode.ROTATE) {
            const axis = handleToAxis(handle);
            let normal = axis.clone();
            if (space === 'local') {
              normal.applyQuaternion(objQuat);
            }
            dragPlane.setFromNormalAndCoplanarPoint(normal, obj.transform.position);
          } else {
            // Scale mode: camera-facing plane
            const camDir = new THREE.Vector3();
            camera.getWorldDirection(camDir);
            dragPlane.setFromNormalAndCoplanarPoint(camDir.negate(), obj.transform.position);
          }

          // Project the initial hit point onto the drag plane to prevent jump
          const projectedStart = new THREE.Vector3();
          raycaster.current.ray.intersectPlane(dragPlane, projectedStart);
          const startIntersection = projectedStart || hitPoint;

          isDragging.current = true;
          dragData.current = {
            handle,
            mode: detectedMode,
            startIntersection,
            startPosition: obj.transform.position.clone(),
            startQuaternion: objQuat,
            startScale: obj.transform.scale.clone(),
            dragPlane,
          };

          setDragState({
            isDragging: true,
            activeHandle: handle,
            startIntersection: { point: startIntersection, distance: gizmoIntersects[0].distance },
            startObjectPosition: obj.transform.position.clone(),
            startObjectRotation: objQuat,
            startObjectScale: obj.transform.scale.clone(),
            delta: new THREE.Vector3(),
          });

          canvas.setPointerCapture(event.pointerId);
          return;
        }
      }

      // If not clicking a gizmo handle, check scene objects for selection
      const allIntersects = raycaster.current.intersectObjects(scene.children, true);
      let clickedSceneObject = false;

      for (const hit of allIntersects) {
        let obj: THREE.Object3D | null = hit.object;
        while (obj) {
          if (obj.userData?.sceneObjectId) {
            clickedSceneObject = true;
            break;
          }
          obj = obj.parent;
        }
        if (clickedSceneObject) break;
      }

      if (!clickedSceneObject && !isPointerOverGizmo.current) {
        useSelectionStore.getState().select(null);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(pointer.current, camera);

      if (isDragging.current && dragData.current && selectedId) {
        if (altHeld.current) return;

        const ray = raycaster.current.ray;
        const { handle, mode, startIntersection, startPosition, startQuaternion, startScale, dragPlane } = dragData.current;
        const obj = useSceneStore.getState().objects.find((o) => o.id === selectedId);
        if (!obj) return;

        // Use the auto-detected mode from the handle, NOT a global mode
        if (mode === TransformMode.TRANSLATE) {
          const delta = computeTranslationDelta(
            handle, ray, dragPlane, startIntersection,
            space, startQuaternion,
            snapSettings.snapEnabled, snapSettings.translateSnap
          );
          if (delta) {
            const newPos = startPosition.clone().add(delta);
            updateTransform(selectedId, { position: newPos });
          }
        } else if (mode === TransformMode.ROTATE) {
          const angle = computeRotationDelta(
            handle, ray, startPosition, startIntersection,
            space, startQuaternion,
            snapSettings.snapEnabled, snapSettings.rotateSnap
          );
          const axis = handleToAxis(handle);
          let rotAxis = axis.clone();
          if (space === 'local') rotAxis.applyQuaternion(startQuaternion);
          const rotQuat = new THREE.Quaternion().setFromAxisAngle(rotAxis, angle);
          const newQuat = startQuaternion.clone().premultiply(rotQuat);
          const newEuler = new THREE.Euler().setFromQuaternion(newQuat);
          updateTransform(selectedId, { rotation: newEuler, quaternion: newQuat });
        } else if (mode === TransformMode.SCALE) {
          const newScale = computeScaleDelta(
            handle, ray, dragPlane,
            startPosition,
            startIntersection,
            startScale,
            space,
            startQuaternion,
            snapSettings.snapEnabled, snapSettings.scaleSnap
          );
          if (newScale) {
            updateTransform(selectedId, { scale: newScale });
          }
        }
      } else if (!altHeld.current) {
        // Hover detection on gizmo handles
        let gizmoRoot: THREE.Object3D | null = null;
        scene.traverse((child) => {
          if (child.name === '__gizmo_root__') gizmoRoot = child;
        });

        if (gizmoRoot) {
          const gizmoIntersects = raycaster.current.intersectObjects(gizmoRoot.children, true);
          const handle = findHandleFromIntersection(gizmoIntersects);
          setHoveredHandle(handle);
          isPointerOverGizmo.current = handle !== null;
        }
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (isDragging.current) {
        isDragging.current = false;
        dragData.current = null;
        resetDragState();
        setActiveMode(null);
        try {
          canvas.releasePointerCapture(event.pointerId);
        } catch {}
      }
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    camera, gl, scene, selectedId, space, snapSettings,
    setHoveredHandle, setDragState, resetDragState, setActiveMode, updateTransform,
    findHandleFromIntersection,
  ]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} />
      <directionalLight position={[-3, 4, -2]} intensity={0.3} />
      <hemisphereLight args={['#446688', '#223344', 0.3]} />

      {/* Grid */}
      <Grid
        args={[20, 20]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#2A3445"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#3D4F65"
        fadeDistance={30}
        fadeStrength={1}
        infiniteGrid
        position={[0, -0.01, 0]}
      />

      {/* Ground plane - subtle dark floor that blends with gradient background */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#1A1F2B" transparent opacity={0.4} />
      </mesh>

      {/* Axes helper */}
      <axesHelper args={[2]} />

      {/* Scene objects */}
      {objects.map((obj) => {
        switch (obj.type) {
          case 'cube': return <Cube key={obj.id} id={obj.id} />;
          case 'sphere': return <Sphere key={obj.id} id={obj.id} />;
          case 'cylinder': return <Cylinder key={obj.id} id={obj.id} />;
          case 'cone': return <Cone key={obj.id} id={obj.id} />;
          case 'torus': return <Torus key={obj.id} id={obj.id} />;
          default: return null;
        }
      })}

      {/* Combined Transform Gizmo */}
      <group name="__gizmo_root__">
        <TransformGizmo />
      </group>
    </>
  );
}

/**
 * Alt-key OrbitControls for camera navigation.
 */
function AltOrbitControls() {
  const controlsRef = useRef<any>(null);
  const [altHeld, setAltHeld] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        e.preventDefault();
        setAltHeld(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setAltHeld(false);
      }
    };
    const handleBlur = () => setAltHeld(false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enabled={altHeld}
      enableDamping
      dampingFactor={0.1}
      minDistance={2}
      maxDistance={50}
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
    />
  );
}

export function Viewport({ backgroundGradient }: { backgroundGradient?: string }) {
  return (
    <Canvas
      camera={{ position: [5, 4, 5], fov: 50, near: 0.1, far: 1000 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: backgroundGradient || '#1E2532' }}
    >
      <SceneContent />
      <AltOrbitControls />
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport
          axisColors={['#E74C3C', '#2ECC71', '#3498DB']}
          labelColor="white"
        />
      </GizmoHelper>
    </Canvas>
  );
}
