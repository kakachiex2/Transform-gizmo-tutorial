import * as THREE from 'three';

export enum TransformMode {
  TRANSLATE = 'translate',
  ROTATE = 'rotate',
  SCALE = 'scale',
}

export enum TransformSpace {
  LOCAL = 'local',
  WORLD = 'world',
}

// IMPORTANT: These must exactly match the GLB mesh node names from Blender
// Verified: all 17 nodes in 3D-TransformGizmo.glb use these exact names
export enum GizmoHandleType {
  TRANSLATE_X = 'translate_x',
  TRANSLATE_Y = 'translate_y',
  TRANSLATE_Z = 'translate_z',
  TRANSLATE_XY = 'translate_xy_plane',
  TRANSLATE_XZ = 'translate_xz_plane',
  TRANSLATE_YZ = 'translate_yz_plane',
  ROTATE_X = 'rotate_x',
  ROTATE_Y = 'rotate_y',
  ROTATE_Z = 'rotate_z',
  ROTATE_X_HIT = 'rotate_x_hit',
  ROTATE_Y_HIT = 'rotate_y_hit',
  ROTATE_Z_HIT = 'rotate_z_hit',
  SCALE_X = 'scale_x',
  SCALE_Y = 'scale_y',
  SCALE_Z = 'scale_z',
  SCALE_UNIFORM = 'uniform_scale',
}

export interface GizmoDragState {
  isDragging: boolean;
  activeHandle: GizmoHandleType | null;
  startIntersection: { point: THREE.Vector3; distance: number } | null;
  startObjectPosition: THREE.Vector3 | null;
  startObjectRotation: THREE.Quaternion | null;
  startObjectScale: THREE.Vector3 | null;
  delta: THREE.Vector3 | null;
}

/**
 * Original colors from the GLB model's materials (Blender source).
 * These are the authentic colors designed for the gizmo in Blender.
 *
 * GLB Material Mapping:
 *   X-Axis_Mat → #E74559 (Red)
 *   Y-Axis_Mat → #86E7A4 (Green)
 *   Z-Axis_Mat → #6572E7 (Blue/Purple)
 *   Material.005 → #D3E7A9 (Yellow-green, for uniform scale)
 */
export const GLB_ORIGINAL_COLORS = {
  x: '#E74559',
  y: '#86E7A4',
  z: '#6572E7',
  xy: '#E8A838',
  xz: '#A855F7',
  yz: '#14B8A6',
  uniform: '#D3E7A9',
} as const;

/**
 * Standard axis colors used as fallback or for UI consistency.
 */
export const AXIS_COLORS = {
  x: '#E74C3C',
  y: '#2ECC71',
  z: '#3498DB',
  xy: '#E8A838',
  xz: '#A855F7',
  yz: '#14B8A6',
  uniform: '#FFFFFF',
} as const;

/**
 * Bright hover highlight colors for each axis.
 */
export const AXIS_COLORS_HOVER = {
  x: '#FF6B6B',
  y: '#5FE08B',
  z: '#5DADE2',
  xy: '#F5C563',
  xz: '#C084FC',
  yz: '#2DD4BF',
  uniform: '#F0F0F0',
} as const;

export function getHandleAxis(handle: GizmoHandleType): 'x' | 'y' | 'z' | 'xy' | 'xz' | 'yz' | 'uniform' {
  if (handle === GizmoHandleType.TRANSLATE_X || handle === GizmoHandleType.ROTATE_X || handle === GizmoHandleType.ROTATE_X_HIT || handle === GizmoHandleType.SCALE_X) return 'x';
  if (handle === GizmoHandleType.TRANSLATE_Y || handle === GizmoHandleType.ROTATE_Y || handle === GizmoHandleType.ROTATE_Y_HIT || handle === GizmoHandleType.SCALE_Y) return 'y';
  if (handle === GizmoHandleType.TRANSLATE_Z || handle === GizmoHandleType.ROTATE_Z || handle === GizmoHandleType.ROTATE_Z_HIT || handle === GizmoHandleType.SCALE_Z) return 'z';
  if (handle === GizmoHandleType.TRANSLATE_XY) return 'xy';
  if (handle === GizmoHandleType.TRANSLATE_XZ) return 'xz';
  if (handle === GizmoHandleType.TRANSLATE_YZ) return 'yz';
  return 'uniform';
}

export function getHandleMode(handle: GizmoHandleType): TransformMode {
  if (handle.startsWith('translate')) return TransformMode.TRANSLATE;
  if (handle.startsWith('rotate')) return TransformMode.ROTATE;
  if (handle.startsWith('scale') || handle === GizmoHandleType.SCALE_UNIFORM) return TransformMode.SCALE;
  return TransformMode.TRANSLATE;
}
