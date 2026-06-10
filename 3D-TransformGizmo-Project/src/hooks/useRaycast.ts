'use client';

import { useCallback, useRef } from 'react';
import * as THREE from 'three';
import { GizmoHandleType } from '@/types/gizmo';

export function useRaycast() {
  const raycasterRef = useRef(new THREE.Raycaster());

  const raycastObjects = useCallback(
    (pointer: THREE.Vector2, camera: THREE.Camera, objects: THREE.Object3D[]) => {
      raycasterRef.current.setFromCamera(pointer, camera);
      const intersects = raycasterRef.current.intersectObjects(objects, true);
      return intersects;
    },
    []
  );

  const raycastGizmo = useCallback(
    (pointer: THREE.Vector2, camera: THREE.Camera, gizmoRoot: THREE.Object3D) => {
      raycasterRef.current.setFromCamera(pointer, camera);
      const intersects = raycasterRef.current.intersectObjects(gizmoRoot.children, true);
      for (const hit of intersects) {
        let obj: THREE.Object3D | null = hit.object;
        while (obj) {
          const name = obj.name as GizmoHandleType;
          if (Object.values(GizmoHandleType).includes(name)) {
            return { handle: name, point: hit.point, distance: hit.distance, object: obj };
          }
          obj = obj.parent;
        }
      }
      return null;
    },
    []
  );

  const getPointer = useCallback((event: { clientX: number; clientY: number }, rect: DOMRect) => {
    return new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
  }, []);

  return { raycastObjects, raycastGizmo, getPointer };
}
