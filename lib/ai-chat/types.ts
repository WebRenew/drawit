import type React from "react"
import type { CanvasElement, SmartConnection } from "@/lib/types"

// Model configuration
export interface AIModel {
  id: string
  name: string
}

export const AVAILABLE_MODELS: AIModel[] = [
  { id: "anthropic/claude-3-5-sonnet-latest", name: "Claude 3.5 Sonnet" },
  { id: "anthropic/claude-3-5-haiku-latest", name: "Claude 3.5 Haiku" },
  { id: "google/gemini-1.5-pro", name: "Gemini 1.5 Pro" },
  { id: "openai/gpt-4o", name: "GPT-4o" },
  { id: "openai/o1-mini", name: "o1-mini" },
]

export const DEFAULT_MODEL = "anthropic/claude-3-5-sonnet-latest"

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
  elements: CanvasElement[] | undefined
  canvasDimensions?: { width: number; height: number }
}

// Props for AIChatPanel component
export interface AIChatPanelProps {
  onPreviewChange?: (state: any) => void
  canvasDimensions?: { width: number; height: number }
  onElementsCreated?: () => void
}
