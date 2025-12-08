import type { ToolHandlerContext } from "../types"
import { getForegroundColor, generateId } from "../canvas-helpers"
import { createShapeElement, createTextElement } from "../element-creators"
import { getStrokeColors, getBackgroundColors } from "@/lib/constants"
import { orgChartLayout } from "@/lib/org-chart-layouts"
import type { HandlePosition } from "@/lib/types"

export interface OrgChartNode {
  id: string
  name: string
  title?: string
  department?: string
  children?: OrgChartNode[]
}

export interface CreateOrgChartInput {
  hierarchy: OrgChartNode[]
  orientation?: "vertical" | "horizontal"
  nodeWidth?: number
  nodeHeight?: number
  levelSpacing?: number
  siblingSpacing?: number
  colorScheme?: {
    strokeColor?: string
    backgroundColor?: string
    textColor?: string
  }
}

export function handleCreateOrgChart(
  args: CreateOrgChartInput,
  ctx: ToolHandlerContext,
): {
  success: boolean
  message: string
  nodeCount?: number
  connectionCount?: number
  nodeIds?: Record<string, string>
} {
  const isDark = ctx.resolvedTheme !== "light"
  const strokeColors = getStrokeColors(isDark)
  const bgColors = getBackgroundColors(isDark)

  const customStroke = args.colorScheme?.strokeColor
  const customBg = args.colorScheme?.backgroundColor
  const customText = args.colorScheme?.textColor
  const foregroundColor = customText || getForegroundColor(ctx.resolvedTheme)

  // Calculate layout
  const layoutResult = orgChartLayout(args.hierarchy, {
    orientation: args.orientation || "vertical",
    nodeWidth: args.nodeWidth || 180,
    nodeHeight: args.nodeHeight || 100,
    levelSpacing: args.levelSpacing || 150,
    siblingSpacing: args.siblingSpacing || 40,
  })

  const createdNodeIds = new Map<string, string>()

  // Helper to recursively extract all nodes from hierarchy
  function extractNodes(nodes: OrgChartNode[]): OrgChartNode[] {
    const result: OrgChartNode[] = []
    for (const node of nodes) {
      result.push(node)
      if (node.children && node.children.length > 0) {
        result.push(...extractNodes(node.children))
      }
    }
    return result
  }

  const allNodes = extractNodes(args.hierarchy)

  // Create org chart boxes
  for (const node of allNodes) {
    const position = layoutResult.nodes.get(node.id)
    if (!position) continue

    const elementId = generateId()

    let bgColor = customBg || bgColors[6]
    let strokeColor = customStroke || strokeColors[6]

    if (!customStroke && !customBg) {
      if (node.title?.toLowerCase().includes("ceo") || node.title?.toLowerCase().includes("president")) {
        bgColor = bgColors[4]
        strokeColor = strokeColors[4]
      } else if (node.title?.toLowerCase().includes("director") || node.title?.toLowerCase().includes("vp")) {
        bgColor = bgColors[9]
        strokeColor = strokeColors[9]
      } else if (node.title?.toLowerCase().includes("manager")) {
        bgColor = bgColors[12]
        strokeColor = strokeColors[12]
      }
    }

    ctx.addElementMutation(
      createShapeElement("rectangle", position.x, position.y, position.width, position.height, {
        strokeColor,
        backgroundColor: bgColor,
      }),
    )
    createdNodeIds.set(node.id, elementId)

    ctx.shapeRegistryRef.current.set(node.id, elementId)
    ctx.shapeDataRef.current.set(node.id, {
      x: position.x,
      y: position.y,
      width: position.width,
      height: position.height,
      type: "rectangle",
    })

    // Add name
    ctx.addElementMutation(
      createTextElement(position.x + 10, position.y + 20, position.width - 20, 24, node.name, {
        strokeColor: foregroundColor,
        textAlign: "center",
        fontSize: "medium",
        fontWeight: "bold",
      }),
    )

    // Add title if provided
    if (node.title) {
      ctx.addElementMutation(
        createTextElement(position.x + 10, position.y + 50, position.width - 20, 18, node.title, {
          strokeColor: foregroundColor,
          textAlign: "center",
          fontSize: "small",
          opacity: 0.8,
        }),
      )
    }
  }

  // Create SmartConnections for proper routing
  // We need to map from layout node IDs to element IDs
  for (const conn of layoutResult.connections) {
    const sourceElementId = createdNodeIds.get(conn.from)
    const targetElementId = createdNodeIds.get(conn.to)
    
    if (!sourceElementId || !targetElementId) {
      console.warn(`[orgchart] Invalid connection: ${conn.from} -> ${conn.to} (node not found)`)
      continue
    }
    
    // For org charts, connections typically flow from parent (bottom) to child (top)
    // Determine handles based on orientation
    let sourceHandle: HandlePosition = "bottom"
    let targetHandle: HandlePosition = "top"
    
    if (args.orientation === "horizontal") {
      sourceHandle = "right"
      targetHandle = "left"
    }
    
    ctx.addConnectionMutation({
      sourceId: sourceElementId,
      targetId: targetElementId,
      sourceHandle,
      targetHandle,
      strokeColor: customStroke || foregroundColor,
      strokeWidth: 2,
      strokeStyle: "solid",
      arrowHeadEnd: "none", // Org charts don't typically have arrows
      pathType: "smoothstep", // Orthogonal routing for clean hierarchy lines
    })
  }

  return {
    success: true,
    message: `Created org chart with ${allNodes.length} positions and ${layoutResult.connections.length} reporting lines`,
    nodeCount: allNodes.length,
    connectionCount: layoutResult.connections.length,
    nodeIds: Object.fromEntries(createdNodeIds),
  }
}
