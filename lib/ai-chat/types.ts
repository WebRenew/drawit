import type React from "react"
import type { CanvasElement, SmartConnection } from "@/lib/types"

// Model configuration
export interface AIModel {
  id: string
  name: string
}

export const AVAILABLE_MODELS: AIModel[] = [
  { id: "anthropic/claude-opus-4.5", name: "Claude Opus 4.5" },
]

export const DEFAULT_MODEL = "anthropic/claude-opus-4.5"

// Canvas info returned by getCanvasInfo
export interface CanvasInfo {
  width: number
  height: number
  centerX: number
  centerY: number
  elementCount: number
}

// Shape registry types
export type ShapeRegistry = Map<string, string>
export type ShapeDataRegistry = Map<string, { x: number; y: number; width: number; height: number; type: string }>

// Tool handler context - shared dependencies for all tool handlers
export interface ToolHandlerContext {
  resolvedTheme: string | undefined
  shapeRegistryRef: React.MutableRefObject<ShapeRegistry>
  shapeDataRef: React.MutableRefObject<ShapeDataRegistry>
  uploadedImagesRef?: React.MutableRefObject<string[]>
  addElementMutation: (element: Omit<CanvasElement, "id">) => void
  addConnectionMutation: (connection: Omit<SmartConnection, "id">) => void
  updateElements: (updates: Partial<CanvasElement>[]) => void
  clearCanvas: () => void
  /** @deprecated Use getElements() for fresh state. This may be stale during rapid tool calls. */
  elements: CanvasElement[] | undefined
  /** Get fresh elements directly from store (avoids race condition during rapid tool calls) */
  getElements: () => CanvasElement[]
  canvasDimensions?: { width: number; height: number }
}

// Props for AIChatPanel component
export interface AIChatPanelProps {
  onPreviewChange?: (state: any) => void
  canvasDimensions?: { width: number; height: number }
  onElementsCreated?: () => void
}
