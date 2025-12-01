export type ToolType =
  | "selection"
  | "hand"
  | "rectangle"
  | "ellipse"
  | "diamond"
  | "arrow"
  | "line"
  | "freedraw"
  | "text"
  | "image"
  | "eraser"
  | "connector"

export type StrokeStyle = "solid" | "dashed" | "dotted"
export type Sloppiness = "architect" | "artist" | "cartoonist"
export type ArrowHeadType = "arrow" | "dot" | "bar" | "none"
export type ArrowEnd = "start" | "end" | "both"
export type TextAlign = "left" | "center" | "right"

export type HandlePosition = "top" | "right" | "bottom" | "left"

export interface StrokeGradient {
  type: "linear"
  colors: [string, string] // Start and end colors
  angle: number // Angle in degrees (0 = left to right, 90 = top to bottom)
}

// Helper to check if a stroke is a gradient
export function isGradientStroke(stroke: string | StrokeGradient): stroke is StrokeGradient {
  return typeof stroke === "object" && stroke !== null && "type" in stroke
}

// Helper to get gradient ID for an element
export function getGradientId(elementId: string): string {
  return `stroke-gradient-${elementId}`
}

export interface SmartConnection {
  id: string
  sourceId: string
  targetId: string
  sourceHandle?: HandlePosition
  targetHandle?: HandlePosition
  label?: string
  strokeColor?: string | StrokeGradient // Support gradient
  strokeWidth?: number
  strokeStyle?: StrokeStyle
  animated?: boolean
  arrowHeadStart?: ArrowHeadType
  arrowHeadEnd?: ArrowHeadType
  pathType?: "bezier" | "smoothstep" | "straight"
}

export interface LinearGradient {
  type: "linear"
  colors: string[]
  stops?: number[]
  angle?: number
}

export interface RadialGradient {
  type: "radial"
  colors: string[]
  stops?: number[]
  cx?: string
  cy?: string
  r?: string
}

export interface CanvasElement {
  id: string
  type: ToolType
  x: number
  y: number
  width: number
  height: number
  strokeColor: string | StrokeGradient // Support gradient
  backgroundColor: string
  strokeWidth: number
  strokeStyle: StrokeStyle
  roughness: number
  opacity: number
  angle: number
  seed: number
  isLocked: boolean
  points?: [number, number][]
  text?: string
  fontSize?: number
  fontWeight?: string
  fontFamily?: string
  textAlign?: TextAlign
  arrowHeadStart?: ArrowHeadType
  arrowHeadEnd?: ArrowHeadType
  groupId?: string
  imageUrl?: string
  connectable?: boolean
  connectionIds?: string[]
  label?: string
  labelColor?: string
  labelFontSize?: number
  labelFontWeight?: string
  labelPadding?: number
  linearGradient?: LinearGradient
  radialGradient?: RadialGradient
}

export interface Viewport {
  x: number
  y: number
  zoom: number
}

export interface AppState {
  tool: ToolType
  isDragging: boolean
  selection: string[]
  currentItemId: string | null
  // Default styles for new shapes
  currentItemStrokeColor: string | StrokeGradient // Support gradient
  currentItemBackgroundColor: string
  currentItemStrokeWidth: number
  currentItemStrokeStyle: StrokeStyle
  currentItemRoughness: number
  currentItemOpacity: number
  currentItemTextAlign: TextAlign
  currentItemFontSize: number // Added default font size
  currentItemFontWeight: string // Added default font weight
  currentItemArrowHeadStart: ArrowHeadType
  currentItemArrowHeadEnd: ArrowHeadType
  // Gradient support
  currentItemLinearGradient?: LinearGradient
  currentItemRadialGradient?: RadialGradient
  // Label properties
  label?: string
  labelColor?: string
  labelFontSize?: number
  labelFontWeight?: string
  labelPadding?: number
  selectionBox?: {
    startX: number
    startY: number
    endX: number
    endY: number
  } // For selection box state
}

export interface PreviewState {
  elements: CanvasElement[]
  groupId: string
  timestamp: number
}
