import { create } from 'zustand';
import * as THREE from 'three';
import { SceneObject, SnapSettings, DEFAULT_SNAP } from '@/types/transform';

interface SceneStore {
  objects: SceneObject[];
  addObject: (obj: SceneObject) => void;
  removeObject: (id: string) => void;
  updateTransform: (id: string, partial: Partial<SceneObject['transform']>) => void;
  getObject: (id: string) => SceneObject | undefined;
  snapSettings: SnapSettings;
  setSnapSettings: (partial: Partial<SnapSettings>) => void;
  toggleSnap: () => void;
}

export const useSceneStore = create<SceneStore>((set, get) => ({
  objects: [],
  addObject: (obj) => set((s) => ({ objects: [...s.objects, obj] })),
  removeObject: (id) => set((s) => ({ objects: s.objects.filter((o) => o.id !== id) })),
  updateTransform: (id, partial) =>
    set((s) => ({
      objects: s.objects.map((o) =>
        o.id === id
          ? { ...o, transform: { ...o.transform, ...partial } }
          : o
      ),
    })),
  getObject: (id) => get().objects.find((o) => o.id === id),
  snapSettings: DEFAULT_SNAP,
  setSnapSettings: (partial) =>
    set((s) => ({ snapSettings: { ...s.snapSettings, ...partial } })),
  toggleSnap: () =>
    set((s) => ({ snapSettings: { ...s.snapSettings, snapEnabled: !s.snapSettings.snapEnabled } })),
}));
