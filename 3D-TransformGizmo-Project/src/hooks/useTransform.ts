'use client';

import { useCallback } from 'react';
import { useGizmoStore } from '@/store/gizmoStore';
import { useSceneStore } from '@/store/sceneStore';
import { useSelectionStore } from '@/store/selectionStore';
import { TransformMode, TransformSpace } from '@/types/gizmo';
import * as THREE from 'three';

export function useTransform() {
  const { mode, space, setMode, setSpace } = useGizmoStore();
  const { updateTransform } = useSceneStore();
  const { selectedId } = useSelectionStore();

  const applyTranslation = useCallback(
    (delta: THREE.Vector3) => {
      if (!selectedId) return;
      const obj = useSceneStore.getState().getObject(selectedId);
      if (!obj) return;
      const newPos = obj.transform.position.clone().add(delta);
      updateTransform(selectedId, {
        position: newPos,
        quaternion: new THREE.Quaternion().setFromEuler(obj.transform.rotation),
      });
    },
    [selectedId, updateTransform]
  );

  const applyRotation = useCallback(
    (angle: number, axis: THREE.Vector3) => {
      if (!selectedId) return;
      const obj = useSceneStore.getState().getObject(selectedId);
      if (!obj) return;
      const rotQuat = new THREE.Quaternion().setFromAxisAngle(axis, angle);
      const currentQuat = new THREE.Quaternion().setFromEuler(obj.transform.rotation);
      const newQuat = currentQuat.premultiply(rotQuat);
      const newEuler = new THREE.Euler().setFromQuaternion(newQuat);
      updateTransform(selectedId, {
        rotation: newEuler,
        quaternion: newQuat,
      });
    },
    [selectedId, updateTransform]
  );

  const applyScale = useCallback(
    (newScale: THREE.Vector3) => {
      if (!selectedId) return;
      updateTransform(selectedId, { scale: newScale });
    },
    [selectedId, updateTransform]
  );

  return {
    mode,
    space,
    setMode,
    setSpace,
    applyTranslation,
    applyRotation,
    applyScale,
  };
}
