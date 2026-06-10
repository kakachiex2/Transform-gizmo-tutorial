'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useGizmoStore } from '@/store/gizmoStore';
import { useSelectionStore } from '@/store/selectionStore';
import { useSceneStore } from '@/store/sceneStore';
import {
  TransformMode,
  TransformSpace,
  GizmoHandleType,
  AXIS_COLORS_HOVER,
  getHandleMode,
} from '@/types/gizmo';

/**
 * COMBINED GIZMO: All handle types are visible simultaneously.
 * - Translate arrows (X/Y/Z) + plane handles (XY/XZ/YZ)
 * - Rotation arcs (X/Y/Z) + hit targets
 * - Scale cubes (X/Y/Z) + uniform scale center
 *
 * The transform mode is auto-detected from which handle the user clicks,
 * NOT from a mode switch. This creates a single universal gizmo like
 * Blender's combined transform widget.
 */

// ALL handles visible in the combined gizmo (except pivot)
const ALL_VISIBLE_HANDLES = new Set<string>([
  // Translate
  GizmoHandleType.TRANSLATE_X,
  GizmoHandleType.TRANSLATE_Y,
  GizmoHandleType.TRANSLATE_Z,
  GizmoHandleType.TRANSLATE_XY,
  GizmoHandleType.TRANSLATE_XZ,
  GizmoHandleType.TRANSLATE_YZ,
  // Rotate (visible arcs + invisible hit targets for better click area)
  GizmoHandleType.ROTATE_X,
  GizmoHandleType.ROTATE_Y,
  GizmoHandleType.ROTATE_Z,
  GizmoHandleType.ROTATE_X_HIT,
  GizmoHandleType.ROTATE_Y_HIT,
  GizmoHandleType.ROTATE_Z_HIT,
  // Scale
  GizmoHandleType.SCALE_X,
  GizmoHandleType.SCALE_Y,
  GizmoHandleType.SCALE_Z,
  GizmoHandleType.SCALE_UNIFORM,
]);

const HIT_HANDLES = new Set<string>([
  GizmoHandleType.ROTATE_X_HIT,
  GizmoHandleType.ROTATE_Y_HIT,
  GizmoHandleType.ROTATE_Z_HIT,
]);

const ALL_GIZMO_NAMES = new Set<string>(Object.values(GizmoHandleType) as string[]);

function hitToVisible(hit: string): string {
  switch (hit) {
    case GizmoHandleType.ROTATE_X_HIT: return GizmoHandleType.ROTATE_X;
    case GizmoHandleType.ROTATE_Y_HIT: return GizmoHandleType.ROTATE_Y;
    case GizmoHandleType.ROTATE_Z_HIT: return GizmoHandleType.ROTATE_Z;
    default: return hit;
  }
}

function getHandleAxisFromName(name: string): 'x' | 'y' | 'z' | 'xy' | 'xz' | 'yz' | 'uniform' {
  if (name.includes('_x_hit') || name === 'scale_x' || name === 'rotate_x' || name === 'translate_x') return 'x';
  if (name.includes('_y_hit') || name === 'scale_y' || name === 'rotate_y' || name === 'translate_y') return 'y';
  if (name.includes('_z_hit') || name === 'scale_z' || name === 'rotate_z' || name === 'translate_z') return 'z';
  if (name === 'translate_xy_plane') return 'xy';
  if (name === 'translate_xz_plane') return 'xz';
  if (name === 'translate_yz_plane') return 'yz';
  if (name === 'uniform_scale') return 'uniform';
  return 'x';
}

export function TransformGizmo() {
  const gltf = useGLTF('/3D-TransformGizmo.glb');
  const groupRef = useRef<THREE.Group>(null);

  // Store individual mesh references by handle name for direct access
  const meshMapRef = useRef<Map<string, THREE.Mesh>>(new Map());
  // Store original material colors by handle name (from GLB model)
  const originalColorsRef = useRef<Map<string, THREE.Color>>(new Map());
  // Track whether model has been initialized
  const initializedRef = useRef(false);
  // Track last hover to avoid redundant updates
  const lastHoverRef = useRef<string | null>(null);

  const space = useGizmoStore((s) => s.space);
  const hoveredHandle = useGizmoStore((s) => s.hoveredHandle);
  const selectedId = useSelectionStore((s) => s.selectedId);
  const objects = useSceneStore((s) => s.objects);
  const selectedObj = useMemo(() => objects.find((o) => o.id === selectedId), [objects, selectedId]);

  /**
   * Initialize the GLB model: clone, store references, set up materials
   * with original GLB colors preserved. ALL handles are visible.
   */
  useEffect(() => {
    if (!gltf.scene || initializedRef.current) return;
    initializedRef.current = true;

    const clone = gltf.scene.clone(true);

    // Clear maps
    meshMapRef.current.clear();
    originalColorsRef.current.clear();

    // Traverse and set up all meshes
    clone.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;

      const mesh = child as THREE.Mesh;
      const name = mesh.name;

      if (ALL_GIZMO_NAMES.has(name)) {
        // Extract the original color from the GLB material
        const origMat = mesh.material as THREE.MeshStandardMaterial;
        let originalColor: THREE.Color;

        if (origMat && origMat.color) {
          originalColor = origMat.color.clone();
        } else {
          const axis = getHandleAxisFromName(name);
          const fallbackColors: Record<string, string> = {
            x: '#E74559', y: '#86E7A4', z: '#6572E7',
            xy: '#E8A838', xz: '#A855F7', yz: '#14B8A6', uniform: '#D3E7A9',
          };
          originalColor = new THREE.Color(fallbackColors[axis] || '#ffffff');
        }

        // Store original color for hover restoration
        originalColorsRef.current.set(name, originalColor.clone());

        // Determine if this is a hit handle (invisible rotation target)
        const isHit = HIT_HANDLES.has(name);

        // Create gizmo-optimized material preserving original color
        const gizmoMat = new THREE.MeshStandardMaterial({
          color: originalColor,
          transparent: true,
          opacity: isHit ? 0 : 0.95,
          depthTest: false,
          depthWrite: false,
          side: THREE.DoubleSide,
          roughness: 0.35,
          metalness: 0.15,
        });
        mesh.material = gizmoMat;
        mesh.renderOrder = 999;

        // Store reference for direct access
        meshMapRef.current.set(name, mesh);

        // ALL handles visible in the combined gizmo
        mesh.visible = ALL_VISIBLE_HANDLES.has(name);
      } else if (name === 'pivot') {
        // Make the pivot center visible as a small white/gray sphere
        const pivotMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#E0E0E0'),
          transparent: true,
          opacity: 0.9,
          depthTest: false,
          depthWrite: false,
          roughness: 0.3,
          metalness: 0.2,
        });
        mesh.material = pivotMat;
        mesh.renderOrder = 999;
        mesh.visible = true;

        // Store pivot reference for hover handling
        meshMapRef.current.set('pivot', mesh);
        originalColorsRef.current.set('pivot', new THREE.Color('#E0E0E0'));
      }
    });

    if (groupRef.current) {
      groupRef.current.add(clone);
    }
  }, [gltf]);

  /**
   * Update hover highlights every frame using useFrame for reliability.
   * No mode switching needed - all handles are always visible.
   */
  useFrame(() => {
    const meshMap = meshMapRef.current;
    const originalColors = originalColorsRef.current;
    if (meshMap.size === 0) return;

    // Update hover highlights when hovered handle changes
    if (lastHoverRef.current !== hoveredHandle) {
      lastHoverRef.current = hoveredHandle;

      // Determine effective hovered handle (map _hit to visible)
      const effectiveHover = hoveredHandle && HIT_HANDLES.has(hoveredHandle)
        ? hitToVisible(hoveredHandle)
        : hoveredHandle;

      // Also detect the transform mode of the hovered handle
      const hoverMode = effectiveHover ? getHandleMode(effectiveHover as GizmoHandleType) : null;

      meshMap.forEach((mesh, name) => {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (!mat) return;

        // Pivot center: only handle hover highlight (no drag)
        if (name === 'pivot') {
          const originalColor = originalColors.get('pivot');
          if (effectiveHover === null) {
            // Nothing hovered — keep pivot at default
            if (originalColor) mat.color.copy(originalColor);
            mat.emissive.set('#000000');
            mat.emissiveIntensity = 0;
            mat.opacity = 0.9;
          }
          // When any handle is hovered, pivot stays at default (no highlight needed)
          return;
        }

        const isHit = HIT_HANDLES.has(name);
        const originalColor = originalColors.get(name);
        const axis = getHandleAxisFromName(name);
        const handleMode = getHandleMode(name as GizmoHandleType);

        if (isHit) {
          // Hit handles: normally invisible, show faintly when their arc is hovered
          const isHitHovered = effectiveHover === name || effectiveHover === hitToVisible(name);
          if (isHitHovered) {
            const hoverColor = new THREE.Color(AXIS_COLORS_HOVER[axis]);
            mat.color.copy(hoverColor);
            mat.emissive.copy(hoverColor);
            mat.emissiveIntensity = 0.4;
            mat.opacity = 0.3;
          } else {
            if (originalColor) mat.color.copy(originalColor);
            mat.emissive.set('#000000');
            mat.emissiveIntensity = 0;
            mat.opacity = 0;
          }
        } else {
          // Normal visible handles
          const isHovered = effectiveHover === name;
          if (isHovered) {
            const hoverColor = new THREE.Color(AXIS_COLORS_HOVER[axis]);
            mat.color.copy(hoverColor);
            mat.emissive.copy(hoverColor);
            mat.emissiveIntensity = 0.5;
            mat.opacity = 1;
          } else {
            // Restore original color
            if (originalColor) mat.color.copy(originalColor);
            mat.emissive.set('#000000');
            mat.emissiveIntensity = 0;
            mat.opacity = 0.95;
          }
        }
      });
    }

    // Sync gizmo position/rotation to selected object
    if (!groupRef.current) return;

    if (!selectedObj) {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;
    groupRef.current.position.copy(selectedObj.transform.position);

    // Scale gizmo to a proportional size relative to scene objects
    groupRef.current.scale.setScalar(0.5);

    if (space === TransformSpace.LOCAL) {
      groupRef.current.quaternion.copy(
        new THREE.Quaternion().setFromEuler(selectedObj.transform.rotation)
      );
    } else {
      groupRef.current.quaternion.identity();
    }
  });

  return <group ref={groupRef} name="gizmo_group" />;
}
