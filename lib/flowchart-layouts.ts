export type FlowchartNodeType = "start" | "end" | "process" | "decision" | "data" | "document"
export type FlowDirection = "vertical" | "horizontal"

export interface FlowchartStep {
  id: string
  type: FlowchartNodeType
  label: string
  swimlane?: string
  decisions?: Array<{ label: string; targetId: string }>
}

export interface FlowchartConnection {
  from: string
  to: string
  label?: string
}

export interface FlowchartLayout {
  nodes: Array<{
    id: string
    x: number
    y: number
    width: number
    height: number
    type: FlowchartNodeType
    label: string
    swimlane?: string
  }>
  edges: Array<{
    from: string
    to: string
    label?: string
    points?: Array<{ x: number; y: number }>
  }>
  swimlanes?: Array<{
    name: string
    x: number
    y: number
    width: number
    height: number
  }>
}

const NODE_DIMENSIONS: Record<FlowchartNodeType, { width: number; height: number }> = {
  start: { width: 140, height: 50 },
  end: { width: 140, height: 50 },
  process: { width: 180, height: 60 },
  decision: { width: 160, height: 80 },
  data: { width: 180, height: 60 },
  document: { width: 180, height: 70 },
}

function calculateNodeWidth(label: string, baseWidth: number): number {
  const charWidth = 8 // approximate pixels per character
  const padding = 40 // padding on both sides
  const textWidth = label.length * charWidth + padding
  return Math.max(baseWidth, Math.min(textWidth, 280)) // clamp between base and 280px
}

export function calculateFlowchartLayout(
  steps: FlowchartStep[],
  connections: FlowchartConnection[],
  direction: FlowDirection = "vertical",
  spacing = 100,
  swimlanes?: string[],
): FlowchartLayout {
  const nodes: FlowchartLayout["nodes"] = []
  const edges: FlowchartLayout["edges"] = []

  // Build adjacency list for flow connections
  const outgoing = new Map<string, string[]>()
  const incoming = new Map<string, string[]>()
  connections.forEach((conn) => {
    if (!outgoing.has(conn.from)) outgoing.set(conn.from, [])
    outgoing.get(conn.from)!.push(conn.to)
    if (!incoming.has(conn.to)) incoming.set(conn.to, [])
    incoming.get(conn.to)!.push(conn.from)
  })

  // Assign layers using BFS for hierarchical layout
  const layers = new Map<string, number>()
  const visited = new Set<string>()

  // Find start nodes (nodes with no incoming connections)
  const hasIncoming = new Set(connections.map((c) => c.to))
  const startNodes = steps.filter((s) => !hasIncoming.has(s.id))

  if (startNodes.length === 0 && steps.length > 0) {
    startNodes.push(steps[0])
  }

  // BFS to assign layers
  const queue = startNodes.map((n) => ({ id: n.id, layer: 0 }))
  while (queue.length > 0) {
    const { id, layer } = queue.shift()!
    if (visited.has(id)) {
      // Update layer if we found a longer path
      layers.set(id, Math.max(layers.get(id) || 0, layer))
      continue
    }

    visited.add(id)
    layers.set(id, layer)

    const next = outgoing.get(id) || []
    next.forEach((nextId) => {
      queue.push({ id: nextId, layer: layer + 1 })
    })
  }

  // Assign any unvisited nodes
  steps.forEach((step) => {
    if (!layers.has(step.id)) {
      layers.set(step.id, 0)
    }
  })

  // Group nodes by layer
  const nodesByLayer = new Map<number, FlowchartStep[]>()
  steps.forEach((step) => {
    const layer = layers.get(step.id)!
    if (!nodesByLayer.has(layer)) nodesByLayer.set(layer, [])
    nodesByLayer.get(layer)!.push(step)
  })

  // Calculate swimlane positions if needed
  const swimlaneLayouts: FlowchartLayout["swimlanes"] = []
  const swimlaneIndexMap = new Map<string, number>()

  if (swimlanes && swimlanes.length > 0) {
    const swimlaneHeight = direction === "vertical" ? 800 : 400
    const swimlaneWidth = direction === "vertical" ? 400 : 1200

    swimlanes.forEach((name, index) => {
      swimlaneIndexMap.set(name, index)
      if (direction === "vertical") {
        swimlaneLayouts.push({
          name,
          x: index * (swimlaneWidth + 50),
          y: 0,
          width: swimlaneWidth,
          height: swimlaneHeight,
        })
      } else {
        swimlaneLayouts.push({
          name,
          x: 0,
          y: index * (swimlaneHeight + 50),
          width: swimlaneWidth,
          height: swimlaneHeight,
        })
      }
    })
  }

  const maxLayer = Math.max(...Array.from(nodesByLayer.keys()), 0)
  const maxNodesInLayer = Math.max(...Array.from(nodesByLayer.values()).map((n) => n.length), 1)

  // Calculate starting position to center the diagram
  const avgNodeWidth = 180
  const avgNodeHeight = 60
  const horizontalGap = 80
  const verticalGap = spacing

  const totalWidth =
    direction === "vertical"
      ? maxNodesInLayer * (avgNodeWidth + horizontalGap)
      : (maxLayer + 1) * (avgNodeWidth + verticalGap)
  const totalHeight =
    direction === "vertical"
      ? (maxLayer + 1) * (avgNodeHeight + verticalGap)
      : maxNodesInLayer * (avgNodeHeight + horizontalGap)

  // Center around viewport center (assume 1200x800 canvas)
  const startX = 600 - totalWidth / 2
  const startY = 400 - totalHeight / 2

  // Position nodes by layer
  for (let layer = 0; layer <= maxLayer; layer++) {
    const layerNodes = nodesByLayer.get(layer) || []
    const layerWidth = layerNodes.reduce((sum, step) => {
      const dims = NODE_DIMENSIONS[step.type]
      return sum + calculateNodeWidth(step.label, dims.width) + horizontalGap
    }, -horizontalGap)

    let currentX =
      direction === "vertical" ? startX + (totalWidth - layerWidth) / 2 : startX + layer * (avgNodeWidth + verticalGap)
    const currentY = direction === "vertical" ? startY + layer * (avgNodeHeight + verticalGap) : startY

    layerNodes.forEach((step, indexInLayer) => {
      const baseDims = NODE_DIMENSIONS[step.type]
      const width = calculateNodeWidth(step.label, baseDims.width)
      const height = baseDims.height

      // Determine swimlane offset
      let swimlaneOffsetX = 0
      let swimlaneOffsetY = 0

      if (step.swimlane && swimlaneIndexMap.has(step.swimlane)) {
        const swimlaneIndex = swimlaneIndexMap.get(step.swimlane)!
        if (direction === "vertical") {
          swimlaneOffsetX = swimlaneIndex * 450
        } else {
          swimlaneOffsetY = swimlaneIndex * 450
        }
      }

      let x: number, y: number

      if (direction === "vertical") {
        x = swimlaneOffsetX + currentX
        y = currentY
        currentX += width + horizontalGap
      } else {
        x = currentX
        y = swimlaneOffsetY + currentY + indexInLayer * (height + horizontalGap)
      }

      nodes.push({
        id: step.id,
        x,
        y,
        width,
        height,
        type: step.type,
        label: step.label,
        swimlane: step.swimlane,
      })
    })
  }

  connections.forEach((conn) => {
    const fromNode = nodes.find((n) => n.id === conn.from)
    const toNode = nodes.find((n) => n.id === conn.to)

    if (fromNode && toNode) {
      // Calculate anchor points based on relative positions
      let fromX: number, fromY: number, toX: number, toY: number

      if (direction === "vertical") {
        // Vertical flow: connect bottom of from to top of to
        fromX = fromNode.x + fromNode.width / 2
        fromY = fromNode.y + fromNode.height
        toX = toNode.x + toNode.width / 2
        toY = toNode.y
      } else {
        // Horizontal flow: connect right of from to left of to
        fromX = fromNode.x + fromNode.width
        fromY = fromNode.y + fromNode.height / 2
        toX = toNode.x
        toY = toNode.y + toNode.height / 2
      }

      edges.push({
        from: conn.from,
        to: conn.to,
        label: conn.label,
        points: [
          { x: fromX, y: fromY },
          { x: toX, y: toY },
        ],
      })
    }
  })

  return {
    nodes,
    edges,
    swimlanes: swimlaneLayouts.length > 0 ? swimlaneLayouts : undefined,
  }
}
