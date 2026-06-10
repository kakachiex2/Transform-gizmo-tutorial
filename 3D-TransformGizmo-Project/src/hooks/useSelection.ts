'use client';

import { useCallback } from 'react';
import { useSelectionStore } from '@/store/selectionStore';
import { useSceneStore } from '@/store/sceneStore';

export function useSelection() {
  const { selectedId, hoveredId, select, setHovered } = useSelectionStore();
  const objects = useSceneStore((s) => s.objects);

  const selectedObject = objects.find((o) => o.id === selectedId) ?? null;
  const hoveredObject = objects.find((o) => o.id === hoveredId) ?? null;

  const selectObject = useCallback(
    (id: string | null) => {
      select(id);
    },
    [select]
  );

  const deselectAll = useCallback(() => {
    select(null);
  }, [select]);

  return {
    selectedId,
    hoveredId,
    selectedObject,
    hoveredObject,
    selectObject,
    deselectAll,
    setHoveredObject: setHovered,
  };
}
