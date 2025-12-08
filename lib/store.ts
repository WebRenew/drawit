import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CanvasElement, SmartConnection } from "@/lib/types"
import { diagramService, type Diagram } from "@/lib/services/diagram-service"
import { debounce } from "@/lib/utils/debounce"

// Auto-save delay in milliseconds
const AUTO_SAVE_DELAY = 2000

interface CanvasState {
  elements: CanvasElement[]
  connections: SmartConnection[]
  _hasHydrated: boolean

  // Diagram persistence state
  currentDiagramId: string | null
  currentDiagram: Diagram | null
  isSaving: boolean
  lastSaved: Date | null
  saveError: string | null
  isLoading: boolean

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

  // Diagram persistence actions
  loadDiagram: (id: string) => Promise<void>
  saveDiagram: () => Promise<void>
  createNewDiagram: (title?: string) => Promise<string | null>
  updateDiagramTitle: (title: string) => Promise<void>
  closeDiagram: () => void
  setDiagram: (diagram: Diagram | null) => void

  setHasHydrated: (state: boolean) => void
}

// Debounced auto-save function (created outside store to maintain reference)
let debouncedAutoSave: ReturnType<typeof debounce> | null = null

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => {
      // Initialize debounced auto-save
      const triggerAutoSave = () => {
        const state = get()
        if (state.currentDiagramId && !state.isSaving) {
          set({ isSaving: true, saveError: null })
          diagramService
            .autoSave(state.currentDiagramId, state.elements, state.connections)
            .then(() => {
              set({ isSaving: false, lastSaved: new Date() })
            })
            .catch((error) => {
              console.error("Auto-save failed:", error)
              set({ isSaving: false, saveError: error.message })
            })
        }
      }

      debouncedAutoSave = debounce(triggerAutoSave, AUTO_SAVE_DELAY)

      return {
        elements: [],
        connections: [],
        _hasHydrated: false,

        // Diagram persistence state
        currentDiagramId: null,
        currentDiagram: null,
        isSaving: false,
        lastSaved: null,
        saveError: null,
        isLoading: false,

        addElement: (element) => {
          set((state) => ({
            elements: [...state.elements, element],
          }))
          // Trigger auto-save if we have a diagram loaded
          if (get().currentDiagramId) {
            debouncedAutoSave?.()
          }
        },

        updateElements: (updater) => {
          set((state) => ({
            elements: updater(state.elements),
          }))
          // Trigger auto-save if we have a diagram loaded
          if (get().currentDiagramId) {
            debouncedAutoSave?.()
          }
        },

        clearElements: () => {
          set({ elements: [] })
          if (get().currentDiagramId) {
            debouncedAutoSave?.()
          }
        },

        addConnection: (connection) => {
          set((state) => ({
            connections: [...state.connections, connection],
          }))
          if (get().currentDiagramId) {
            debouncedAutoSave?.()
          }
        },

        updateConnections: (updater) => {
          set((state) => ({
            connections: updater(state.connections),
          }))
          if (get().currentDiagramId) {
            debouncedAutoSave?.()
          }
        },

        clearConnections: () => {
          set({ connections: [] })
          if (get().currentDiagramId) {
            debouncedAutoSave?.()
          }
        },

        clearAll: () => {
          set({ elements: [], connections: [] })
          if (get().currentDiagramId) {
            debouncedAutoSave?.()
          }
        },

        loadDiagram: async (id: string) => {
          set({ isLoading: true, saveError: null })
          try {
            const diagram = await diagramService.get(id)
            if (diagram) {
              set({
                elements: diagram.elements,
                connections: diagram.connections,
                currentDiagramId: diagram.id,
                currentDiagram: diagram,
                isLoading: false,
              })
            } else {
              set({ isLoading: false, saveError: "Diagram not found" })
            }
          } catch (error) {
            console.error("Failed to load diagram:", error)
            set({
              isLoading: false,
              saveError: error instanceof Error ? error.message : "Failed to load diagram",
            })
          }
        },

        saveDiagram: async () => {
          const state = get()
          if (!state.currentDiagramId) return

          set({ isSaving: true, saveError: null })
          try {
            await diagramService.autoSave(
              state.currentDiagramId,
              state.elements,
              state.connections
            )
            set({ isSaving: false, lastSaved: new Date() })
          } catch (error) {
            console.error("Failed to save diagram:", error)
            set({
              isSaving: false,
              saveError: error instanceof Error ? error.message : "Failed to save diagram",
            })
          }
        },

        createNewDiagram: async (title?: string) => {
          set({ isLoading: true, saveError: null })
          try {
            const diagram = await diagramService.create({
              title: title || "Untitled Diagram",
              elements: get().elements,
              connections: get().connections,
            })
            set({
              currentDiagramId: diagram.id,
              currentDiagram: diagram,
              isLoading: false,
              lastSaved: new Date(),
            })
            return diagram.id
          } catch (error) {
            console.error("Failed to create diagram:", error)
            set({
              isLoading: false,
              saveError: error instanceof Error ? error.message : "Failed to create diagram",
            })
            return null
          }
        },

        updateDiagramTitle: async (title: string) => {
          const state = get()
          if (!state.currentDiagramId) return

          try {
            const updated = await diagramService.update(state.currentDiagramId, { title })
            set({ currentDiagram: updated })
          } catch (error) {
            console.error("Failed to update diagram title:", error)
          }
        },

        closeDiagram: () => {
          // Flush any pending auto-save
          debouncedAutoSave?.flush()
          set({
            currentDiagramId: null,
            currentDiagram: null,
            lastSaved: null,
            saveError: null,
          })
        },

        setDiagram: (diagram: Diagram | null) => {
          if (diagram) {
            set({
              elements: diagram.elements,
              connections: diagram.connections,
              currentDiagramId: diagram.id,
              currentDiagram: diagram,
            })
          } else {
            set({
              currentDiagramId: null,
              currentDiagram: null,
            })
          }
        },

        setHasHydrated: (state) => set({ _hasHydrated: state }),
      }
    },
    {
      name: "canvas-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
      partialize: (state) => ({
        elements: state.elements,
        connections: state.connections,
        // Don't persist diagram ID - user should explicitly open diagrams
      }),
    }
  )
)

// Export selectors for convenience
export const useElements = () => useCanvasStore((state) => state.elements)
export const useConnections = () => useCanvasStore((state) => state.connections)
export const useHasHydrated = () => useCanvasStore((state) => state._hasHydrated)
export const useCurrentDiagram = () => useCanvasStore((state) => state.currentDiagram)
export const useIsSaving = () => useCanvasStore((state) => state.isSaving)
export const useLastSaved = () => useCanvasStore((state) => state.lastSaved)
