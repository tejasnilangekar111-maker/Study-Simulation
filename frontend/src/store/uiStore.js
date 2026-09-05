import { create } from 'zustand'

export const useUiStore = create((set) => ({
  focusMode: false,
  sidebarCollapsed: false,
  setFocusMode: (focusMode) => set({ focusMode }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
}))
