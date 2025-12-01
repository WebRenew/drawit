export interface OrgNode {
  id: string
  name: string
  title?: string
  children?: OrgNode[]
  level?: number
}

export interface OrgChartOptions {
  orientation: "vertical" | "horizontal"
  nodeWidth: number
  nodeHeight: number
  levelSpacing: number
  siblingSpacing: number
  startX: number
  startY: number
}

export interface OrgChartLayout {
  nodes: Map<
    string,
    {
      x: number
      y: number
      width: number
      height: number
      level: number
    }
  >
  connections: Array<{
    from: string
    to: string
    points: Array<{ x: number; y: number }>
  }>
}

/**
 * Calculate hierarchical org chart layout with proper tree positioning
 * Uses Walker's algorithm for aesthetically pleasing tree layouts
 */
export function orgChartLayout(hierarchy: OrgNode[], options: Partial<OrgChartOptions> = {}): OrgChartLayout {
  const opts: OrgChartOptions = {
    orientation: options.orientation || "vertical",
    nodeWidth: options.nodeWidth || 180,
    nodeHeight: options.nodeHeight || 100,
    levelSpacing: options.levelSpacing || 150,
    siblingSpacing: options.siblingSpacing || 40,
    startX: options.startX || 400,
    startY: options.startY || 100,
  }

  const nodes = new Map<
    string,
    {
      x: number
      y: number
      width: number
      height: number
      level: number
    }
  >()
  const connections: Array<{
    from: string
    to: string
    points: Array<{ x: number; y: number }>
  }> = []

  // Assign levels and calculate subtree widths
  function assignLevels(node: OrgNode, level: number) {
    node.level = level
    if (node.children) {
      for (const child of node.children) {
        assignLevels(child, level + 1)
      }
    }
  }

  function calculateSubtreeWidth(node: OrgNode): number {
    if (!node.children || node.children.length === 0) {
      return opts.nodeWidth
    }
    const childrenWidth = node.children.map(calculateSubtreeWidth).reduce((sum, width) => sum + width, 0)
    const spacing = (node.children.length - 1) * opts.siblingSpacing
    return Math.max(opts.nodeWidth, childrenWidth + spacing)
  }

  // Position nodes using modified Walker's algorithm
  function positionNode(node: OrgNode, x: number, y: number) {
    if (opts.orientation === "vertical") {
      nodes.set(node.id, {
        x: x - opts.nodeWidth / 2,
        y: y,
        width: opts.nodeWidth,
        height: opts.nodeHeight,
        level: node.level || 0,
      })
    } else {
      nodes.set(node.id, {
        x: y,
        y: x - opts.nodeHeight / 2,
        width: opts.nodeWidth,
        height: opts.nodeHeight,
        level: node.level || 0,
      })
    }

    if (node.children && node.children.length > 0) {
      const subtreeWidth = calculateSubtreeWidth(node)
      let currentX = x - subtreeWidth / 2

      for (const child of node.children) {
        const childSubtreeWidth = calculateSubtreeWidth(child)
        const childX = currentX + childSubtreeWidth / 2

        const childY = y + opts.levelSpacing

        positionNode(child, childX, childY)

        // Add connection
        connections.push({
          from: node.id,
          to: child.id,
          points: [],
        })

        currentX += childSubtreeWidth + opts.siblingSpacing
      }
    }
  }

  // Process each root node
  if (hierarchy.length > 0) {
    let currentX = opts.startX

    for (const root of hierarchy) {
      assignLevels(root, 0)
      const subtreeWidth = calculateSubtreeWidth(root)
      positionNode(root, currentX, opts.startY)
      currentX += subtreeWidth + opts.siblingSpacing * 2
    }
  }

  // Calculate orthogonal connection paths to avoid overlapping nodes
  for (const conn of connections) {
    const fromNode = nodes.get(conn.from)
    const toNode = nodes.get(conn.to)

    if (!fromNode || !toNode) continue

    if (opts.orientation === "vertical") {
      // Vertical org chart: connectors go from bottom of parent to top of child
      const fromX = fromNode.x + fromNode.width / 2
      const fromY = fromNode.y + fromNode.height
      const toX = toNode.x + toNode.width / 2
      const toY = toNode.y

      // Create orthogonal path
      const midY = (fromY + toY) / 2

      conn.points = [
        { x: fromX, y: fromY },
        { x: fromX, y: midY },
        { x: toX, y: midY },
        { x: toX, y: toY },
      ]
    } else {
      // Horizontal org chart: connectors go from right of parent to left of child
      const fromX = fromNode.x + fromNode.width
      const fromY = fromNode.y + fromNode.height / 2
      const toX = toNode.x
      const toY = toNode.y + toNode.height / 2

      // Create orthogonal path
      const midX = (fromX + toX) / 2

      conn.points = [
        { x: fromX, y: fromY },
        { x: midX, y: fromY },
        { x: midX, y: toY },
        { x: toX, y: toY },
      ]
    }
  }

  return { nodes, connections }
}
