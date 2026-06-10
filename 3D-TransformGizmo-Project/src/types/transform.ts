import * as THREE from 'three';
import { TransformMode, TransformSpace } from './gizmo';

export interface TransformState {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
}

export interface SceneObject {
  id: string;
  name: string;
  type: 'cube' | 'sphere' | 'cylinder' | 'cone' | 'torus';
  transform: TransformState;
  selected: boolean;
  visible: boolean;
}

export interface SnapSettings {
  translateSnap: number;
  rotateSnap: number;
  scaleSnap: number;
  snapEnabled: boolean;
}

export const DEFAULT_SNAP: SnapSettings = {
  translateSnap: 0.5,
  rotateSnap: 15,
  scaleSnap: 0.1,
  snapEnabled: false,
};

export const ROTATE_SNAP_ANGLES = [5, 15, 45, 90] as const;
