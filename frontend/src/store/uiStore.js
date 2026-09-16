import { create } from 'zustand'

export const useUiStore = create((set) => ({
  focusMode: false,
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  setFocusMode: (focusMode) => set({ focusMode }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  toggleSidebarMobile: () => set((state) => ({ sidebarMobileOpen: !state.sidebarMobileOpen })),
  closeSidebarMobile: () => set({ sidebarMobileOpen: false }),
}))
