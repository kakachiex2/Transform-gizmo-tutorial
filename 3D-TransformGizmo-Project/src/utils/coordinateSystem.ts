import * as THREE from 'three';

// Blender uses Z-up, Three.js uses Y-up
// The GLB export from Blender needs this correction
export const BLENDER_TO_THREEJS_ROTATION = new THREE.Euler(-Math.PI / 2, 0, 0);

export function convertBlenderToThreeJS(position: THREE.Vector3): THREE.Vector3 {
  return new THREE.Vector3(position.x, position.z, -position.y);
}

export function getLocalCameraPosition(
  cameraWorldPos: THREE.Vector3,
  gizmoWorldPos: THREE.Vector3,
  gizmoWorldQuat: THREE.Quaternion
): THREE.Vector3 {
  const local = cameraWorldPos.clone().sub(gizmoWorldPos);
  const inverseQuat = gizmoWorldQuat.clone().invert();
  local.applyQuaternion(inverseQuat);
  return local;
}

export function getMirrorFactors(localCameraPos: THREE.Vector3): {
  mirrorX: number;
  mirrorY: number;
  mirrorZ: number;
} {
  return {
    mirrorX: localCameraPos.x < 0 ? -1 : 1,
    mirrorY: localCameraPos.y < 0 ? -1 : 1,
    mirrorZ: localCameraPos.z < 0 ? -1 : 1,
  };
}

export function getViewSector(localCameraPos: THREE.Vector3): string {
  const absX = Math.abs(localCameraPos.x);
  const absY = Math.abs(localCameraPos.y);
  const absZ = Math.abs(localCameraPos.z);

  if (absX >= absY && absX >= absZ) {
    return localCameraPos.x > 0 ? '+X' : '-X';
  }
  if (absY >= absX && absY >= absZ) {
    return localCameraPos.y > 0 ? '+Y' : '-Y';
  }
  return localCameraPos.z > 0 ? '+Z' : '-Z';
}
