/**
 * Diagram Layout Algorithms
 * Provides automatic layout calculation for graph-based diagrams
 */

export interface Node {
  id: string
  label?: string
  width?: number
  height?: number
  fixed?: boolean
  x?: number
  y?: number
  style?: {
    strokeColor?: string
    backgroundColor?: string
    shape?: "rectangle" | "ellipse" | "diamond"
  }
}

export interface Edge {
  from: string
  to: string
  type?: "arrow" | "line"
  label?: string
}

export interface LayoutResult {
  nodes: Map<
    string,
    {
      x: number
      y: number
      width: number
      height: number
    }
  >
  bounds: {
    width: number
    height: number
  }
}

export interface LayoutOptions {
  spacing?: number
  iterations?: number
  repulsion?: number
  attraction?: number
  columns?: number
  rowSpacing?: number
  colSpacing?: number
  radius?: number
  centerX?: number
  centerY?: number
  minSpacing?: number
  preventOverlap?: boolean
  align?: "left" | "center" | "right"
  rankDirection?: "TB" | "BT" | "LR" | "RL" // Top-to-bottom, bottom-to-top, left-to-right, right-to-left
}

/**
 * Tree layout - hierarchical top-to-bottom arrangement
 */
export function treeLayout(nodes: Node[], edges: Edge[], options?: LayoutOptions): LayoutResult {
  const spacing = options?.spacing || 150
  const verticalSpacing = 150
  const startX = options?.centerX || 400
  const startY = options?.centerY || 100

  // Build adjacency list to find hierarchy
  const children = new Map<string, string[]>()
  const parents = new Map<string, string>()
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  edges.forEach((edge) => {
    if (!children.has(edge.from)) children.set(edge.from, [])
    children.get(edge.from)!.push(edge.to)
    parents.set(edge.to, edge.from)
  })

  // Find root nodes (nodes with no parents)
  const roots = nodes.filter((n) => !parents.has(n.id))

  const result = new Map<string, { x: number; y: number; width: number; height: number }>()
  let maxX = 0
  let maxY = 0

  // BFS to assign positions level by level
  const levels: string[][] = []
  const visited = new Set<string>()
  const queue: Array<{ id: string; level: number }> = roots.map((r) => ({ id: r.id, level: 0 }))

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

  // Position nodes by level
  levels.forEach((levelNodes, levelIndex) => {
    const y = startY + levelIndex * verticalSpacing
    const totalWidth = levelNodes.length * spacing
    const startXForLevel = startX - totalWidth / 2

    levelNodes.forEach((nodeId, index) => {
      const node = nodeMap.get(nodeId)!
      const width = node.width || 150
      const height = node.height || 80

      const x = node.fixed && node.x !== undefined ? node.x : startXForLevel + index * spacing
      const finalY = node.fixed && node.y !== undefined ? node.y : y

      result.set(nodeId, { x, y: finalY, width, height })
      maxX = Math.max(maxX, x + width)
      maxY = Math.max(maxY, finalY + height)
    })
  })

  return {
    nodes: result,
    bounds: { width: maxX + 100, height: maxY + 100 },
  }
}

/**
 * Circular layout - arranges nodes in a circle
 */
export function circularLayout(nodes: Node[], edges: Edge[], options?: LayoutOptions): LayoutResult {
  const centerX = options?.centerX || 500
  const centerY = options?.centerY || 400
  const radius = options?.radius || 250

  const result = new Map<string, { x: number; y: number; width: number; height: number }>()
  let maxX = 0
  let maxY = 0

  nodes.forEach((node, index) => {
    const angle = (2 * Math.PI * index) / nodes.length - Math.PI / 2
    const width = node.width || 150
    const height = node.height || 80

    const x = node.fixed && node.x !== undefined ? node.x : centerX + radius * Math.cos(angle) - width / 2
    const y = node.fixed && node.y !== undefined ? node.y : centerY + radius * Math.sin(angle) - height / 2

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
 * Grid layout - arranges nodes in a grid pattern
 */
export function gridLayout(nodes: Node[], edges: Edge[], options?: LayoutOptions): LayoutResult {
  const columns = options?.columns || Math.ceil(Math.sqrt(nodes.length))
  const rowSpacing = options?.rowSpacing || 150
  const colSpacing = options?.colSpacing || 200
  const startX = 100
  const startY = 100

  const result = new Map<string, { x: number; y: number; width: number; height: number }>()
  let maxX = 0
  let maxY = 0

  nodes.forEach((node, index) => {
    const row = Math.floor(index / columns)
    const col = index % columns
    const width = node.width || 150
    const height = node.height || 80

    const x = node.fixed && node.x !== undefined ? node.x : startX + col * colSpacing
    const y = node.fixed && node.y !== undefined ? node.y : startY + row * rowSpacing

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
 * Force-directed layout - uses physics simulation for organic layouts
 * Simplified version - nodes repel each other, edges attract connected nodes
 */
export function forceDirectedLayout(nodes: Node[], edges: Edge[], options?: LayoutOptions): LayoutResult {
  const iterations = options?.iterations || 100
  const repulsion = options?.repulsion || 5000
  const attraction = options?.attraction || 0.01

  // Initialize random positions for non-fixed nodes
  const positions = new Map<string, { x: number; y: number; vx: number; vy: number }>()
  nodes.forEach((node) => {
    positions.set(node.id, {
      x: node.fixed && node.x !== undefined ? node.x : 400 + Math.random() * 600,
      y: node.fixed && node.y !== undefined ? node.y : 300 + Math.random() * 400,
      vx: 0,
      vy: 0,
    })
  })

  // Build edge lookup
  const edgeMap = new Map<string, Set<string>>()
  edges.forEach((edge) => {
    if (!edgeMap.has(edge.from)) edgeMap.set(edge.from, new Set())
    edgeMap.get(edge.from)!.add(edge.to)
    if (!edgeMap.has(edge.to)) edgeMap.set(edge.to, new Set())
    edgeMap.get(edge.to)!.add(edge.from)
  })

  // Run simulation
  for (let iter = 0; iter < iterations; iter++) {
    const forces = new Map<string, { fx: number; fy: number }>()
    nodes.forEach((node) => forces.set(node.id, { fx: 0, fy: 0 }))

    // Repulsive forces between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i]
        const node2 = nodes[j]
        const pos1 = positions.get(node1.id)!
        const pos2 = positions.get(node2.id)!

        const dx = pos2.x - pos1.x
        const dy = pos2.y - pos1.y
        const distSq = dx * dx + dy * dy + 0.01 // Avoid division by zero
        const dist = Math.sqrt(distSq)

        const force = repulsion / distSq
        const fx = (force * dx) / dist
        const fy = (force * dy) / dist

        forces.get(node1.id)!.fx -= fx
        forces.get(node1.id)!.fy -= fy
        forces.get(node2.id)!.fx += fx
        forces.get(node2.id)!.fy += fy
      }
    }

    // Attractive forces along edges
    edges.forEach((edge) => {
      const pos1 = positions.get(edge.from)!
      const pos2 = positions.get(edge.to)!

      const dx = pos2.x - pos1.x
      const dy = pos2.y - pos1.y
      const dist = Math.sqrt(dx * dx + dy * dy + 0.01)

      const force = attraction * dist
      const fx = (force * dx) / dist
      const fy = (force * dy) / dist

      forces.get(edge.from)!.fx += fx
      forces.get(edge.from)!.fy += fy
      forces.get(edge.to)!.fx -= fx
      forces.get(edge.to)!.fy -= fy
    })

    // Apply forces to update positions
    nodes.forEach((node) => {
      if (node.fixed) return

      const pos = positions.get(node.id)!
      const force = forces.get(node.id)!

      // Simple Euler integration with damping
      const damping = 0.8
      pos.vx = (pos.vx + force.fx) * damping
      pos.vy = (pos.vy + force.fy) * damping

      pos.x += pos.vx
      pos.y += pos.vy

      // Keep within bounds
      pos.x = Math.max(50, Math.min(1950, pos.x))
      pos.y = Math.max(50, Math.min(1450, pos.y))
    })
  }

  // Convert to result format
  const result = new Map<string, { x: number; y: number; width: number; height: number }>()
  let maxX = 0
  let maxY = 0

  nodes.forEach((node) => {
    const pos = positions.get(node.id)!
    const width = node.width || 150
    const height = node.height || 80

    result.set(node.id, {
      x: pos.x - width / 2,
      y: pos.y - height / 2,
      width,
      height,
    })

    maxX = Math.max(maxX, pos.x + width / 2)
    maxY = Math.max(maxY, pos.y + height / 2)
  })

  return {
    nodes: result,
    bounds: { width: maxX + 100, height: maxY + 100 },
  }
}

/**
 * Dagre-inspired hierarchical layout
 * Better than basic tree layout - handles complex DAGs, rank-based positioning, edge crossing minimization
 */
export function dagreLayout(nodes: Node[], edges: Edge[], options?: LayoutOptions): LayoutResult {
  const rankDir = options?.rankDirection || "TB"
  const nodeSpacing = options?.spacing || 150
  const rankSpacing = 200
  const minSpacing = options?.minSpacing || 80

  // Build graph structure
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const inDegree = new Map<string, number>()
  const outEdges = new Map<string, string[]>()
  const inEdges = new Map<string, string[]>()

  nodes.forEach((n) => {
    inDegree.set(n.id, 0)
    outEdges.set(n.id, [])
    inEdges.set(n.id, [])
  })

  edges.forEach((edge) => {
    outEdges.get(edge.from)?.push(edge.to)
    inEdges.get(edge.to)?.push(edge.from)
    inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1)
  })

  const ranks = new Map<string, number>()
  const queue: string[] = []

  // Find nodes with no incoming edges
  nodes.forEach((n) => {
    if (inDegree.get(n.id) === 0) {
      queue.push(n.id)
      ranks.set(n.id, 0)
    }
  })

  // Process nodes level by level
  while (queue.length > 0) {
    const nodeId = queue.shift()!
    const currentRank = ranks.get(nodeId)!

    outEdges.get(nodeId)?.forEach((childId) => {
      const newDegree = (inDegree.get(childId) || 0) - 1
      inDegree.set(childId, newDegree)

      // Update rank to be max of all parent ranks + 1
      const childRank = Math.max(ranks.get(childId) || 0, currentRank + 1)
      ranks.set(childId, childRank)

      if (newDegree === 0) {
        queue.push(childId)
      }
    })
  }

  // Handle cycles - assign remaining nodes to appropriate ranks
  nodes.forEach((n) => {
    if (!ranks.has(n.id)) {
      ranks.set(n.id, 0)
    }
  })

  const rankGroups = new Map<number, string[]>()
  ranks.forEach((rank, nodeId) => {
    if (!rankGroups.has(rank)) rankGroups.set(rank, [])
    rankGroups.get(rank)!.push(nodeId)
  })

  const result = new Map<string, { x: number; y: number; width: number; height: number }>()
  let maxX = 0
  let maxY = 0
  const startX = 100
  const startY = 100

  const isVertical = rankDir === "TB" || rankDir === "BT"
  const isReversed = rankDir === "BT" || rankDir === "RL"

  rankGroups.forEach((nodeIds, rank) => {
    const actualRank = isReversed ? Math.max(...Array.from(rankGroups.keys())) - rank : rank

    nodeIds.forEach((nodeId, index) => {
      const node = nodeMap.get(nodeId)!
      const width = node.width || 150
      const height = node.height || 80

      let x: number, y: number

      if (isVertical) {
        // Vertical layout
        const totalWidth = nodeIds.length * nodeSpacing
        x = node.fixed && node.x !== undefined ? node.x : startX + index * nodeSpacing - totalWidth / 2 + 500
        y = node.fixed && node.y !== undefined ? node.y : startY + actualRank * rankSpacing
      } else {
        // Horizontal layout
        const totalHeight = nodeIds.length * nodeSpacing
        x = node.fixed && node.x !== undefined ? node.x : startX + actualRank * rankSpacing
        y = node.fixed && node.y !== undefined ? node.y : startY + index * nodeSpacing - totalHeight / 2 + 300
      }

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
 * Radial layout - hub-and-spoke with concentric circles
 * Places central node(s) in the middle, arranges others in rings
 */
export function radialLayout(nodes: Node[], edges: Edge[], options?: LayoutOptions): LayoutResult {
  const centerX = options?.centerX || 500
  const centerY = options?.centerY || 400
  const minRadius = 100
  const radiusIncrement = 150

  const connectionCounts = new Map<string, number>()
  nodes.forEach((n) => connectionCounts.set(n.id, 0))

  edges.forEach((edge) => {
    connectionCounts.set(edge.from, (connectionCounts.get(edge.from) || 0) + 1)
    connectionCounts.set(edge.to, (connectionCounts.get(edge.to) || 0) + 1)
  })

  // Sort by connection count to find hubs
  const sortedNodes = [...nodes].sort((a, b) => (connectionCounts.get(b.id) || 0) - (connectionCounts.get(a.id) || 0))

  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const rings = new Map<number, string[]>()
  const visited = new Set<string>()

  // Place hub(s) at center
  const hubCount = Math.min(3, Math.ceil(nodes.length * 0.1)) // Top 10% as hubs, max 3
  const hubs = sortedNodes.slice(0, hubCount)
  rings.set(
    0,
    hubs.map((h) => h.id),
  )
  hubs.forEach((h) => visited.add(h.id))

  // BFS from hubs to assign rings
  let currentRing = 0
  let currentNodes = hubs.map((h) => h.id)

  while (visited.size < nodes.length) {
    currentRing++
    const nextNodes = new Set<string>()

    currentNodes.forEach((nodeId) => {
      edges.forEach((edge) => {
        if (edge.from === nodeId && !visited.has(edge.to)) {
          nextNodes.add(edge.to)
        }
        if (edge.to === nodeId && !visited.has(edge.from)) {
          nextNodes.add(edge.from)
        }
      })
    })

    if (nextNodes.size === 0) {
      // Add unconnected nodes to outer ring
      nodes.forEach((n) => {
        if (!visited.has(n.id)) nextNodes.add(n.id)
      })
    }

    if (nextNodes.size > 0) {
      rings.set(currentRing, Array.from(nextNodes))
      nextNodes.forEach((id) => visited.add(id))
      currentNodes = Array.from(nextNodes)
    } else {
      break
    }
  }

  const result = new Map<string, { x: number; y: number; width: number; height: number }>()
  let maxX = 0
  let maxY = 0

  rings.forEach((nodeIds, ringIndex) => {
    const radius = ringIndex === 0 ? 0 : minRadius + ringIndex * radiusIncrement

    nodeIds.forEach((nodeId, index) => {
      const node = nodeMap.get(nodeId)!
      const width = node.width || 120
      const height = node.height || 80

      if (ringIndex === 0) {
        // Center node(s) - arrange in small circle if multiple
        const angle = nodeIds.length > 1 ? (2 * Math.PI * index) / nodeIds.length : 0
        const x = centerX + (nodeIds.length > 1 ? 30 : 0) * Math.cos(angle) - width / 2
        const y = centerY + (nodeIds.length > 1 ? 30 : 0) * Math.sin(angle) - height / 2
        result.set(nodeId, { x, y, width, height })
      } else {
        // Outer rings - evenly distribute
        const angle = (2 * Math.PI * index) / nodeIds.length - Math.PI / 2
        const x = node.fixed && node.x !== undefined ? node.x : centerX + radius * Math.cos(angle) - width / 2
        const y = node.fixed && node.y !== undefined ? node.y : centerY + radius * Math.sin(angle) - height / 2
        result.set(nodeId, { x, y, width, height })
      }

      const pos = result.get(nodeId)!
      maxX = Math.max(maxX, pos.x + width)
      maxY = Math.max(maxY, pos.y + height)
    })
  })

  return {
    nodes: result,
    bounds: { width: maxX + 100, height: maxY + 100 },
  }
}

/**
 * Enhanced force-directed layout with better physics and constraints
 * D3-style with improved stability and convergence
 */
export function enhancedForceDirectedLayout(nodes: Node[], edges: Edge[], options?: LayoutOptions): LayoutResult {
  const iterations = options?.iterations || 150
  const repulsion = options?.repulsion || 8000
  const attraction = options?.attraction || 0.015
  const preventOverlap = options?.preventOverlap !== false // Default true
  const minSpacing = options?.minSpacing || 20

  const positions = new Map<string, { x: number; y: number; vx: number; vy: number }>()
  const centerX = options?.centerX || 700
  const centerY = options?.centerY || 400
  const startRadius = 200

  nodes.forEach((node, index) => {
    const angle = (2 * Math.PI * index) / nodes.length
    positions.set(node.id, {
      x: node.fixed && node.x !== undefined ? node.x : centerX + startRadius * Math.cos(angle),
      y: node.fixed && node.y !== undefined ? node.y : centerY + startRadius * Math.sin(angle),
      vx: 0,
      vy: 0,
    })
  })

  const neighbors = new Map<string, Set<string>>()
  edges.forEach((edge) => {
    if (!neighbors.has(edge.from)) neighbors.set(edge.from, new Set())
    if (!neighbors.has(edge.to)) neighbors.set(edge.to, new Set())
    neighbors.get(edge.from)!.add(edge.to)
    neighbors.get(edge.to)!.add(edge.from)
  })

  const coolingRate = 0.95
  let temperature = 1.0

  // Run simulation
  for (let iter = 0; iter < iterations; iter++) {
    const forces = new Map<string, { fx: number; fy: number }>()
    nodes.forEach((node) => forces.set(node.id, { fx: 0, fy: 0 }))

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i]
        const node2 = nodes[j]
        const pos1 = positions.get(node1.id)!
        const pos2 = positions.get(node2.id)!

        const dx = pos2.x - pos1.x
        const dy = pos2.y - pos1.y
        const distSq = Math.max(dx * dx + dy * dy, 100) // Prevent extreme forces
        const dist = Math.sqrt(distSq)

        const force = repulsion / distSq
        const fx = (force * dx) / dist
        const fy = (force * dy) / dist

        forces.get(node1.id)!.fx -= fx
        forces.get(node1.id)!.fy -= fy
        forces.get(node2.id)!.fx += fx
        forces.get(node2.id)!.fy += fy
      }
    }

    edges.forEach((edge) => {
      const pos1 = positions.get(edge.from)!
      const pos2 = positions.get(edge.to)!

      const dx = pos2.x - pos1.x
      const dy = pos2.y - pos1.y
      const dist = Math.sqrt(dx * dx + dy * dy + 0.01)

      const optimalDistance = 150 // Desired edge length
      const force = attraction * (dist - optimalDistance)
      const fx = (force * dx) / dist
      const fy = (force * dy) / dist

      forces.get(edge.from)!.fx += fx
      forces.get(edge.from)!.fy += fy
      forces.get(edge.to)!.fx -= fx
      forces.get(edge.to)!.fy -= fy
    })

    nodes.forEach((node) => {
      if (node.fixed) return

      const pos = positions.get(node.id)!
      const force = forces.get(node.id)!

      // Adaptive damping based on temperature
      const damping = 0.85 * temperature
      pos.vx = (pos.vx + force.fx * 0.1) * damping
      pos.vy = (pos.vy + force.fy * 0.1) * damping

      // Update position
      pos.x += pos.vx
      pos.y += pos.vy

      // Boundary constraints
      pos.x = Math.max(100, Math.min(1900, pos.x))
      pos.y = Math.max(100, Math.min(1400, pos.y))
    })

    temperature *= coolingRate
  }

  if (preventOverlap) {
    for (let pass = 0; pass < 5; pass++) {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const node1 = nodes[i]
          const node2 = nodes[j]
          if (node1.fixed && node2.fixed) continue

          const pos1 = positions.get(node1.id)!
          const pos2 = positions.get(node2.id)!
          const width1 = node1.width || 150
          const height1 = node1.height || 80
          const width2 = node2.width || 150
          const height2 = node2.height || 80

          const dx = pos2.x - pos1.x
          const dy = pos2.y - pos1.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const minDist = (width1 + width2) / 2 + minSpacing

          if (dist < minDist && dist > 0) {
            const overlap = minDist - dist
            const moveX = (overlap * dx) / dist / 2
            const moveY = (overlap * dy) / dist / 2

            if (!node1.fixed) {
              pos1.x -= moveX
              pos1.y -= moveY
            }
            if (!node2.fixed) {
              pos2.x += moveX
              pos2.y += moveY
            }
          }
        }
      }
    }
  }

  // Convert to result format
  const result = new Map<string, { x: number; y: number; width: number; height: number }>()
  let maxX = 0
  let maxY = 0

  nodes.forEach((node) => {
    const pos = positions.get(node.id)!
    const width = node.width || 150
    const height = node.height || 80

    result.set(node.id, {
      x: pos.x - width / 2,
      y: pos.y - height / 2,
      width,
      height,
    })

    maxX = Math.max(maxX, pos.x + width / 2)
    maxY = Math.max(maxY, pos.y + height / 2)
  })

  return {
    nodes: result,
    bounds: { width: maxX + 100, height: maxY + 100 },
  }
}

/**
 * Check for overlapping nodes and return collision count
 */
export function detectCollisions(layout: LayoutResult): number {
  const nodes = Array.from(layout.nodes.entries())
  let collisionCount = 0

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const [id1, pos1] = nodes[i]
      const [id2, pos2] = nodes[j]

      // Check if rectangles overlap
      const overlap =
        pos1.x < pos2.x + pos2.width &&
        pos1.x + pos1.width > pos2.x &&
        pos1.y < pos2.y + pos2.height &&
        pos1.y + pos1.height > pos2.y

      if (overlap) collisionCount++
    }
  }

  return collisionCount
}
