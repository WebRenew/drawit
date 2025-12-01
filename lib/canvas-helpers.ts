import type { StrokeGradient } from "./types"
import { isGradientStroke, getGradientId } from "./types"

// Helper to normalize opacity from stored 0-100 to CSS 0-1
export function normalizeOpacity(opacity: number | undefined): number {
  if (opacity === undefined) return 1
  // If opacity is already in 0-1 range (legacy values <= 1), return as-is
  // If in 0-100 range (> 1), divide by 100
  return opacity > 1 ? opacity / 100 : opacity
}

export function getStrokeValue(stroke: string | StrokeGradient, elementId: string): string {
  if (isGradientStroke(stroke)) {
    return `url(#${getGradientId(elementId)})`
  }
  return stroke
}

export function getGradientCoords(angle: number): { x1: string; y1: string; x2: string; y2: string } {
  // Convert angle to radians and adjust for SVG coordinate system
  const rad = (angle - 90) * (Math.PI / 180)
  const x1 = Math.round(50 + Math.sin(rad + Math.PI) * 50)
  const y1 = Math.round(50 + Math.cos(rad + Math.PI) * 50)
  const x2 = Math.round(50 + Math.sin(rad) * 50)
  const y2 = Math.round(50 + Math.cos(rad) * 50)

  return {
    x1: `${x1}%`,
    y1: `${y1}%`,
    x2: `${x2}%`,
    y2: `${y2}%`,
  }
}

export function getSolidStrokeColor(stroke: string | StrokeGradient): string {
  if (isGradientStroke(stroke)) {
    // Return the first color of the gradient as fallback
    return stroke.colors[0]
  }
  return stroke
}

export function renderGradientDef(
  elementId: string,
  gradient: StrokeGradient,
): { id: string; x1: string; y1: string; x2: string; y2: string; color1: string; color2: string } {
  const coords = getGradientCoords(gradient.angle)
  return {
    id: getGradientId(elementId),
    ...coords,
    color1: gradient.colors[0],
    color2: gradient.colors[1],
  }
}
