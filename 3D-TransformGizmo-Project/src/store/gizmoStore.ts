import { create } from 'zustand';
import * as THREE from 'three';
import { TransformMode, TransformSpace, GizmoHandleType, GizmoDragState } from '@/types/gizmo';

interface GizmoStore {
  /** The active transform mode during a drag (auto-detected from handle name) */
  activeMode: TransformMode | null;
  space: TransformSpace;
  dragState: GizmoDragState;
  hoveredHandle: GizmoHandleType | null;
  axisLock: { x: boolean; y: boolean; z: boolean };
  setActiveMode: (mode: TransformMode | null) => void;
  setSpace: (space: TransformSpace) => void;
  setDragState: (state: Partial<GizmoDragState>) => void;
  resetDragState: () => void;
  setHoveredHandle: (handle: GizmoHandleType | null) => void;
  toggleAxisLock: (axis: 'x' | 'y' | 'z') => void;
}

const initialDragState: GizmoDragState = {
  isDragging: false,
  activeHandle: null,
  startIntersection: null,
  startObjectPosition: null,
  startObjectRotation: null,
  startObjectScale: null,
  delta: null,
};

export const useGizmoStore = create<GizmoStore>((set) => ({
  activeMode: null,
  space: TransformSpace.WORLD,
  dragState: initialDragState,
  hoveredHandle: null,
  axisLock: { x: true, y: true, z: true },
  setActiveMode: (mode) => set({ activeMode: mode }),
  setSpace: (space) => set({ space }),
  setDragState: (partial) =>
    set((s) => ({ dragState: { ...s.dragState, ...partial } })),
  resetDragState: () => set({ dragState: initialDragState }),
  setHoveredHandle: (handle) => set({ hoveredHandle: handle }),
  toggleAxisLock: (axis) =>
    set((s) => ({
      axisLock: { ...s.axisLock, [axis]: !s.axisLock[axis] },
    })),
}));
