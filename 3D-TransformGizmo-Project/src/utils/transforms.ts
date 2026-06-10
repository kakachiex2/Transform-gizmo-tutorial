import * as THREE from 'three';
import { TransformMode, TransformSpace, GizmoHandleType } from '@/types/gizmo';
import { roundToStep } from './math';

export function getTranslationPlane(
  handle: GizmoHandleType,
  space: TransformSpace,
  objectQuat: THREE.Quaternion,
  objectPosition: THREE.Vector3
): { normal: THREE.Vector3; point: THREE.Vector3 } {
  let normal: THREE.Vector3;

  switch (handle) {
    case GizmoHandleType.TRANSLATE_XY:
      normal = new THREE.Vector3(0, 0, 1);  // XY plane faces Z
      break;
    case GizmoHandleType.TRANSLATE_XZ:
      normal = new THREE.Vector3(0, 1, 0);  // XZ plane faces Y
      break;
    case GizmoHandleType.TRANSLATE_YZ:
      normal = new THREE.Vector3(1, 0, 0);  // YZ plane faces X
      break;
    default: {
      // Single axis - pick a plane that faces the camera
      // Use the axis that is most perpendicular to the drag axis
      const axis = handleToAxis(handle);
      if (Math.abs(axis.y) > 0.9) {
        normal = new THREE.Vector3(0, 0, 1);
      } else {
        normal = new THREE.Vector3(0, 1, 0);
      }
      break;
    }
  }

  if (space === TransformSpace.LOCAL) {
    normal.applyQuaternion(objectQuat);
  }

  return { normal, point: objectPosition.clone() };
}

export function handleToAxis(handle: GizmoHandleType): THREE.Vector3 {
  switch (handle) {
    case GizmoHandleType.TRANSLATE_X:
    case GizmoHandleType.ROTATE_X:
    case GizmoHandleType.ROTATE_X_HIT:
    case GizmoHandleType.SCALE_X:
      return new THREE.Vector3(1, 0, 0);
    case GizmoHandleType.TRANSLATE_Y:
    case GizmoHandleType.ROTATE_Y:
    case GizmoHandleType.ROTATE_Y_HIT:
    case GizmoHandleType.SCALE_Y:
      return new THREE.Vector3(0, 1, 0);
    case GizmoHandleType.TRANSLATE_Z:
    case GizmoHandleType.ROTATE_Z:
    case GizmoHandleType.ROTATE_Z_HIT:
    case GizmoHandleType.SCALE_Z:
      return new THREE.Vector3(0, 0, 1);
    default:
      return new THREE.Vector3(0, 1, 0);
  }
}

/**
 * Compute translation delta relative to the INITIAL intersection point.
 * This prevents the "jump" glitch on the first frame of dragging.
 *
 * Key fix: The drag plane is positioned at the object's position (not origin),
 * and the initial intersection point is projected onto this plane to ensure
 * the first frame delta is exactly zero.
 */
export function computeTranslationDelta(
  handle: GizmoHandleType,
  ray: THREE.Ray,
  plane: THREE.Plane,
  startIntersection: THREE.Vector3,  // Where the ray first hit the drag plane
  space: TransformSpace,
  objectQuat: THREE.Quaternion,
  snapEnabled: boolean,
  snapStep: number
): THREE.Vector3 | null {
  const currentIntersection = new THREE.Vector3();
  const hit = ray.intersectPlane(plane, currentIntersection);
  if (!hit) return null;

  // Delta from initial intersection to current intersection
  const rawDelta = currentIntersection.clone().sub(startIntersection);

  const axis = handleToAxis(handle);
  const isPlane = handle === GizmoHandleType.TRANSLATE_XY ||
    handle === GizmoHandleType.TRANSLATE_XZ ||
    handle === GizmoHandleType.TRANSLATE_YZ;

  let delta: THREE.Vector3;

  if (!isPlane) {
    // Single axis: project raw delta onto axis direction
    if (space === TransformSpace.LOCAL) {
      const localAxis = axis.clone().applyQuaternion(objectQuat);
      const projected = rawDelta.dot(localAxis);
      delta = localAxis.clone().multiplyScalar(projected);
    } else {
      const projected = rawDelta.dot(axis);
      delta = axis.clone().multiplyScalar(projected);
    }
  } else {
    // Plane: remove the component along the plane normal
    const planeNormal = plane.normal.clone();
    const normalComponent = rawDelta.dot(planeNormal);
    delta = rawDelta.clone().sub(planeNormal.multiplyScalar(normalComponent));
  }

  if (snapEnabled && snapStep > 0) {
    delta.x = roundToStep(delta.x, snapStep);
    delta.y = roundToStep(delta.y, snapStep);
    delta.z = roundToStep(delta.z, snapStep);
  }

  return delta;
}

/**
 * Compute rotation delta as an angle from the start intersection to current.
 * Uses vector angle from pivot point to avoid jump glitches.
 */
export function computeRotationDelta(
  handle: GizmoHandleType,
  ray: THREE.Ray,
  pivotPoint: THREE.Vector3,
  startIntersection: THREE.Vector3,
  space: TransformSpace,
  objectQuat: THREE.Quaternion,
  snapEnabled: boolean,
  snapAngle: number
): number {
  const planeNormal = handleToAxis(handle).clone();
  if (space === TransformSpace.LOCAL) {
    planeNormal.applyQuaternion(objectQuat);
  }

  const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, pivotPoint);
  const currentIntersection = new THREE.Vector3();
  const hit = ray.intersectPlane(plane, currentIntersection);
  if (!hit) return 0;

  const startVec = startIntersection.clone().sub(pivotPoint).normalize();
  const currentVec = currentIntersection.clone().sub(pivotPoint).normalize();

  // Check for degenerate vectors (when intersection is at pivot)
  if (startVec.lengthSq() < 0.0001 || currentVec.lengthSq() < 0.0001) return 0;

  let angle = startVec.angleTo(currentVec);
  const cross = new THREE.Vector3().crossVectors(startVec, currentVec);
  if (cross.dot(planeNormal) < 0) {
    angle = -angle;
  }

  if (snapEnabled && snapAngle > 0) {
    const snapRad = (snapAngle * Math.PI) / 180;
    angle = roundToStep(angle, snapRad);
  }

  return angle;
}

/**
 * Get the drag plane for scale operations.
 * Uses a camera-facing plane through the object's position for best results.
 */
export function getScalePlane(
  camera: THREE.Camera,
  objectPosition: THREE.Vector3
): THREE.Plane {
  const camDir = new THREE.Vector3();
  camera.getWorldDirection(camDir);
  const plane = new THREE.Plane();
  plane.setFromNormalAndCoplanarPoint(camDir.negate(), objectPosition);
  return plane;
}

/**
 * Compute scale delta using pivot-based distance ratio.
 *
 * Key fix for uniform scale: Use the distance from the pivot (object position)
 * to the intersection points, not the absolute position length.
 * This ensures uniform scale works correctly regardless of object position.
 */
export function computeScaleDelta(
  handle: GizmoHandleType,
  ray: THREE.Ray,
  plane: THREE.Plane,
  pivotPoint: THREE.Vector3,       // Object's position (pivot center)
  startIntersection: THREE.Vector3, // Where the ray first hit
  startScale: THREE.Vector3,
  space: TransformSpace,
  objectQuat: THREE.Quaternion,
  snapEnabled: boolean,
  snapStep: number
): THREE.Vector3 | null {
  const currentIntersection = new THREE.Vector3();
  const hit = ray.intersectPlane(plane, currentIntersection);
  if (!hit) return null;

  // For single-axis scale, project the delta onto the scale axis
  const axis = handleToAxis(handle);

  if (handle === GizmoHandleType.SCALE_UNIFORM) {
    // Uniform scale: use distance ratio from pivot to intersection
    const startDist = startIntersection.distanceTo(pivotPoint);
    const currentDist = currentIntersection.distanceTo(pivotPoint);

    // Avoid division by zero or near-zero
    const scaleFactor = startDist > 0.001 ? currentDist / startDist : 1;

    const newScale = new THREE.Vector3(
      startScale.x * scaleFactor,
      startScale.y * scaleFactor,
      startScale.z * scaleFactor
    );

    if (snapEnabled && snapStep > 0) {
      newScale.x = roundToStep(newScale.x, snapStep);
      newScale.y = roundToStep(newScale.y, snapStep);
      newScale.z = roundToStep(newScale.z, snapStep);
    }

    // Clamp minimum scale
    newScale.x = Math.max(0.01, newScale.x);
    newScale.y = Math.max(0.01, newScale.y);
    newScale.z = Math.max(0.01, newScale.z);

    return newScale;
  } else {
    // Single-axis scale: project delta onto axis direction
    const rawDelta = currentIntersection.clone().sub(startIntersection);
    let axisDir: THREE.Vector3;

    if (space === TransformSpace.LOCAL) {
      axisDir = axis.clone().applyQuaternion(objectQuat);
    } else {
      axisDir = axis.clone();
    }

    // Project the delta onto the axis
    const projected = rawDelta.dot(axisDir);

    // Calculate scale factor based on initial distance along axis
    const startProjected = startIntersection.clone().sub(pivotPoint).dot(axisDir);
    const currentProjected = projected + startProjected;

    // Use ratio of projections for single-axis scale
    const scaleFactor = Math.abs(startProjected) > 0.001
      ? currentProjected / startProjected
      : 1;

    const newScale = startScale.clone();

    if (axis.x > 0.5) newScale.x = Math.max(0.01, startScale.x * scaleFactor);
    else if (axis.y > 0.5) newScale.y = Math.max(0.01, startScale.y * scaleFactor);
    else if (axis.z > 0.5) newScale.z = Math.max(0.01, startScale.z * scaleFactor);

    if (snapEnabled && snapStep > 0) {
      newScale.x = roundToStep(newScale.x, snapStep);
      newScale.y = roundToStep(newScale.y, snapStep);
      newScale.z = roundToStep(newScale.z, snapStep);
    }

    return newScale;
  }
}
