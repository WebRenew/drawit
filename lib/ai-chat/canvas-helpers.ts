import type { CanvasInfo } from "./types"
import type { CanvasElement } from "@/lib/types"

/**
 * Get canvas info including dimensions and element count
 */
export function getCanvasInfo(
  canvasDimensions: { width: number; height: number } | undefined,
  elements: CanvasElement[] | undefined,
): CanvasInfo {
  const width = canvasDimensions?.width || 1200
  const height = canvasDimensions?.height || 800
  return {
    width,
    height,
    centerX: Math.round(width / 2),
    centerY: Math.round(height / 2),
    elementCount: elements?.length || 0,
  }
}

/**
 * Get centered position for a diagram of given dimensions
 */
export function getCenteredPosition(
  canvasDimensions: { width: number; height: number } | undefined,
  elements: CanvasElement[] | undefined,
  diagramWidth: number,
  diagramHeight: number,
): { x: number; y: number } {
  const canvasInfo = getCanvasInfo(canvasDimensions, elements)
  return {
    x: canvasInfo.centerX - diagramWidth / 2,
    y: canvasInfo.centerY - diagramHeight / 2,
  }
}

/**
 * Center a map of positions around the canvas center
 */
export function centerDiagramPositions(
  positions: Map<string, { x: number; y: number; width: number; height: number }>,
  canvasDimensions: { width: number; height: number } | undefined,
  elements: CanvasElement[] | undefined,
  shouldCenter = true,
): Map<string, { x: number; y: number; width: number; height: number }> {
  if (!shouldCenter || positions.size === 0) return positions

  // Find bounding box
  let minX = Number.POSITIVE_INFINITY,
    minY = Number.POSITIVE_INFINITY,
    maxX = Number.NEGATIVE_INFINITY,
    maxY = Number.NEGATIVE_INFINITY

  for (const pos of positions.values()) {
    minX = Math.min(minX, pos.x)
    minY = Math.min(minY, pos.y)
    maxX = Math.max(maxX, pos.x + pos.width)
    maxY = Math.max(maxY, pos.y + pos.height)
  }

  const diagramWidth = maxX - minX
  const diagramHeight = maxY - minY
  const centered = getCenteredPosition(canvasDimensions, elements, diagramWidth, diagramHeight)
  const offsetX = centered.x - minX
  const offsetY = centered.y - minY

  // Apply offset to all positions
  const centeredPositions = new Map<string, { x: number; y: number; width: number; height: number }>()
  for (const [id, pos] of positions.entries()) {
    centeredPositions.set(id, {
      ...pos,
      x: pos.x + offsetX,
      y: pos.y + offsetY,
    })
  }

  return centeredPositions
}

/**
 * Get foreground color based on theme
 */
export function getForegroundColor(resolvedTheme: string | undefined): string {
  const isDark = resolvedTheme !== "light"
  return isDark ? "#ffffff" : "#000000"
}

/**
 * Generate a random UUID
 */
export function generateId(): string {
  return crypto.randomUUID()
}
