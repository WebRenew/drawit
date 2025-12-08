import type { ToolHandlerContext, CanvasInfo } from "../types"
import { getCanvasInfo } from "../canvas-helpers"

export interface CanvasStateOutput {
  canvas: CanvasInfo
  elementCount: number
  elements: Array<{
    id: string
    type: string
    x: number
    y: number
    width: number
    height: number
    text?: string
    label?: string
    strokeColor?: string
    backgroundColor?: string
  }>
  usedArea: {
    minX: number
    minY: number
    maxX: number
    maxY: number
    width: number
    height: number
  } | null
  freeAreas: Array<{
    description: string
    x: number
    y: number
  }>
  recommendation: string
}

export function handleGetCanvasState(ctx: ToolHandlerContext): CanvasStateOutput {
  // Issue #7 fix: Use getElements() for fresh state to avoid race conditions
  const elements = ctx.getElements()
  const canvasInfo = getCanvasInfo(ctx.canvasDimensions, elements)

  const elementSummary =
    elements?.map((el) => ({
      id: el.id,
      type: el.type,
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
      text: (el as any).text || undefined,
      label: (el as any).label || undefined,
      strokeColor: (el as any).strokeColor || undefined,
      backgroundColor: (el as any).backgroundColor || undefined,
    })) || []

  let minX = Number.POSITIVE_INFINITY,
    minY = Number.POSITIVE_INFINITY,
    maxX = Number.NEGATIVE_INFINITY,
    maxY = Number.NEGATIVE_INFINITY

  for (const el of elements || []) {
    minX = Math.min(minX, el.x)
    minY = Math.min(minY, el.y)
    maxX = Math.max(maxX, el.x + (el.width || 0))
    maxY = Math.max(maxY, el.y + (el.height || 0))
  }

  const hasElements = elements && elements.length > 0
  const usedArea = hasElements ? { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY } : null

  const freeAreas: Array<{ description: string; x: number; y: number }> = []
  if (!hasElements) {
    freeAreas.push({
      description: "Canvas is empty - place diagram at center",
      x: canvasInfo.centerX,
      y: canvasInfo.centerY,
    })
  } else {
    if (maxX + 200 < canvasInfo.width) {
      freeAreas.push({ description: "Right of existing content", x: maxX + 100, y: canvasInfo.centerY })
    }
    if (maxY + 200 < canvasInfo.height) {
      freeAreas.push({ description: "Below existing content", x: canvasInfo.centerX, y: maxY + 100 })
    }
  }

  return {
    canvas: canvasInfo,
    elementCount: elements?.length || 0,
    elements: elementSummary,
    usedArea,
    freeAreas,
    recommendation: hasElements
      ? `Canvas has ${elements!.length} elements. Consider placing new content at (${freeAreas[0]?.x || canvasInfo.centerX}, ${freeAreas[0]?.y || canvasInfo.centerY}).`
      : `Canvas is empty. Place diagram centered at (${canvasInfo.centerX}, ${canvasInfo.centerY}).`,
  }
}
