import { create } from 'zustand';

export type WorkspaceMode = 'plan' | 'pack' | 'review';
export type CatalogTab = 'catalog' | 'my-gear';

export interface WorkspaceState {
  /* Panel state */
  catalogOpen: boolean;
  inspectorOpen: boolean;
  toggleCatalog: () => void;
  toggleInspector: () => void;

  /* Mode */
  mode: WorkspaceMode;
  setMode: (mode: WorkspaceMode) => void;

  /* Selection */
  selectedNodeId: number | null;
  setSelectedNode: (id: number | null) => void;

  /* Catalog tab */
  catalogTab: CatalogTab;
  setCatalogTab: (tab: CatalogTab) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()((set) => ({
  /* Panel — plan mode opens catalog + inspector by default */
  catalogOpen: true,
  inspectorOpen: true,
  toggleCatalog: () => set((s) => ({ catalogOpen: !s.catalogOpen })),
  toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),

  /* Mode */
  mode: 'plan',
  setMode: (mode) =>
    set(() => {
      /* Auto-panel behavior per mode */
      switch (mode) {
        case 'plan':
          return { mode, catalogOpen: true, inspectorOpen: true };
        case 'pack':
          return { mode, catalogOpen: false, inspectorOpen: false };
        case 'review':
          return { mode, catalogOpen: false, inspectorOpen: false };
      }
    }),

  /* Selection */
  selectedNodeId: null,
  setSelectedNode: (id) => set({ selectedNodeId: id }),

  /* Catalog */
  catalogTab: 'catalog',
  setCatalogTab: (tab) => set({ catalogTab: tab }),
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
}));
