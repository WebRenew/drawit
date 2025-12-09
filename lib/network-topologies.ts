import type { Node, Edge, LayoutResult } from "./diagram-layouts"
import { forceDirectedLayout } from "./diagram-layouts"

export interface NetworkNode {
  id: string
  label: string
  type?: "server" | "client" | "router" | "switch" | "database" | "cloud" | "device"
  icon?: string
}

export interface NetworkLink {
  from: string
  to: string
  label?: string
  bandwidth?: string
}

/**
 * Star topology: one central hub with all other nodes connected to it
 */
export function starTopology(nodes: NetworkNode[], centerNodeId: string): LayoutResult {
  const centerX = 500
  const centerY = 400
  const radius = 250

  const result = new Map<string, { x: number; y: number; width: number; height: number }>()
  let maxX = 0
  let maxY = 0

  const centerNode = nodes.find((n) => n.id === centerNodeId)
  const peripheralNodes = nodes.filter((n) => n.id !== centerNodeId)

  if (!centerNode) {
    throw new Error(`Center node ${centerNodeId} not found`)
  }

  // Position center node
  const centerWidth = 120
  const centerHeight = 120
  result.set(centerNode.id, {
    x: centerX - centerWidth / 2,
    y: centerY - centerHeight / 2,
    width: centerWidth,
    height: centerHeight,
  })

  // Position peripheral nodes in a circle
  peripheralNodes.forEach((node, index) => {
    const angle = (2 * Math.PI * index) / peripheralNodes.length - Math.PI / 2
    const width = 100
    const height = 100

    const x = centerX + radius * Math.cos(angle) - width / 2
    const y = centerY + radius * Math.sin(angle) - height / 2

    result.set(node.id, { x, y, width, height })
    maxX = Math.max(maxX, x + width)
    maxY = Math.max(maxY, y + height)
  })

  maxX = Math.max(maxX, centerX + centerWidth / 2)
  maxY = Math.max(maxY, centerY + centerHeight / 2)

  return {
    nodes: result,
    bounds: { width: maxX + 100, height: maxY + 100 },
  }
}

/**
 * Ring topology: nodes arranged in a circle, each connected to next
 */
export function ringTopology(nodes: NetworkNode[]): LayoutResult {
  const centerX = 500
  const centerY = 400
  const radius = 250

  const result = new Map<string, { x: number; y: number; width: number; height: number }>()
  let maxX = 0
  let maxY = 0

  nodes.forEach((node, index) => {
    const angle = (2 * Math.PI * index) / nodes.length - Math.PI / 2
    const width = 100
    const height = 100

    const x = centerX + radius * Math.cos(angle) - width / 2
    const y = centerY + radius * Math.sin(angle) - height / 2

    result.set(node.id, { x, y, width, height })
    maxX = Math.max(maxX, x + width)
    maxY = Math.max(maxY, y + height)
  })

  return {
    nodes: result,
    bounds: { width: maxX + 100, height: maxY + 100 },
  }
}

/**
 * Mesh topology: all nodes interconnected (uses force-directed layout)
 */
export function meshTopology(nodes: NetworkNode[], links: NetworkLink[]): LayoutResult {
  // Convert to generic node/edge format for force-directed layout
  const layoutNodes: Node[] = nodes.map((n) => ({
    id: n.id,
    label: n.label,
    width: 100,
    height: 100,
  }))

  const layoutEdges: Edge[] = links.map((l) => ({
    from: l.from,
    to: l.to,
    type: "line",
    label: l.label,
  }))

  return forceDirectedLayout(layoutNodes, layoutEdges, {
    iterations: 150,
    repulsion: 6000,
    attraction: 0.015,
  })
}

/**
 * Tree topology: hierarchical structure (root at top, children below)
 */
export function treeTopology(nodes: NetworkNode[], links: NetworkLink[], rootNodeId: string): LayoutResult {
  const spacing = 180
  const verticalSpacing = 150
  const startY = 100

  // Build adjacency list
  const children = new Map<string, string[]>()
  const parents = new Map<string, string>()

  links.forEach((link) => {
    if (!children.has(link.from)) children.set(link.from, [])
    children.get(link.from)!.push(link.to)
    parents.set(link.to, link.from)
  })

  // BFS to assign levels
  const levels: string[][] = []
  const visited = new Set<string>()
  const queue: Array<{ id: string; level: number }> = [{ id: rootNodeId, level: 0 }]

  while (queue.length > 0) {
    const { id, level } = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)

    if (!levels[level]) levels[level] = []
    levels[level].push(id)

    const nodeChildren = children.get(id) || []
    nodeChildren.forEach((childId) => {
      queue.push({ id: childId, level: level + 1 })
    })
  }

  const result = new Map<string, { x: number; y: number; width: number; height: number }>()
  let maxX = 0
  let maxY = 0

  // Position nodes by level
  levels.forEach((levelNodes, levelIndex) => {
    const y = startY + levelIndex * verticalSpacing
    const totalWidth = levelNodes.length * spacing
    const startX = 500 - totalWidth / 2

    levelNodes.forEach((nodeId, index) => {
      const width = 100
      const height = 100
      const x = startX + index * spacing

      result.set(nodeId, { x, y, width, height })
      maxX = Math.max(maxX, x + width)
      maxY = Math.max(maxY, y + height)
    })
  })

  return {
    nodes: result,
    bounds: { width: maxX + 100, height: maxY + 100 },
  }
}

/**
 * Bus topology: all nodes connected to a central line/bus
 */
export function busTopology(nodes: NetworkNode[]): LayoutResult {
  const busStartX = 200
  const busEndX = 1800
  const busY = 400
  const nodeOffset = 150

  const result = new Map<string, { x: number; y: number; width: number; height: number }>()
  let maxX = 0
  let maxY = 0

  const spacing = (busEndX - busStartX) / Math.max(nodes.length - 1, 1)

  nodes.forEach((node, index) => {
    const width = 100
    const height = 100
    const x = busStartX + index * spacing - width / 2
    const y = busY - nodeOffset - height / 2

    result.set(node.id, { x, y, width, height })
    maxX = Math.max(maxX, x + width)
    maxY = Math.max(maxY, y + height)
  })

  return {
    nodes: result,
    bounds: { width: Math.max(maxX, busEndX) + 100, height: busY + 100 },
  }
}

/**
 * Get node style based on network device type
 */
export function getNodeStyleForType(type: NetworkNode["type"], _theme: "light" | "dark" = "light") {
  const styles: Record<
    string,
    {
      shape: "rectangle" | "ellipse" | "diamond"
      strokeColor: string
      backgroundColor: string
    }
  > = {
    server: {
      shape: "rectangle",
      strokeColor: "#364fc7",
      backgroundColor: "#edf2ff",
    },
    client: {
      shape: "ellipse",
      strokeColor: "#1971c2",
      backgroundColor: "#d0ebff",
    },
    router: {
      shape: "diamond",
      strokeColor: "#c2255c",
      backgroundColor: "#ffe0f0",
    },
    switch: {
      shape: "rectangle",
      strokeColor: "#7950f2",
      backgroundColor: "#f3f0ff",
    },
    database: {
      shape: "ellipse",
      strokeColor: "#087f5b",
      backgroundColor: "#e6fcf5",
    },
    cloud: {
      shape: "ellipse",
      strokeColor: "#1098ad",
      backgroundColor: "#e3fafc",
    },
    device: {
      shape: "rectangle",
      strokeColor: "#f59f00",
      backgroundColor: "#fff3bf",
    },
  }

  return styles[type || "device"] || styles.device
}
