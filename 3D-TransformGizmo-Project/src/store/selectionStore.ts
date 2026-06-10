import { create } from 'zustand';

interface SelectionStore {
  selectedId: string | null;
  hoveredId: string | null;
  select: (id: string | null) => void;
  setHovered: (id: string | null) => void;
}

export const useSelectionStore = create<SelectionStore>((set) => ({
  selectedId: null,
  hoveredId: null,
  select: (id) => set({ selectedId: id }),
  setHovered: (id) => set({ hoveredId: id }),
}));
