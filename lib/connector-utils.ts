// Smart connector utilities for SVG-based canvas
import type { CanvasElement, HandlePosition, SmartConnection } from "./types"

// Calculate the anchor point on an element's edge
export function getElementAnchor(element: CanvasElement, handle: HandlePosition): { x: number; y: number } {
  const centerX = element.x + element.width / 2
  const centerY = element.y + element.height / 2

  switch (handle) {
    case "top":
      return { x: centerX, y: element.y }
    case "bottom":
      return { x: centerX, y: element.y + element.height }
    case "left":
      return { x: element.x, y: centerY }
    case "right":
      return { x: element.x + element.width, y: centerY }
    default:
      return { x: centerX, y: centerY }
  }
}

// Auto-determine best handle positions based on relative positions
export function autoHandlePositions(
  source: CanvasElement,
  target: CanvasElement,
): { sourceHandle: HandlePosition; targetHandle: HandlePosition } {
  const sourceCenterX = source.x + source.width / 2
  const sourceCenterY = source.y + source.height / 2
  const targetCenterX = target.x + target.width / 2
  const targetCenterY = target.y + target.height / 2

  const dx = targetCenterX - sourceCenterX
  const dy = targetCenterY - sourceCenterY

  // Determine primary direction
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

// Get control point offset direction based on handle position
function getControlPointDirection(handle: HandlePosition): { dx: number; dy: number } {
  switch (handle) {
    case "top":
      return { dx: 0, dy: -1 }
    case "bottom":
      return { dx: 0, dy: 1 }
    case "left":
      return { dx: -1, dy: 0 }
    case "right":
      return { dx: 1, dy: 0 }
    default:
      return { dx: 0, dy: 0 }
  }
}

// Generate a bezier curve path between two points with smart routing
export function getBezierPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourceHandle: HandlePosition,
  targetHandle: HandlePosition,
): { path: string; labelX: number; labelY: number } {
  const sourceDir = getControlPointDirection(sourceHandle)
  const targetDir = getControlPointDirection(targetHandle)

  // Calculate distance for control point offset
  const dx = Math.abs(targetX - sourceX)
  const dy = Math.abs(targetY - sourceY)
  const distance = Math.sqrt(dx * dx + dy * dy)
  const offset = Math.min(distance * 0.5, 100)

  // Control points
  const cp1x = sourceX + sourceDir.dx * offset
  const cp1y = sourceY + sourceDir.dy * offset
  const cp2x = targetX + targetDir.dx * offset
  const cp2y = targetY + targetDir.dy * offset

  // Label position at midpoint of curve
  const labelX = (sourceX + 3 * cp1x + 3 * cp2x + targetX) / 8
  const labelY = (sourceY + 3 * cp1y + 3 * cp2y + targetY) / 8

  const path = `M ${sourceX} ${sourceY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${targetX} ${targetY}`

  return { path, labelX, labelY }
}

// Generate a smoothstep path (orthogonal with rounded corners)
export function getSmoothStepPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourceHandle: HandlePosition,
  targetHandle: HandlePosition,
  borderRadius = 8,
): { path: string; labelX: number; labelY: number } {
  const sourceDir = getControlPointDirection(sourceHandle)
  const targetDir = getControlPointDirection(targetHandle)

  // Calculate offset for the step
  const dx = targetX - sourceX
  const dy = targetY - sourceY
  const offset = Math.max(Math.abs(dx), Math.abs(dy)) * 0.3 + 20

  // Determine path based on handle directions
  let points: { x: number; y: number }[] = []

  if (sourceHandle === "bottom" && targetHandle === "top") {
    // Vertical flow: source bottom to target top
    const midY = sourceY + (targetY - sourceY) / 2
    points = [
      { x: sourceX, y: sourceY },
      { x: sourceX, y: midY },
      { x: targetX, y: midY },
      { x: targetX, y: targetY },
    ]
  } else if (sourceHandle === "top" && targetHandle === "bottom") {
    const midY = sourceY + (targetY - sourceY) / 2
    points = [
      { x: sourceX, y: sourceY },
      { x: sourceX, y: midY },
      { x: targetX, y: midY },
      { x: targetX, y: targetY },
    ]
  } else if (sourceHandle === "right" && targetHandle === "left") {
    // Horizontal flow: source right to target left
    const midX = sourceX + (targetX - sourceX) / 2
    points = [
      { x: sourceX, y: sourceY },
      { x: midX, y: sourceY },
      { x: midX, y: targetY },
      { x: targetX, y: targetY },
    ]
  } else if (sourceHandle === "left" && targetHandle === "right") {
    const midX = sourceX + (targetX - sourceX) / 2
    points = [
      { x: sourceX, y: sourceY },
      { x: midX, y: sourceY },
      { x: midX, y: targetY },
      { x: targetX, y: targetY },
    ]
  } else {
    // Mixed: use step with offset
    const stepX = sourceX + sourceDir.dx * offset
    const stepY = sourceY + sourceDir.dy * offset
    const step2X = targetX + targetDir.dx * offset
    const step2Y = targetY + targetDir.dy * offset

    points = [
      { x: sourceX, y: sourceY },
      { x: stepX, y: stepY },
      { x: step2X, y: step2Y },
      { x: targetX, y: targetY },
    ]
  }

  // Build path with rounded corners
  const path = buildRoundedPath(points, borderRadius)

  // Label at midpoint
  const midIndex = Math.floor(points.length / 2)
  const labelX = (points[midIndex - 1].x + points[midIndex].x) / 2
  const labelY = (points[midIndex - 1].y + points[midIndex].y) / 2

  return { path, labelX, labelY }
}

// Build an SVG path with rounded corners at each point
function buildRoundedPath(points: { x: number; y: number }[], radius: number): string {
  if (points.length < 2) return ""
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
  }

  let path = `M ${points[0].x} ${points[0].y}`

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const next = points[i + 1]

    // Calculate vectors
    const v1 = { x: curr.x - prev.x, y: curr.y - prev.y }
    const v2 = { x: next.x - curr.x, y: next.y - curr.y }

    // Normalize
    const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y)
    const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y)

    if (len1 === 0 || len2 === 0) {
      path += ` L ${curr.x} ${curr.y}`
      continue
    }

    // Limit radius to half the shortest segment
    const maxRadius = Math.min(len1, len2) / 2
    const r = Math.min(radius, maxRadius)

    // Calculate arc start and end points
    const arcStart = {
      x: curr.x - (v1.x / len1) * r,
      y: curr.y - (v1.y / len1) * r,
    }
    const arcEnd = {
      x: curr.x + (v2.x / len2) * r,
      y: curr.y + (v2.y / len2) * r,
    }

    path += ` L ${arcStart.x} ${arcStart.y}`
    path += ` Q ${curr.x} ${curr.y} ${arcEnd.x} ${arcEnd.y}`
  }

  const last = points[points.length - 1]
  path += ` L ${last.x} ${last.y}`

  return path
}

// Generate a straight line path
export function getStraightPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
): { path: string; labelX: number; labelY: number } {
  const labelX = (sourceX + targetX) / 2
  const labelY = (sourceY + targetY) / 2
  const path = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`

  return { path, labelX, labelY }
}

// Calculate arrow head points for a given angle
export function getArrowHeadPoints(x: number, y: number, angle: number, size = 10): string {
  const points = [
    [x, y],
    [x - size * 2, y - size],
    [x - size * 2, y + size],
  ]
    .map(([px, py]) => {
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      const dx = px - x
      const dy = py - y
      return [x + dx * cos - dy * sin, y + dx * sin + dy * cos]
    })
    .map((p) => p.join(","))
    .join(" ")

  return points
}

// Calculate angle at end of a path
export function getPathEndAngle(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  pathType: "bezier" | "smoothstep" | "straight",
  sourceHandle: HandlePosition,
  targetHandle: HandlePosition,
): number {
  if (pathType === "straight") {
    return Math.atan2(targetY - sourceY, targetX - sourceX)
  }

  // For curved paths, use the tangent at the end
  const targetDir = getControlPointDirection(targetHandle)
  if (targetDir.dx !== 0 || targetDir.dy !== 0) {
    return Math.atan2(-targetDir.dy, -targetDir.dx)
  }

  return Math.atan2(targetY - sourceY, targetX - sourceX)
}

// Generate connector path between two elements
export function generateConnectorPath(
  elements: CanvasElement[],
  connection: SmartConnection,
): {
  path: string
  labelX: number
  labelY: number
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  endAngle: number
  startAngle: number
} | null {
  const source = elements.find((el) => el.id === connection.sourceId)
  const target = elements.find((el) => el.id === connection.targetId)

  if (!source || !target) return null

  // Auto-determine handles if not specified
  let sourceHandle = connection.sourceHandle
  let targetHandle = connection.targetHandle

  if (!sourceHandle || !targetHandle) {
    const autoHandles = autoHandlePositions(source, target)
    sourceHandle = sourceHandle || autoHandles.sourceHandle
    targetHandle = targetHandle || autoHandles.targetHandle
  }

  // Get anchor points
  const sourceAnchor = getElementAnchor(source, sourceHandle)
  const targetAnchor = getElementAnchor(target, targetHandle)

  const pathType = connection.pathType || "smoothstep"
  let result: { path: string; labelX: number; labelY: number }

  switch (pathType) {
    case "bezier":
      result = getBezierPath(sourceAnchor.x, sourceAnchor.y, targetAnchor.x, targetAnchor.y, sourceHandle, targetHandle)
      break
    case "straight":
      result = getStraightPath(sourceAnchor.x, sourceAnchor.y, targetAnchor.x, targetAnchor.y)
      break
    case "smoothstep":
    default:
      result = getSmoothStepPath(
        sourceAnchor.x,
        sourceAnchor.y,
        targetAnchor.x,
        targetAnchor.y,
        sourceHandle,
        targetHandle,
      )
  }

  const endAngle = getPathEndAngle(
    sourceAnchor.x,
    sourceAnchor.y,
    targetAnchor.x,
    targetAnchor.y,
    pathType,
    sourceHandle,
    targetHandle,
  )

  const startAngle = getPathEndAngle(
    targetAnchor.x,
    targetAnchor.y,
    sourceAnchor.x,
    sourceAnchor.y,
    pathType,
    targetHandle,
    sourceHandle,
  )

  return {
    ...result,
    sourceX: sourceAnchor.x,
    sourceY: sourceAnchor.y,
    targetX: targetAnchor.x,
    targetY: targetAnchor.y,
    endAngle,
    startAngle,
  }
}
