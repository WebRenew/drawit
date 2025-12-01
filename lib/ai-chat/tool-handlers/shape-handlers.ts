import type { ToolHandlerContext } from "../types"
import { generateId } from "../canvas-helpers"
import { getStrokeColors, getBackgroundColors } from "@/lib/constants"
import {
  calculateConnection,
  calculateCurvedPath,
  calculateOrthogonalPath,
  calculateArrowOffset,
  type ConnectionAnchor,
  type ConnectionCurve,
  type ShapeBounds,
} from "@/lib/connection-helpers"
import type { CanvasElement, ToolType } from "@/lib/types"

export interface CreateShapeInput {
  type: string
  x?: number
  y?: number
  width?: number
  height?: number
  text?: string
  textAlign?: string
  strokeColor?: string
  backgroundColor?: string
  shapeId?: string
  relativeToShapeId?: string
  angle?: number
  distance?: number
  gridPosition?: {
    row: number
    col: number
    rowSpacing?: number
    colSpacing?: number
    startX?: number
    startY?: number
  }
  circularPosition?: {
    centerX: number
    centerY: number
    radius: number
    index: number
    total: number
  }
  autoConnect?: boolean
  fromShapeId?: string
  toShapeId?: string
  fromAnchor?: string
  toAnchor?: string
  curveType?: string
  curveAmount?: number
}

export function handleCreateShape(
  args: CreateShapeInput,
  ctx: ToolHandlerContext,
): { success: boolean; message: string; elementId?: string; shapeId?: string; position?: any } {
  if (!args) {
    return {
      success: false,
      message: "No arguments provided to createShape tool",
    }
  }

  const isDark = ctx.resolvedTheme !== "light"
  const strokeColors = getStrokeColors(isDark)
  const bgColors = getBackgroundColors(isDark)

  let finalX = args.x
  let finalY = args.y
  let finalWidth = args.width
  let finalHeight = args.height

  // Handle relative positioning
  if (args.relativeToShapeId && args.angle !== undefined && args.distance !== undefined) {
    const refShape = ctx.shapeDataRef.current.get(args.relativeToShapeId)
    if (!refShape) {
      return {
        success: false,
        message: `Reference shape not found: ${args.relativeToShapeId}`,
      }
    }

    const angleRad = (args.angle * Math.PI) / 180
    const refCenterX = refShape.x + refShape.width / 2
    const refCenterY = refShape.y + refShape.height / 2

    const newCenterX = refCenterX + args.distance * Math.cos(angleRad)
    const newCenterY = refCenterY + args.distance * Math.sin(angleRad)

    finalWidth = finalWidth ?? (args.type === "text" ? 200 : 150)
    finalHeight = finalHeight ?? (args.type === "text" ? 50 : 100)

    finalX = newCenterX - finalWidth / 2
    finalY = newCenterY - finalHeight / 2
  } else if (args.gridPosition) {
    const { row, col, rowSpacing = 150, colSpacing = 200, startX = 100, startY = 100 } = args.gridPosition

    finalWidth = finalWidth ?? (args.type === "text" ? 200 : 150)
    finalHeight = finalHeight ?? (args.type === "text" ? 50 : 100)

    const centerX = startX + col * colSpacing
    const centerY = startY + row * rowSpacing

    finalX = centerX - finalWidth / 2
    finalY = centerY - finalHeight / 2
  } else if (args.circularPosition) {
    const { centerX, centerY, radius, index, total } = args.circularPosition
    const angleRad = (2 * Math.PI * index) / total - Math.PI / 2

    finalWidth = finalWidth ?? (args.type === "text" ? 200 : 150)
    finalHeight = finalHeight ?? (args.type === "text" ? 50 : 100)

    const nodeCenterX = centerX + radius * Math.cos(angleRad)
    const nodeCenterY = centerY + radius * Math.sin(angleRad)

    finalX = nodeCenterX - finalWidth / 2
    finalY = nodeCenterY - finalHeight / 2
  } else if (args.autoConnect && (args.type === "arrow" || args.type === "line")) {
    return handleAutoConnect(args, ctx)
  }

  // Apply defaults
  finalX = finalX ?? 100
  finalY = finalY ?? 100
  finalWidth = finalWidth ?? (args.type === "text" ? 200 : 150)
  finalHeight = finalHeight ?? (args.type === "text" ? 50 : 100)

  const elementId = generateId()

  const element: Omit<CanvasElement, "id"> = {
    type: args.type as ToolType,
    x: finalX,
    y: finalY,
    width: finalWidth,
    height: finalHeight,
    strokeColor: args.strokeColor || strokeColors[0],
    backgroundColor: args.backgroundColor || (args.type === "text" ? "transparent" : bgColors[9]),
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1.6,
    opacity: 1,
    angle: 0,
    seed: Math.floor(Math.random() * 2147483647),
    isLocked: false,
    groupId: undefined,
  }

  if (args.type === "text") {
    ;(element as any).text = args.text || "Text"
    ;(element as any).textAlign = args.textAlign || "left"
    ;(element as any).fontSize = "medium"
    ;(element as any).fontWeight = "normal"
  }

  if (args.type === "arrow" || args.type === "line") {
    ;(element as any).startArrow = false
    ;(element as any).endArrow = args.type === "arrow"
    ;(element as any).points = [
      [0, 0],
      [finalWidth, finalHeight],
    ]
  }

  ctx.addElementMutation(element)

  if (args.shapeId) {
    ctx.shapeRegistryRef.current.set(args.shapeId, elementId)
    ctx.shapeDataRef.current.set(args.shapeId, {
      x: finalX,
      y: finalY,
      width: finalWidth,
      height: finalHeight,
      type: args.type,
    })
  }

  return {
    success: true,
    message: `Created ${args.type}${args.shapeId ? ` (ID: ${args.shapeId})` : ""}`,
    elementId,
    shapeId: args.shapeId,
    position: { x: finalX, y: finalY, width: finalWidth, height: finalHeight },
  }
}

function handleAutoConnect(
  args: CreateShapeInput,
  ctx: ToolHandlerContext,
): { success: boolean; message: string; shapeId?: string; position?: any } {
  const isDark = ctx.resolvedTheme !== "light"
  const strokeColors = getStrokeColors(isDark)

  const fromElementId = ctx.shapeRegistryRef.current.get(args.fromShapeId!)
  const toElementId = ctx.shapeRegistryRef.current.get(args.toShapeId!)

  if (!fromElementId || !toElementId) {
    return {
      success: false,
      message: `Could not find shapes: ${args.fromShapeId} or ${args.toShapeId}`,
    }
  }

  const fromShapeData = ctx.shapeDataRef.current.get(args.fromShapeId!)
  const toShapeData = ctx.shapeDataRef.current.get(args.toShapeId!)

  if (!fromShapeData || !toShapeData) {
    return {
      success: false,
      message: "Could not get shape data for connection",
    }
  }

  const fromBounds: ShapeBounds = {
    x: fromShapeData.x,
    y: fromShapeData.y,
    width: fromShapeData.width,
    height: fromShapeData.height,
    type: fromShapeData.type as any,
  }
  const toBounds: ShapeBounds = {
    x: toShapeData.x,
    y: toShapeData.y,
    width: toShapeData.width,
    height: toShapeData.height,
    type: toShapeData.type as any,
  }

  const fromAnchor = (args.fromAnchor as ConnectionAnchor) || "auto"
  const toAnchor = (args.toAnchor as ConnectionAnchor) || "auto"
  const curveType = (args.curveType as ConnectionCurve) || "straight"

  const { start, end } = calculateConnection(fromBounds, toBounds, fromAnchor, toAnchor)

  const angle = Math.atan2(end.y - start.y, end.x - start.x)
  const finalEnd = args.type === "arrow" ? calculateArrowOffset(end, angle, 5) : end

  let element: Omit<CanvasElement, "id">

  if (curveType === "curved") {
    const curveAmount = args.curveAmount || 0.3
    const { controlPoint1, controlPoint2 } = calculateCurvedPath(start, finalEnd, curveAmount)

    element = {
      type: args.type!,
      x: start.x,
      y: start.y,
      width: finalEnd.x - start.x,
      height: finalEnd.y - start.y,
      strokeColor: strokeColors[0],
      backgroundColor: "transparent",
      opacity: 1,
      isLocked: false,
      groupId: undefined,
      startArrow: false,
      endArrow: args.type === "arrow",
      points: [
        [0, 0],
        [finalEnd.x - start.x, finalEnd.y - start.y],
      ],
      curveType: "bezier",
      controlPoints: [controlPoint1, controlPoint2],
    } as any
  } else if (curveType === "orthogonal") {
    const pathPoints = calculateOrthogonalPath(start, finalEnd)

    element = {
      type: args.type!,
      x: start.x,
      y: start.y,
      width: finalEnd.x - start.x,
      height: finalEnd.y - start.y,
      strokeColor: strokeColors[0],
      backgroundColor: "transparent",
      opacity: 1,
      isLocked: false,
      groupId: undefined,
      startArrow: false,
      endArrow: args.type === "arrow",
      points: [
        [0, 0],
        [finalEnd.x - start.x, finalEnd.y - start.y],
      ],
      curveType: "orthogonal",
      pathPoints: pathPoints,
    } as any
  } else {
    element = {
      type: args.type!,
      x: start.x,
      y: start.y,
      width: finalEnd.x - start.x,
      height: finalEnd.y - start.y,
      strokeColor: strokeColors[0],
      backgroundColor: "transparent",
      opacity: 1,
      isLocked: false,
      groupId: undefined,
      startArrow: false,
      endArrow: args.type === "arrow",
      points: [
        [0, 0],
        [finalEnd.x - start.x, finalEnd.y - start.y],
      ],
    } as any
  }

  ctx.addElementMutation(element)

  return {
    success: true,
    message: `Created ${args.type} from ${args.fromShapeId} to ${args.toShapeId}`,
    shapeId: args.shapeId,
    position: { x: start.x, y: start.y, width: finalEnd.x - start.x, height: finalEnd.y - start.y },
  }
}

export function handleGetShapeInfo(
  args: { id?: string; shapeId?: string },
  ctx: ToolHandlerContext,
): {
  success: boolean
  message?: string
  shapeId?: string
  elementId?: string
  type?: string
  x?: number
  y?: number
  width?: number
  height?: number
  centerX?: number
  centerY?: number
} {
  // Support both 'id' from API schema and 'shapeId' for backwards compatibility
  const shapeId = args.id || args.shapeId

  if (!shapeId) {
    return {
      success: false,
      message: "Shape ID is required",
    }
  }

  const elementId = ctx.shapeRegistryRef.current.get(shapeId)
  const shapeData = ctx.shapeDataRef.current.get(shapeId)

  if (!elementId || !shapeData) {
    return {
      success: false,
      message: `Shape not found: ${shapeId}`,
    }
  }

  return {
    success: true,
    shapeId: shapeId,
    elementId,
    type: shapeData.type,
    x: shapeData.x,
    y: shapeData.y,
    width: shapeData.width,
    height: shapeData.height,
    centerX: shapeData.x + shapeData.width / 2,
    centerY: shapeData.y + shapeData.height / 2,
  }
}

export function handleUpdateShape(
  args: {
    id?: string
    shapeId?: string
    properties?: {
      x?: number
      y?: number
      width?: number
      height?: number
      label?: string
      color?: string
    }
    x?: number
    y?: number
    width?: number
    height?: number
    text?: string
    strokeColor?: string
    backgroundColor?: string
    opacity?: number
  },
  ctx: ToolHandlerContext,
): { success: boolean; message: string; shapeId?: string; updatedProperties?: string[] } {
  // Support both 'id' from API schema and 'shapeId' for backwards compatibility
  const shapeId = args.id || args.shapeId

  if (!shapeId) {
    return {
      success: false,
      message: "Shape ID is required",
    }
  }

  const elementId = ctx.shapeRegistryRef.current.get(shapeId)
  const shapeData = ctx.shapeDataRef.current.get(shapeId)

  if (!elementId || !shapeData) {
    return {
      success: false,
      message: `Shape not found: ${shapeId}`,
    }
  }

  // Merge properties from both direct args and nested 'properties' object
  const props = args.properties || {}
  const x = args.x ?? props.x
  const y = args.y ?? props.y
  const width = args.width ?? props.width
  const height = args.height ?? props.height
  const label = args.text ?? props.label
  const strokeColor = args.strokeColor ?? props.color
  const backgroundColor = args.backgroundColor

  ctx.updateElements([
    {
      id: elementId,
      x: x ?? shapeData.x,
      y: y ?? shapeData.y,
      width: width ?? shapeData.width,
      height: height ?? shapeData.height,
      ...(label !== undefined && { text: label }),
      ...(strokeColor !== undefined && { strokeColor }),
      ...(backgroundColor !== undefined && { backgroundColor }),
      ...(args.opacity !== undefined && { opacity: args.opacity }),
    },
  ])

  ctx.shapeDataRef.current.set(shapeId, {
    x: x ?? shapeData.x,
    y: y ?? shapeData.y,
    width: width ?? shapeData.width,
    height: height ?? shapeData.height,
    type: shapeData.type,
  })

  const updatedProperties = [
    x !== undefined && "x",
    y !== undefined && "y",
    width !== undefined && "width",
    height !== undefined && "height",
    label !== undefined && "label",
    strokeColor !== undefined && "strokeColor",
    backgroundColor !== undefined && "backgroundColor",
    args.opacity !== undefined && "opacity",
  ].filter(Boolean) as string[]

  return {
    success: true,
    message: `Updated ${shapeId}: ${updatedProperties.join(", ")}`,
    shapeId: shapeId,
    updatedProperties,
  }
}

export function handleClearCanvas(ctx: ToolHandlerContext): { success: boolean; message: string } {
  ctx.clearCanvas()
  ctx.shapeRegistryRef.current.clear()
  ctx.shapeDataRef.current.clear()

  return { success: true, message: "Canvas cleared" }
}
