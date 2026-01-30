import { create } from "zustand";

interface DndState {
    activeDndId: string | null;
    dropTargetId: string | null;
    recentlyDraggedItem: number | null;

    actions: {
        setActiveDndId: (id: string | null) => void;
        setDropTargetId: (id: string | null) => void;
        setRecentlyDraggedItem: (itemId: number | null) => void;
    };
}

export const useDndStore = create<DndState>((set) => ({
    activeDndId: null,
    dropTargetId: null,
    recentlyDraggedItem: null,

    actions: {
        setActiveDndId: (id: string | null) => set({ activeDndId: id }),
        setDropTargetId: (id: string | null) => set({ dropTargetId: id }),
        setRecentlyDraggedItem: (itemId: number | null) => set({ recentlyDraggedItem: itemId }),
    },
}));
