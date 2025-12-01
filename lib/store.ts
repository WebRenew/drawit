import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CanvasElement, SmartConnection } from "@/lib/types"

interface CanvasState {
  elements: CanvasElement[]
  connections: SmartConnection[]
  _hasHydrated: boolean

  // Element actions
  addElement: (element: CanvasElement) => void
  updateElements: (updater: (elements: CanvasElement[]) => CanvasElement[]) => void
  clearElements: () => void

  // Connection actions
  addConnection: (connection: SmartConnection) => void
  updateConnections: (updater: (connections: SmartConnection[]) => SmartConnection[]) => void
  clearConnections: () => void

  // Bulk actions
  clearAll: () => void

  setHasHydrated: (state: boolean) => void
}

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set) => ({
      elements: [],
      connections: [],
      _hasHydrated: false,

      addElement: (element) =>
        set((state) => ({
          elements: [...state.elements, element],
        })),

      updateElements: (updater) =>
        set((state) => ({
          elements: updater(state.elements),
        })),

      clearElements: () => set({ elements: [] }),

      addConnection: (connection) =>
        set((state) => ({
          connections: [...state.connections, connection],
        })),

      updateConnections: (updater) =>
        set((state) => ({
          connections: updater(state.connections),
        })),

      clearConnections: () => set({ connections: [] }),

      clearAll: () => set({ elements: [], connections: [] }),

      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "canvas-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
      partialize: (state) => ({
        elements: state.elements,
        connections: state.connections,
      }),
    },
  ),
)

// Export selectors for convenience
export const useElements = () => useCanvasStore((state) => state.elements)
export const useConnections = () => useCanvasStore((state) => state.connections)
export const useHasHydrated = () => useCanvasStore((state) => state._hasHydrated)
