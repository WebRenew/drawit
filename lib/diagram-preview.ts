export interface DiagramPreview {
  nodes: PreviewNode[]
  edges: PreviewEdge[]
  estimatedBounds: { width: number; height: number }
  qualityScore: number
  warnings: string[]
}

export interface PreviewNode {
  id: string
  x: number
  y: number
  width: number
  height: number
  label?: string
  type: string
}

export interface PreviewEdge {
  from: string
  to: string
  fromX: number
  fromY: number
  toX: number
  toY: number
  label?: string
}

/**
 * Generate a preview of what a diagram will look like before creating it
 */
export function generateDiagramPreview(
  nodes: Array<{ id: string; label?: string; width?: number; height?: number; type?: string }>,
  edges: Array<{ from: string; to: string; label?: string }>,
  layout: "tree" | "circular" | "grid" | "force-directed",
  layoutOptions?: Record<string, unknown>,
): DiagramPreview {
  // Import layout functions dynamically to avoid circular dependencies
  const { calculateTreeLayout, calculateCircularLayout, calculateGridLayout, calculateForceDirectedLayout } =
    require("./diagram-layouts")

  let nodePositions: Map<string, { x: number; y: number; width: number; height: number }>

  // Calculate layout based on type
  switch (layout) {
    case "tree":
      nodePositions = calculateTreeLayout(
        nodes.map((n) => ({ id: n.id, width: n.width || 150, height: n.height || 80 })),
        edges,
        layoutOptions,
      )
      break
    case "circular":
      nodePositions = calculateCircularLayout(
        nodes.map((n) => ({ id: n.id, width: n.width || 150, height: n.height || 80 })),
        layoutOptions?.radius || 250,
      )
      break
    case "grid":
      nodePositions = calculateGridLayout(
        nodes.map((n) => ({ id: n.id, width: n.width || 150, height: n.height || 80 })),
        layoutOptions?.columns || 3,
        layoutOptions?.rowSpacing || 150,
        layoutOptions?.colSpacing || 200,
      )
      break
    case "force-directed":
      nodePositions = calculateForceDirectedLayout(
        nodes.map((n) => ({ id: n.id, width: n.width || 150, height: n.height || 80 })),
        edges,
        layoutOptions?.iterations || 100,
      )
      break
    default:
      nodePositions = new Map()
  }

  // Build preview nodes
  const previewNodes: PreviewNode[] = []
  let minX = Number.POSITIVE_INFINITY,
    minY = Number.POSITIVE_INFINITY,
    maxX = Number.NEGATIVE_INFINITY,
    maxY = Number.NEGATIVE_INFINITY

  for (const node of nodes) {
    const pos = nodePositions.get(node.id)
    if (!pos) continue

    previewNodes.push({
      id: node.id,
      x: pos.x,
      y: pos.y,
      width: pos.width,
      height: pos.height,
      label: node.label,
      type: node.type || "rectangle",
    })

    minX = Math.min(minX, pos.x)
    minY = Math.min(minY, pos.y)
    maxX = Math.max(maxX, pos.x + pos.width)
    maxY = Math.max(maxY, pos.y + pos.height)
  }

  // Build preview edges
  const previewEdges: PreviewEdge[] = []
  for (const edge of edges) {
    const fromNode = previewNodes.find((n) => n.id === edge.from)
    const toNode = previewNodes.find((n) => n.id === edge.to)
    if (!fromNode || !toNode) continue

    previewEdges.push({
      from: edge.from,
      to: edge.to,
      fromX: fromNode.x + fromNode.width / 2,
      fromY: fromNode.y + fromNode.height / 2,
      toX: toNode.x + toNode.width / 2,
      toY: toNode.y + toNode.height / 2,
      label: edge.label,
    })
  }

  // Check for issues
  const warnings: string[] = []
  let qualityScore = 100

  // Check for overlaps
  for (let i = 0; i < previewNodes.length; i++) {
    for (let j = i + 1; j < previewNodes.length; j++) {
      const n1 = previewNodes[i]
      const n2 = previewNodes[j]
      if (n1.x < n2.x + n2.width && n1.x + n1.width > n2.x && n1.y < n2.y + n2.height && n1.y + n1.height > n2.y) {
        warnings.push(`Nodes "${n1.id}" and "${n2.id}" overlap`)
        qualityScore -= 10
      }
    }
  }

  // Check for poor spacing (too close)
  for (let i = 0; i < previewNodes.length; i++) {
    for (let j = i + 1; j < previewNodes.length; j++) {
      const n1 = previewNodes[i]
      const n2 = previewNodes[j]
      const dx = n1.x + n1.width / 2 - (n2.x + n2.width / 2)
      const dy = n1.y + n1.height / 2 - (n2.y + n2.height / 2)
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < 100) {
        warnings.push(`Nodes "${n1.id}" and "${n2.id}" are very close (${Math.round(distance)}px apart)`)
        qualityScore -= 5
      }
    }
  }

  // Check for out of bounds
  if (minX < 0 || minY < 0 || maxX > 2000 || maxY > 1500) {
    warnings.push("Some nodes are outside canvas bounds")
    qualityScore -= 15
  }

  return {
    nodes: previewNodes,
    edges: previewEdges,
    estimatedBounds: {
      width: maxX - minX,
      height: maxY - minY,
    },
    qualityScore: Math.max(0, qualityScore),
    warnings,
  }
}
