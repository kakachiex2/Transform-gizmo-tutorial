import * as THREE from 'three';

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function vectorToString(v: THREE.Vector3, decimals = 2): string {
  return `(${v.x.toFixed(decimals)}, ${v.y.toFixed(decimals)}, ${v.z.toFixed(decimals)})`;
}

export function eulerToString(e: THREE.Euler, decimals = 2): string {
  return `(${radiansToDegrees(e.x).toFixed(decimals)}°, ${radiansToDegrees(e.y).toFixed(decimals)}°, ${radiansToDegrees(e.z).toFixed(decimals)}°)`;
}

export function getCameraSector(cameraPos: THREE.Vector3, gizmoPos: THREE.Vector3): string {
  const local = cameraPos.clone().sub(gizmoPos);
  const absX = Math.abs(local.x);
  const absY = Math.abs(local.y);
  const absZ = Math.abs(local.z);
  const maxAbs = Math.max(absX, absY, absZ);
  let primary = '';
  if (maxAbs === absX) primary = local.x > 0 ? '+X' : '-X';
  else if (maxAbs === absY) primary = local.y > 0 ? '+Y' : '-Y';
  else primary = local.z > 0 ? '+Z' : '-Z';
  return primary;
}
