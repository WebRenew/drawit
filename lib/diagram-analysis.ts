import type { CanvasElement } from "./types"

export interface DiagramIssue {
  type: "overlap" | "poor-spacing" | "misalignment" | "orphaned" | "invalid-connection"
  severity: "low" | "medium" | "high"
  description: string
  elementIds: string[]
  suggestion?: string
}

export interface DiagramAnalysis {
  issues: DiagramIssue[]
  overallQuality: "excellent" | "good" | "fair" | "poor"
  suggestions: string[]
}

/**
 * Analyze a diagram for common issues
 */
export function analyzeDiagram(elements: CanvasElement[]): DiagramAnalysis {
  const issues: DiagramIssue[] = []

  // Check for overlaps
  const overlapIssues = checkOverlaps(elements)
  issues.push(...overlapIssues)

  // Check spacing
  const spacingIssues = checkSpacing(elements)
  issues.push(...spacingIssues)

  // Check alignment
  const alignmentIssues = checkAlignment(elements)
  issues.push(...alignmentIssues)

  // Check for orphaned elements
  const orphanedIssues = checkOrphaned(elements)
  issues.push(...orphanedIssues)

  // Check connection validity
  const connectionIssues = checkConnections(elements)
  issues.push(...connectionIssues)

  // Calculate overall quality
  const highSeverity = issues.filter((i) => i.severity === "high").length
  const mediumSeverity = issues.filter((i) => i.severity === "medium").length
  const lowSeverity = issues.filter((i) => i.severity === "low").length

  let overallQuality: "excellent" | "good" | "fair" | "poor"
  if (highSeverity === 0 && mediumSeverity === 0 && lowSeverity === 0) {
    overallQuality = "excellent"
  } else if (highSeverity === 0 && mediumSeverity <= 1) {
    overallQuality = "good"
  } else if (highSeverity === 0) {
    overallQuality = "fair"
  } else {
    overallQuality = "poor"
  }

  // Generate suggestions
  const suggestions = generateSuggestions(issues)

  return {
    issues,
    overallQuality,
    suggestions,
  }
}

function checkOverlaps(elements: CanvasElement[]): DiagramIssue[] {
  const issues: DiagramIssue[] = []
  const shapes = elements.filter((e) => e.type === "rectangle" || e.type === "ellipse" || e.type === "diamond")

  for (let i = 0; i < shapes.length; i++) {
    for (let j = i + 1; j < shapes.length; j++) {
      const a = shapes[i]
      const b = shapes[j]

      if (isOverlapping(a, b)) {
        issues.push({
          type: "overlap",
          severity: "high",
          description: `Elements overlap significantly`,
          elementIds: [a.id, b.id],
          suggestion: `Move elements apart or adjust their sizes to prevent overlap`,
        })
      }
    }
  }

  return issues
}

function checkSpacing(elements: CanvasElement[]): DiagramIssue[] {
  const issues: DiagramIssue[] = []
  const shapes = elements.filter((e) => e.type === "rectangle" || e.type === "ellipse" || e.type === "diamond")

  const MIN_SPACING = 30
  const IDEAL_SPACING = 80

  for (let i = 0; i < shapes.length; i++) {
    for (let j = i + 1; j < shapes.length; j++) {
      const a = shapes[i]
      const b = shapes[j]

      const distance = getDistance(a, b)

      if (distance < MIN_SPACING && !isOverlapping(a, b)) {
        issues.push({
          type: "poor-spacing",
          severity: "medium",
          description: `Elements are too close together (${Math.round(distance)}px apart)`,
          elementIds: [a.id, b.id],
          suggestion: `Increase spacing to at least ${IDEAL_SPACING}px for better readability`,
        })
      }
    }
  }

  return issues
}

function checkAlignment(elements: CanvasElement[]): DiagramIssue[] {
  const issues: DiagramIssue[] = []
  const shapes = elements.filter((e) => e.type === "rectangle" || e.type === "ellipse" || e.type === "diamond")

  const ALIGNMENT_THRESHOLD = 10

  // Check for near-aligned elements (slightly misaligned)
  const groups: CanvasElement[][] = []

  for (const shape of shapes) {
    let addedToGroup = false

    for (const group of groups) {
      const first = group[0]
      if (Math.abs(shape.x - first.x) < ALIGNMENT_THRESHOLD || Math.abs(shape.y - first.y) < ALIGNMENT_THRESHOLD) {
        group.push(shape)
        addedToGroup = true
        break
      }
    }

    if (!addedToGroup) {
      groups.push([shape])
    }
  }

  for (const group of groups) {
    if (group.length >= 2) {
      const xVariance = Math.max(...group.map((s) => s.x)) - Math.min(...group.map((s) => s.x))
      const yVariance = Math.max(...group.map((s) => s.y)) - Math.min(...group.map((s) => s.y))

      if (xVariance > 0 && xVariance < ALIGNMENT_THRESHOLD) {
        issues.push({
          type: "misalignment",
          severity: "low",
          description: `Elements are slightly misaligned horizontally (${Math.round(xVariance)}px variance)`,
          elementIds: group.map((s) => s.id),
          suggestion: `Align elements to a common X coordinate for a cleaner look`,
        })
      }

      if (yVariance > 0 && yVariance < ALIGNMENT_THRESHOLD) {
        issues.push({
          type: "misalignment",
          severity: "low",
          description: `Elements are slightly misaligned vertically (${Math.round(yVariance)}px variance)`,
          elementIds: group.map((s) => s.id),
          suggestion: `Align elements to a common Y coordinate for a cleaner look`,
        })
      }
    }
  }

  return issues
}

function checkOrphaned(elements: CanvasElement[]): DiagramIssue[] {
  const issues: DiagramIssue[] = []
  const shapes = elements.filter((e) => e.type === "rectangle" || e.type === "ellipse" || e.type === "diamond")
  const connections = elements.filter((e) => e.type === "arrow" || e.type === "line")

  for (const shape of shapes) {
    const hasConnection = connections.some((conn) => {
      const _connCenterX = conn.x + conn.width / 2
      const _connCenterY = conn.y + conn.height / 2
      const shapeCenterX = shape.x + shape.width / 2
      const shapeCenterY = shape.y + shape.height / 2

      // Check if connection starts or ends near this shape
      const distToStart = Math.sqrt(Math.pow(conn.x - shapeCenterX, 2) + Math.pow(conn.y - shapeCenterY, 2))
      const distToEnd = Math.sqrt(
        Math.pow(conn.x + conn.width - shapeCenterX, 2) + Math.pow(conn.y + conn.height - shapeCenterY, 2),
      )

      return distToStart < 100 || distToEnd < 100
    })

    if (!hasConnection && shapes.length > 1) {
      issues.push({
        type: "orphaned",
        severity: "medium",
        description: `Element has no connections to other elements`,
        elementIds: [shape.id],
        suggestion: `Add connections to integrate this element into the diagram or remove it if not needed`,
      })
    }
  }

  return issues
}

function checkConnections(elements: CanvasElement[]): DiagramIssue[] {
  const issues: DiagramIssue[] = []
  const connections = elements.filter((e) => e.type === "arrow" || e.type === "line")

  for (const conn of connections) {
    // Check for very short connections
    const length = Math.sqrt(Math.pow(conn.width, 2) + Math.pow(conn.height, 2))
    if (length < 20) {
      issues.push({
        type: "invalid-connection",
        severity: "low",
        description: `Connection is very short (${Math.round(length)}px)`,
        elementIds: [conn.id],
        suggestion: `This might be a duplicate or unintended connection`,
      })
    }

    // Check for very long connections
    if (length > 800) {
      issues.push({
        type: "invalid-connection",
        severity: "low",
        description: `Connection is very long (${Math.round(length)}px)`,
        elementIds: [conn.id],
        suggestion: `Consider adding intermediate nodes to break up long connections`,
      })
    }
  }

  return issues
}

function isOverlapping(a: CanvasElement, b: CanvasElement): boolean {
  return !(a.x + a.width < b.x || b.x + b.width < a.x || a.y + a.height < b.y || b.y + b.height < a.y)
}

function getDistance(a: CanvasElement, b: CanvasElement): number {
  const aCenterX = a.x + a.width / 2
  const aCenterY = a.y + a.height / 2
  const bCenterX = b.x + b.width / 2
  const bCenterY = b.y + b.height / 2

  return Math.sqrt(Math.pow(bCenterX - aCenterX, 2) + Math.pow(bCenterY - aCenterY, 2))
}

function generateSuggestions(issues: DiagramIssue[]): string[] {
  const suggestions: string[] = []

  const highIssues = issues.filter((i) => i.severity === "high")
  const mediumIssues = issues.filter((i) => i.severity === "medium")

  if (highIssues.length > 0) {
    suggestions.push(`Fix ${highIssues.length} high-severity issue(s) first: overlapping elements need to be separated`)
  }

  if (mediumIssues.length > 0) {
    suggestions.push(
      `Address ${mediumIssues.length} spacing issue(s): increase distances between close elements for better clarity`,
    )
  }

  const orphanedCount = issues.filter((i) => i.type === "orphaned").length
  if (orphanedCount > 0) {
    suggestions.push(`Connect ${orphanedCount} orphaned element(s) or remove if not part of the diagram`)
  }

  const misalignedCount = issues.filter((i) => i.type === "misalignment").length
  if (misalignedCount > 0) {
    suggestions.push(`Align elements to improve visual consistency and professionalism`)
  }

  if (suggestions.length === 0) {
    suggestions.push(`Diagram looks great! No major issues detected.`)
  }

  return suggestions
}

/**
 * Beautify a diagram by fixing common issues
 */
export function beautifyDiagram(elements: CanvasElement[]): Partial<CanvasElement>[] {
  const updates: Partial<CanvasElement>[] = []
  const shapes = elements.filter((e) => e.type === "rectangle" || e.type === "ellipse" || e.type === "diamond")

  // Fix alignment issues
  const ALIGNMENT_THRESHOLD = 15
  const groups: CanvasElement[][] = []

  for (const shape of shapes) {
    let addedToGroup = false

    for (const group of groups) {
      const first = group[0]
      if (Math.abs(shape.x - first.x) < ALIGNMENT_THRESHOLD) {
        group.push(shape)
        addedToGroup = true
        break
      }
    }

    if (!addedToGroup) {
      groups.push([shape])
    }
  }

  // Align horizontally
  for (const group of groups) {
    if (group.length >= 2) {
      const avgX = group.reduce((sum, s) => sum + s.x, 0) / group.length
      for (const shape of group) {
        if (Math.abs(shape.x - avgX) < ALIGNMENT_THRESHOLD) {
          updates.push({
            id: shape.id,
            x: Math.round(avgX),
          })
        }
      }
    }
  }

  // Fix spacing - ensure minimum spacing between nearby elements
  const MIN_SPACING = 80
  for (let i = 0; i < shapes.length; i++) {
    for (let j = i + 1; j < shapes.length; j++) {
      const a = shapes[i]
      const b = shapes[j]

      const distance = getDistance(a, b)

      if (distance < MIN_SPACING && !isOverlapping(a, b)) {
        // Move b away from a
        const aCenterX = a.x + a.width / 2
        const aCenterY = a.y + a.height / 2
        const bCenterX = b.x + b.width / 2
        const bCenterY = b.y + b.height / 2

        const angle = Math.atan2(bCenterY - aCenterY, bCenterX - aCenterX)
        const newBCenterX = aCenterX + Math.cos(angle) * MIN_SPACING
        const newBCenterY = aCenterY + Math.sin(angle) * MIN_SPACING

        updates.push({
          id: b.id,
          x: Math.round(newBCenterX - b.width / 2),
          y: Math.round(newBCenterY - b.height / 2),
        })
      }
    }
  }

  return updates
}
