import type { ToolHandlerContext } from "../types"
import { generateId } from "../canvas-helpers"
import { createShapeElement } from "../element-creators"
import { getStrokeColors, getBackgroundColors } from "@/lib/constants"
import type { HandlePosition } from "@/lib/types"

interface MindMapBranch {
  id: string
  label: string
  children?: string[] // IDs of child branches
}

export interface CreateMindMapInput {
  centralTopic: string
  branches: MindMapBranch[]
  colorScheme?: {
    strokeColor?: string
    backgroundColor?: string
    textColor?: string
  }
}

interface PositionedNode {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
  level: number
  parentId?: string
}

/**
 * Creates a radial mind map layout from central topic and branches
 */
export function handleCreateMindMap(
  args: CreateMindMapInput,
  ctx: ToolHandlerContext,
): {
  success: boolean
  message: string
  nodeCount?: number
  connectionCount?: number
  nodeIds?: Record<string, string>
} {
  if (!args || !args.centralTopic) {
    return {
      success: false,
      message: "Invalid input: centralTopic is required",
    }
  }

  if (!args.branches || !Array.isArray(args.branches)) {
    args.branches = []
  }

  const isDark = ctx.resolvedTheme !== "light"
  const strokeColors = getStrokeColors(isDark)
  const bgColors = getBackgroundColors(isDark)

  const customStroke = args.colorScheme?.strokeColor
  const customBg = args.colorScheme?.backgroundColor
  const customText = args.colorScheme?.textColor
  const foregroundColor = customText || (isDark ? "#ffffff" : "#1e1e1e")

  // Canvas dimensions
  const canvasWidth = ctx.canvasDimensions?.width || 1200
  const canvasHeight = ctx.canvasDimensions?.height || 800
  const centerX = canvasWidth / 2
  const centerY = canvasHeight / 2

  // Build a lookup map for branches
  const branchMap = new Map<string, MindMapBranch>()
  for (const branch of args.branches) {
    branchMap.set(branch.id, branch)
  }

  // Find root branches (not referenced as children)
  const childIds = new Set<string>()
  for (const branch of args.branches) {
    if (branch.children) {
      for (const childId of branch.children) {
        childIds.add(childId)
      }
    }
  }
  const rootBranches = args.branches.filter(b => !childIds.has(b.id))

  // Layout calculation
  const positionedNodes: PositionedNode[] = []
  const connections: Array<{ fromId: string; toId: string }> = []

  // Central node
  const centralWidth = Math.max(150, args.centralTopic.length * 10 + 40)
  const centralHeight = 60
  positionedNodes.push({
    id: "central",
    label: args.centralTopic,
    x: centerX - centralWidth / 2,
    y: centerY - centralHeight / 2,
    width: centralWidth,
    height: centralHeight,
    level: 0,
  })

  // Position root branches in a radial pattern
  const angleStep = (2 * Math.PI) / Math.max(rootBranches.length, 1)
  const level1Radius = 200

  function positionBranch(
    branch: MindMapBranch,
    angle: number,
    radius: number,
    level: number,
    parentId: string,
  ) {
    const nodeWidth = Math.max(120, branch.label.length * 8 + 30)
    const nodeHeight = 40
    const x = centerX + radius * Math.cos(angle) - nodeWidth / 2
    const y = centerY + radius * Math.sin(angle) - nodeHeight / 2

    positionedNodes.push({
      id: branch.id,
      label: branch.label,
      x,
      y,
      width: nodeWidth,
      height: nodeHeight,
      level,
      parentId,
    })

    connections.push({ fromId: parentId, toId: branch.id })

    // Position children
    if (branch.children && branch.children.length > 0) {
      const childAngleSpread = Math.PI / 4 // 45 degrees spread for children
      const startAngle = angle - childAngleSpread / 2
      const childAngleStep = childAngleSpread / Math.max(branch.children.length - 1, 1)
      const childRadius = radius + 150

      branch.children.forEach((childId, index) => {
        const childBranch = branchMap.get(childId)
        if (childBranch) {
          const childAngle = branch.children!.length === 1 
            ? angle 
            : startAngle + index * childAngleStep
          positionBranch(childBranch, childAngle, childRadius, level + 1, branch.id)
        }
      })
    }
  }

  rootBranches.forEach((branch, index) => {
    const angle = index * angleStep - Math.PI / 2 // Start from top
    positionBranch(branch, angle, level1Radius, 1, "central")
  })

  // Create canvas elements
  const nodeElementIds = new Map<string, string>()

  // Color palette for different levels
  const levelColors = [
    { stroke: customStroke || strokeColors[4], bg: customBg || bgColors[5] }, // Central - blue
    { stroke: customStroke || strokeColors[11], bg: customBg || bgColors[12] }, // Level 1 - green
    { stroke: customStroke || strokeColors[8], bg: customBg || bgColors[9] }, // Level 2 - purple
    { stroke: customStroke || strokeColors[14], bg: customBg || bgColors[15] }, // Level 3 - orange
  ]

  for (const node of positionedNodes) {
    const elementId = generateId()
    nodeElementIds.set(node.id, elementId)

    const colors = levelColors[Math.min(node.level, levelColors.length - 1)]
    const isCenter = node.level === 0

    const shapeElement = {
      ...createShapeElement(
        isCenter ? "ellipse" : "rectangle",
        node.x,
        node.y,
        node.width,
        node.height,
        {
          strokeColor: colors.stroke,
          backgroundColor: colors.bg,
          strokeWidth: isCenter ? 3 : 2,
        }
      ),
      id: elementId,
      label: node.label,
      labelColor: foregroundColor,
      labelFontSize: isCenter ? 16 : 12,
      labelFontWeight: isCenter ? "bold" : "normal",
      labelPadding: 8,
    }

    ctx.addElementMutation(shapeElement)

    ctx.shapeRegistryRef.current.set(node.id, elementId)
    ctx.shapeDataRef.current.set(node.id, {
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      type: isCenter ? "ellipse" : "rectangle",
    })
  }

  // Create connections using SmartConnections for proper routing
  for (const conn of connections) {
    const fromElementId = nodeElementIds.get(conn.fromId)
    const toElementId = nodeElementIds.get(conn.toId)
    const fromNode = positionedNodes.find(n => n.id === conn.fromId)
    const toNode = positionedNodes.find(n => n.id === conn.toId)
    
    if (!fromElementId || !toElementId || !fromNode || !toNode) {
      console.warn(`[mindmap] Invalid connection: ${conn.fromId} -> ${conn.toId}`)
      continue
    }

    // Calculate optimal handle positions based on radial layout
    const fromCenterX = fromNode.x + fromNode.width / 2
    const fromCenterY = fromNode.y + fromNode.height / 2
    const toCenterX = toNode.x + toNode.width / 2
    const toCenterY = toNode.y + toNode.height / 2
    
    const dx = toCenterX - fromCenterX
    const dy = toCenterY - fromCenterY
    
    let sourceHandle: HandlePosition
    let targetHandle: HandlePosition
    
    // For radial layout, determine handles based on relative positions
    if (Math.abs(dx) > Math.abs(dy)) {
      // More horizontal
      sourceHandle = dx > 0 ? "right" : "left"
      targetHandle = dx > 0 ? "left" : "right"
    } else {
      // More vertical
      sourceHandle = dy > 0 ? "bottom" : "top"
      targetHandle = dy > 0 ? "top" : "bottom"
    }

    ctx.addConnectionMutation({
      sourceId: fromElementId,
      targetId: toElementId,
      sourceHandle,
      targetHandle,
      strokeColor: customStroke || (isDark ? strokeColors[0] : strokeColors[1]),
      strokeWidth: 2,
      strokeStyle: "solid",
      arrowHeadEnd: "none", // Mind maps typically don't have arrows
      pathType: "bezier", // Curved lines look better for radial layouts
    })
  }

  return {
    success: true,
    message: `Created mind map with central topic "${args.centralTopic}" and ${args.branches.length} branches`,
    nodeCount: positionedNodes.length,
    connectionCount: connections.length,
    nodeIds: Object.fromEntries(nodeElementIds),
  }
}

