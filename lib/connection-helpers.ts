/**
 * Connection Helper Functions
 * Calculate smart connection points, curved paths, and edge intersections
 */

export type ConnectionAnchor = "center" | "top" | "right" | "bottom" | "left" | "auto"
export type ConnectionCurve = "straight" | "curved" | "orthogonal"

export interface ShapeBounds {
  x: number
  y: number
  width: number
  height: number
  type?: "rectangle" | "ellipse" | "diamond"
}

/**
 * Calculate the center point of a shape
 */
export function getShapeCenter(shape: ShapeBounds): { x: number; y: number } {
  return {
    x: shape.x + shape.width / 2,
    y: shape.y + shape.height / 2,
  }
}

/**
 * Calculate anchor point on a shape
 */
export function getAnchorPoint(shape: ShapeBounds, anchor: ConnectionAnchor): { x: number; y: number } {
  const center = getShapeCenter(shape)

  switch (anchor) {
    case "center":
      return center
    case "top":
      return { x: center.x, y: shape.y }
    case "right":
      return { x: shape.x + shape.width, y: center.y }
    case "bottom":
      return { x: center.x, y: shape.y + shape.height }
    case "left":
      return { x: shape.x, y: center.y }
    case "auto":
      // Auto will be calculated based on angle in the edge intersection function
      return center
    default:
      return center
  }
}

/**
 * Calculate edge intersection point for lines connecting shapes
 * Returns the point where the line from center intersects the shape boundary
 */
export function calculateEdgeIntersection(shape: ShapeBounds, angle: number): { x: number; y: number } {
  const center = getShapeCenter(shape)
  const halfWidth = shape.width / 2
  const halfHeight = shape.height / 2

  // Normalize angle to [0, 2π]
  const normalizedAngle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)

  if (shape.type === "ellipse") {
    // For ellipse, calculate intersection with ellipse equation
    const x = center.x + halfWidth * Math.cos(normalizedAngle)
    const y = center.y + halfHeight * Math.sin(normalizedAngle)
    return { x, y }
  } else if (shape.type === "diamond") {
    // Diamond is rotated 45 degrees
    // Use line-line intersection with diamond edges
    const cos = Math.cos(normalizedAngle)
    const sin = Math.sin(normalizedAngle)

    // Calculate which diamond edge the ray intersects
    const tanAngle = Math.abs(Math.tan(normalizedAngle))
    const diamondSlope = halfHeight / halfWidth

    let x, y

    if (tanAngle <= diamondSlope) {
      // Intersects left or right edge
      if (cos > 0) {
        // Right edge
        x = center.x + halfWidth
        y = center.y + halfHeight * (1 - (x - center.x) / halfWidth)
      } else {
        // Left edge
        x = center.x - halfWidth
        y = center.y + halfHeight * (1 + (x - center.x) / halfWidth)
      }
    } else {
      // Intersects top or bottom edge
      if (sin < 0) {
        // Top edge
        y = center.y - halfHeight
        x = center.x + halfWidth * (1 + (y - center.y) / halfHeight)
      } else {
        // Bottom edge
        y = center.y + halfHeight
        x = center.x + halfWidth * (1 - (y - center.y) / halfHeight)
      }
    }

    return { x, y }
  } else {
    // Rectangle: find intersection with rectangle edges
    const cos = Math.cos(normalizedAngle)
    const sin = Math.sin(normalizedAngle)

    // Calculate distances to edges along the ray
    let x, y

    const tanAngle = Math.abs(Math.tan(normalizedAngle))
    const rectRatio = halfHeight / halfWidth

    if (tanAngle <= rectRatio) {
      // Intersects left or right edge
      if (cos > 0) {
        x = center.x + halfWidth
        y = center.y + halfWidth * Math.tan(normalizedAngle)
      } else {
        x = center.x - halfWidth
        y = center.y - halfWidth * Math.tan(normalizedAngle - Math.PI)
      }
    } else {
      // Intersects top or bottom edge
      if (sin < 0) {
        y = center.y - halfHeight
        x = center.x - halfHeight / Math.tan(normalizedAngle)
      } else {
        y = center.y + halfHeight
        x = center.x + halfHeight / Math.tan(normalizedAngle)
      }
    }

    return { x, y }
  }
}

/**
 * Calculate optimal anchor based on direction between two shapes
 */
export function calculateAutoAnchor(
  from: ShapeBounds,
  to: ShapeBounds,
): {
  fromAnchor: ConnectionAnchor
  toAnchor: ConnectionAnchor
} {
  const fromCenter = getShapeCenter(from)
  const toCenter = getShapeCenter(to)

  const dx = toCenter.x - fromCenter.x
  const dy = toCenter.y - fromCenter.y
  const _angle = Math.atan2(dy, dx)

  // Determine primary direction
  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)

  let fromAnchor: ConnectionAnchor
  let toAnchor: ConnectionAnchor

  if (absDx > absDy * 1.5) {
    // Primarily horizontal
    fromAnchor = dx > 0 ? "right" : "left"
    toAnchor = dx > 0 ? "left" : "right"
  } else if (absDy > absDx * 1.5) {
    // Primarily vertical
    fromAnchor = dy > 0 ? "bottom" : "top"
    toAnchor = dy > 0 ? "top" : "bottom"
  } else {
    // Diagonal - use angle-based intersection
    fromAnchor = "auto"
    toAnchor = "auto"
  }

  return { fromAnchor, toAnchor }
}

/**
 * Calculate connection points between two shapes with specified anchors
 */
export function calculateConnection(
  from: ShapeBounds,
  to: ShapeBounds,
  fromAnchor: ConnectionAnchor = "auto",
  toAnchor: ConnectionAnchor = "auto",
): {
  start: { x: number; y: number }
  end: { x: number; y: number }
} {
  // If auto, determine optimal anchors
  if (fromAnchor === "auto" || toAnchor === "auto") {
    const autoAnchors = calculateAutoAnchor(from, to)
    if (fromAnchor === "auto") fromAnchor = autoAnchors.fromAnchor
    if (toAnchor === "auto") toAnchor = autoAnchors.toAnchor
  }

  // If still auto (diagonal case), use edge intersection
  const fromCenter = getShapeCenter(from)
  const toCenter = getShapeCenter(to)
  const angle = Math.atan2(toCenter.y - fromCenter.y, toCenter.x - fromCenter.x)

  let start: { x: number; y: number }
  let end: { x: number; y: number }

  if (fromAnchor === "auto") {
    start = calculateEdgeIntersection(from, angle)
  } else {
    start = getAnchorPoint(from, fromAnchor)
  }

  if (toAnchor === "auto") {
    end = calculateEdgeIntersection(to, angle + Math.PI)
  } else {
    end = getAnchorPoint(to, toAnchor)
  }

  return { start, end }
}

/**
 * Calculate curved path control points for bezier curves
 */
export function calculateCurvedPath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  curveAmount = 0.3,
): {
  controlPoint1: { x: number; y: number }
  controlPoint2: { x: number; y: number }
} {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  // Calculate perpendicular offset for curve
  const offsetDistance = distance * curveAmount
  const perpX = -dy / distance
  const perpY = dx / distance

  // Control points offset perpendicular to the line
  const midX = (start.x + end.x) / 2
  const midY = (start.y + end.y) / 2

  const controlPoint1 = {
    x: midX + perpX * offsetDistance,
    y: midY + perpY * offsetDistance,
  }

  const controlPoint2 = {
    x: midX + perpX * offsetDistance,
    y: midY + perpY * offsetDistance,
  }

  return { controlPoint1, controlPoint2 }
}

/**
 * Calculate orthogonal (right-angle) path between two points
 */
export function calculateOrthogonalPath(
  start: { x: number; y: number },
  end: { x: number; y: number },
): Array<{ x: number; y: number }> {
  const dx = end.x - start.x
  const _dy = end.y - start.y

  // Create right-angle path with midpoint
  const midX = start.x + dx / 2

  return [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end]
}

/**
 * Offset arrow endpoint slightly to avoid overlapping with shape fill
 */
export function calculateArrowOffset(
  point: { x: number; y: number },
  angle: number,
  offset = 10,
): { x: number; y: number } {
  return {
    x: point.x - offset * Math.cos(angle),
    y: point.y - offset * Math.sin(angle),
  }
}
