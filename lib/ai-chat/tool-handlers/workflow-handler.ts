import type { ToolHandlerContext } from "../types"
import { generateId } from "../canvas-helpers"
import { createTextElement, createShapeElement } from "../element-creators"
import { getStrokeColors, getBackgroundColors } from "@/lib/constants"
import type { HandlePosition } from "@/lib/types"

interface WorkflowNode {
  id: string
  type: "trigger" | "action" | "condition" | "loop" | "transform" | "output"
  label: string
  description?: string
  strokeColor?: string
  backgroundColor?: string
}

interface WorkflowConnection {
  from: string
  to: string
  label?: string
}

export interface CreateWorkflowInput {
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
  colorScheme?: {
    strokeColor?: string
    backgroundColor?: string
    textColor?: string
  }
}

interface PositionedNode {
  id: string
  type: WorkflowNode["type"]
  label: string
  description?: string
  x: number
  y: number
  width: number
  height: number
  strokeColor?: string
  backgroundColor?: string
}

/**
 * Get shape and default colors based on workflow node type
 */
function getWorkflowNodeStyle(
  type: WorkflowNode["type"],
  isDark: boolean,
  strokeColors: string[],
  bgColors: string[],
): { shape: string; stroke: string; bg: string } {
  switch (type) {
    case "trigger":
      // Rounded pill shape - use ellipse, green
      return { shape: "ellipse", stroke: strokeColors[11], bg: bgColors[12] }
    case "action":
      // Rectangle, blue
      return { shape: "rectangle", stroke: strokeColors[8], bg: bgColors[9] }
    case "condition":
      // Diamond, orange/yellow
      return { shape: "diamond", stroke: strokeColors[14], bg: bgColors[15] }
    case "loop":
      // Rectangle with different color, purple
      return { shape: "rectangle", stroke: strokeColors[6], bg: bgColors[7] }
    case "transform":
      // Rectangle, teal
      return { shape: "rectangle", stroke: strokeColors[9], bg: bgColors[10] }
    case "output":
      // Ellipse, red
      return { shape: "ellipse", stroke: strokeColors[3], bg: bgColors[4] }
    default:
      return { shape: "rectangle", stroke: strokeColors[0], bg: bgColors[1] }
  }
}

/**
 * Calculate workflow layout - vertical flow with branching
 */
function calculateWorkflowLayout(
  nodes: WorkflowNode[],
  connections: WorkflowConnection[],
): PositionedNode[] {
  const positioned: PositionedNode[] = []
  const nodeWidth = 180
  const nodeHeight = 70
  const horizontalSpacing = 250
  const verticalSpacing = 120
  const startX = 400
  const startY = 100

  // Build adjacency map for determining order
  const childMap = new Map<string, string[]>()
  const parentMap = new Map<string, string[]>()
  
  for (const conn of connections) {
    if (!childMap.has(conn.from)) childMap.set(conn.from, [])
    childMap.get(conn.from)!.push(conn.to)
    
    if (!parentMap.has(conn.to)) parentMap.set(conn.to, [])
    parentMap.get(conn.to)!.push(conn.from)
  }

  // Find root nodes (no parents)
  const rootNodes = nodes.filter(n => !parentMap.has(n.id) || parentMap.get(n.id)!.length === 0)
  const processedIds = new Set<string>()

  // BFS to position nodes level by level
  let currentLevel: string[] = rootNodes.map(n => n.id)
  let level = 0

  while (currentLevel.length > 0) {
    const nextLevel: string[] = []
    const levelWidth = currentLevel.length * horizontalSpacing
    const levelStartX = startX + (horizontalSpacing / 2) - (levelWidth / 2)

    currentLevel.forEach((nodeId, index) => {
      if (processedIds.has(nodeId)) return
      processedIds.add(nodeId)

      const node = nodes.find(n => n.id === nodeId)
      if (!node) return

      const x = levelStartX + index * horizontalSpacing
      const y = startY + level * verticalSpacing

      positioned.push({
        id: node.id,
        type: node.type,
        label: node.label,
        description: node.description,
        x,
        y,
        width: nodeWidth,
        height: nodeHeight,
        strokeColor: node.strokeColor,
        backgroundColor: node.backgroundColor,
      })

      // Add children to next level
      const children = childMap.get(nodeId) || []
      for (const childId of children) {
        if (!processedIds.has(childId)) {
          nextLevel.push(childId)
        }
      }
    })

    currentLevel = [...new Set(nextLevel)] // Dedupe
    level++
  }

  // Handle any unprocessed nodes (disconnected)
  for (const node of nodes) {
    if (!processedIds.has(node.id)) {
      positioned.push({
        id: node.id,
        type: node.type,
        label: node.label,
        description: node.description,
        x: startX + positioned.length * 50,
        y: startY + level * verticalSpacing,
        width: nodeWidth,
        height: nodeHeight,
        strokeColor: node.strokeColor,
        backgroundColor: node.backgroundColor,
      })
    }
  }

  return positioned
}

export function handleCreateWorkflow(
  args: CreateWorkflowInput,
  ctx: ToolHandlerContext,
): {
  success: boolean
  message: string
  nodeCount?: number
  connectionCount?: number
  nodeIds?: Record<string, string>
} {
  if (!args || !args.nodes || !Array.isArray(args.nodes)) {
    return {
      success: false,
      message: "Invalid input: nodes array is required",
    }
  }

  if (!args.connections || !Array.isArray(args.connections)) {
    args.connections = []
  }

  const isDark = ctx.resolvedTheme !== "light"
  const strokeColors = getStrokeColors(isDark)
  const bgColors = getBackgroundColors(isDark)

  const customStroke = args.colorScheme?.strokeColor
  const customBg = args.colorScheme?.backgroundColor
  const customText = args.colorScheme?.textColor
  const foregroundColor = customText || (isDark ? "#ffffff" : "#1e1e1e")

  const positionedNodes = calculateWorkflowLayout(args.nodes, args.connections)
  const nodeElementIds = new Map<string, string>()

  // Create nodes
  for (const node of positionedNodes) {
    const elementId = generateId()
    nodeElementIds.set(node.id, elementId)

    const defaultStyle = getWorkflowNodeStyle(node.type, isDark, strokeColors, bgColors)
    
    // Priority: per-node colors > colorScheme > defaults
    const finalStroke = node.strokeColor || customStroke || defaultStyle.stroke
    const finalBg = node.backgroundColor || customBg || defaultStyle.bg

    const shapeElement = {
      ...createShapeElement(defaultStyle.shape, node.x, node.y, node.width, node.height, {
        strokeColor: finalStroke,
        backgroundColor: finalBg,
      }),
      id: elementId,
      label: node.label,
      labelColor: foregroundColor,
      labelFontSize: 13,
      labelFontWeight: "500",
      labelPadding: 8,
    }

    ctx.addElementMutation(shapeElement)

    // Register in shape registries for future updates
    ctx.shapeRegistryRef.current.set(node.id, elementId)
    ctx.shapeDataRef.current.set(node.id, {
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      type: defaultStyle.shape,
    })
  }

  // Create connections
  let connectionCount = 0
  for (const conn of args.connections) {
    const sourceElementId = nodeElementIds.get(conn.from)
    const targetElementId = nodeElementIds.get(conn.to)

    if (!sourceElementId || !targetElementId) {
      console.warn(`[workflow] Invalid connection: ${conn.from} -> ${conn.to} (node not found)`)
      continue
    }

    const sourceNode = positionedNodes.find(n => n.id === conn.from)
    const targetNode = positionedNodes.find(n => n.id === conn.to)
    
    if (!sourceNode || !targetNode) continue

    // Determine handle positions
    let sourceHandle: HandlePosition = "bottom"
    let targetHandle: HandlePosition = "top"

    const dx = targetNode.x - sourceNode.x
    const dy = targetNode.y - sourceNode.y

    if (Math.abs(dx) > Math.abs(dy) * 1.5) {
      // More horizontal than vertical
      sourceHandle = dx > 0 ? "right" : "left"
      targetHandle = dx > 0 ? "left" : "right"
    }

    ctx.addConnectionMutation({
      sourceId: sourceElementId,
      targetId: targetElementId,
      sourceHandle,
      targetHandle,
      label: conn.label,
      strokeColor: customStroke || foregroundColor,
      strokeWidth: 2,
      strokeStyle: "solid",
      arrowHeadEnd: "arrow",
      pathType: "smoothstep",
    })
    connectionCount++
  }

  const nodeTypes = args.nodes.map(n => n.type)
  const typesSummary = [...new Set(nodeTypes)].join(", ")

  return {
    success: true,
    message: `Created workflow with ${positionedNodes.length} nodes (${typesSummary}) and ${connectionCount} connections`,
    nodeCount: positionedNodes.length,
    connectionCount,
    nodeIds: Object.fromEntries(nodeElementIds),
  }
}

