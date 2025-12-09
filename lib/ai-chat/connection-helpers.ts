/**
 * Connection Helpers
 * Shared utilities for creating SmartConnections with proper properties
 * Used by both client-side tool handlers and background task result processing
 */

import type { SmartConnection, HandlePosition, CanvasElement } from "@/lib/types"

export interface ConnectionInput {
  sourceId: string
  targetId: string
  label?: string
  strokeColor?: string
  strokeWidth?: number
  strokeStyle?: "solid" | "dashed" | "dotted"
  pathType?: "bezier" | "smoothstep" | "straight"
  animated?: boolean
  arrowHeadStart?: "arrow" | "dot" | "bar" | "none"
  arrowHeadEnd?: "arrow" | "dot" | "bar" | "none"
  sourceHandle?: HandlePosition
  targetHandle?: HandlePosition
}

export interface ElementPosition {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Auto-determine optimal handle positions based on relative element positions
 */
export function calculateAutoHandles(
  source: ElementPosition,
  target: ElementPosition
): { sourceHandle: HandlePosition; targetHandle: HandlePosition } {
  const sourceCenterX = source.x + source.width / 2
  const sourceCenterY = source.y + source.height / 2
  const targetCenterX = target.x + target.width / 2
  const targetCenterY = target.y + target.height / 2

  const dx = targetCenterX - sourceCenterX
  const dy = targetCenterY - sourceCenterY

  // Determine primary direction based on which axis has more distance
  if (Math.abs(dy) > Math.abs(dx)) {
    // Vertical connection
    if (dy > 0) {
      return { sourceHandle: "bottom", targetHandle: "top" }
    } else {
      return { sourceHandle: "top", targetHandle: "bottom" }
    }
  } else {
    // Horizontal connection
    if (dx > 0) {
      return { sourceHandle: "right", targetHandle: "left" }
    } else {
      return { sourceHandle: "left", targetHandle: "right" }
    }
  }
}

/**
 * Create a properly-formatted SmartConnection
 * Handles auto-calculation of handle positions when elements are provided
 */
export function createSmartConnection(
  input: ConnectionInput,
  elements?: CanvasElement[]
): Omit<SmartConnection, "id"> {
  let { sourceHandle, targetHandle } = input

  // Auto-calculate handles if not provided and elements are available
  if ((!sourceHandle || !targetHandle) && elements) {
    const sourceEl = elements.find((el) => el.id === input.sourceId)
    const targetEl = elements.find((el) => el.id === input.targetId)

    if (sourceEl && targetEl) {
      const autoHandles = calculateAutoHandles(
        { x: sourceEl.x, y: sourceEl.y, width: sourceEl.width, height: sourceEl.height },
        { x: targetEl.x, y: targetEl.y, width: targetEl.width, height: targetEl.height }
      )
      sourceHandle = sourceHandle || autoHandles.sourceHandle
      targetHandle = targetHandle || autoHandles.targetHandle
    }
  }

  return {
    sourceId: input.sourceId,
    targetId: input.targetId,
    sourceHandle: sourceHandle || "bottom",
    targetHandle: targetHandle || "top",
    label: input.label,
    strokeColor: input.strokeColor,
    strokeWidth: input.strokeWidth ?? 2,
    strokeStyle: input.strokeStyle || "solid",
    pathType: input.pathType || "smoothstep",
    animated: input.animated || false,
    arrowHeadStart: input.arrowHeadStart || "none",
    arrowHeadEnd: input.arrowHeadEnd || "arrow",
  }
}

/**
 * Convert background task connection result to SmartConnection
 * Handles the property name differences (from/to -> sourceId/targetId)
 */
export function convertBackgroundConnection(
  conn: { from: string; to: string; label?: string },
  options: {
    elements?: CanvasElement[]
    strokeColor?: string
    isDarkMode?: boolean
  } = {}
): Omit<SmartConnection, "id"> {
  const { elements, strokeColor, isDarkMode = true } = options
  const defaultColor = isDarkMode ? "#ffffff" : "#1e1e1e"

  return createSmartConnection(
    {
      sourceId: conn.from,
      targetId: conn.to,
      label: conn.label,
      strokeColor: strokeColor || defaultColor,
      strokeWidth: 2,
      strokeStyle: "solid",
      pathType: "smoothstep",
      arrowHeadEnd: "arrow",
    },
    elements
  )
}

/**
 * Batch convert background task connections
 */
export function convertBackgroundConnections(
  connections: Array<{ from: string; to: string; label?: string }>,
  options: {
    elements?: CanvasElement[]
    strokeColor?: string
    isDarkMode?: boolean
  } = {}
): Array<Omit<SmartConnection, "id">> {
  return connections.map((conn) => convertBackgroundConnection(conn, options))
}



