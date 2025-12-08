import type { ToolHandlerContext } from "../types"
import { generateId } from "../canvas-helpers"
import { createTextElement, createShapeElement } from "../element-creators"
import { getStrokeColors, getBackgroundColors } from "@/lib/constants"
import { calculateFlowchartLayout, type FlowchartStep, type FlowchartConnection } from "@/lib/flowchart-layouts"
import type { HandlePosition } from "@/lib/types"

export interface FlowchartStepWithColor extends FlowchartStep {
  strokeColor?: string
  backgroundColor?: string
}

export interface CreateFlowchartInput {
  steps: FlowchartStepWithColor[]
  connections: FlowchartConnection[]
  direction?: "vertical" | "horizontal"
  spacing?: number
  swimlanes?: string[]
  colorScheme?: {
    strokeColor?: string
    backgroundColor?: string
    textColor?: string
  }
}

export function handleCreateFlowchart(
  args: CreateFlowchartInput,
  ctx: ToolHandlerContext,
): {
  success: boolean
  message: string
  direction?: string
  nodeCount?: number
  connectionCount?: number
  swimlaneCount?: number
  nodeIds?: Record<string, string>
} {
  if (!args || !args.steps || !Array.isArray(args.steps)) {
    return {
      success: false,
      message: "Invalid input: steps array is required",
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

  const layout = calculateFlowchartLayout(
    args.steps,
    args.connections,
    args.direction || "vertical",
    args.spacing || 100,
    args.swimlanes,
  )

  const nodeElementIds = new Map<string, string>()

  // Draw swimlanes first if present
  if (layout.swimlanes) {
    for (const swimlane of layout.swimlanes) {
      ctx.addElementMutation(
        createShapeElement("rectangle", swimlane.x, swimlane.y, swimlane.width, swimlane.height, {
          strokeColor: customStroke || (isDark ? strokeColors[1] : strokeColors[2]),
          backgroundColor: customBg || (isDark ? bgColors[2] : bgColors[1]),
          opacity: 0.3,
        }),
      )

      ctx.addElementMutation(
        createTextElement(swimlane.x + 10, swimlane.y + 10, swimlane.width - 20, 30, swimlane.name, {
          strokeColor: foregroundColor,
          textAlign: "center",
          fontSize: "large",
          fontWeight: "bold",
        }),
      )
    }
  }

  const nodeColors: Record<string, { stroke: string; bg: string }> =
    customStroke || customBg
      ? {
          start: { stroke: customStroke || strokeColors[11], bg: customBg || bgColors[12] },
          end: { stroke: customStroke || strokeColors[3], bg: customBg || bgColors[4] },
          process: { stroke: customStroke || strokeColors[8], bg: customBg || bgColors[9] },
          decision: { stroke: customStroke || strokeColors[13], bg: customBg || bgColors[14] },
          data: { stroke: customStroke || strokeColors[9], bg: customBg || bgColors[10] },
          document: { stroke: customStroke || strokeColors[6], bg: customBg || bgColors[7] },
        }
      : {
          start: { stroke: strokeColors[11], bg: bgColors[12] },
          end: { stroke: strokeColors[3], bg: bgColors[4] },
          process: { stroke: strokeColors[8], bg: bgColors[9] },
          decision: { stroke: strokeColors[13], bg: bgColors[14] },
          data: { stroke: strokeColors[9], bg: bgColors[10] },
          document: { stroke: strokeColors[6], bg: bgColors[7] },
        }

  // Create a map of step colors for quick lookup
  const stepColorMap = new Map<string, { strokeColor?: string; backgroundColor?: string }>()
  for (const step of args.steps) {
    if (step.strokeColor || step.backgroundColor) {
      stepColorMap.set(step.id, { strokeColor: step.strokeColor, backgroundColor: step.backgroundColor })
    }
  }

  // Create nodes with appropriate shapes
  for (const node of layout.nodes) {
    const elementId = generateId()
    nodeElementIds.set(node.id, elementId)

    let shapeType: string

    switch (node.type) {
      case "start":
      case "end":
        shapeType = "ellipse"
        break
      case "decision":
        shapeType = "diamond"
        break
      default:
        shapeType = "rectangle"
    }

    // Per-node colors take priority, then type-based defaults
    const stepColors = stepColorMap.get(node.id)
    const typeColors = nodeColors[node.type] || { stroke: strokeColors[8], bg: bgColors[9] }
    
    const finalStrokeColor = stepColors?.strokeColor || typeColors.stroke
    const finalBgColor = stepColors?.backgroundColor || typeColors.bg

    const shapeElement = {
      ...createShapeElement(shapeType, node.x, node.y, node.width, node.height, {
        strokeColor: finalStrokeColor,
        backgroundColor: finalBgColor,
      }),
      id: elementId,
      connectable: true, // Mark as connectable for SmartConnections
      label: node.label, // Integrated label
      labelColor: foregroundColor,
      labelFontSize: node.type === "decision" ? 12 : 14,
      labelFontWeight: "500",
      labelPadding: node.type === "decision" ? 0 : 10,
    }

    ctx.addElementMutation(shapeElement)

    // Register in BOTH registries for future updates (Issue #9 fix)
    ctx.shapeRegistryRef.current.set(node.id, elementId)
    ctx.shapeDataRef.current.set(node.id, {
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      type: shapeType,
    })
  }

  // Track skipped connections for error reporting
  const skippedConnections: string[] = []

  for (const edge of layout.edges) {
    const sourceElementId = nodeElementIds.get(edge.from)
    const targetElementId = nodeElementIds.get(edge.to)

    if (!sourceElementId || !targetElementId) {
      // Issue #10 fix: Add warning instead of silent skip
      const missingSource = !sourceElementId ? `'${edge.from}'` : null
      const missingTarget = !targetElementId ? `'${edge.to}'` : null
      const missing = [missingSource, missingTarget].filter(Boolean).join(" and ")
      console.warn(`[flowchart] Skipped connection ${edge.from} -> ${edge.to}: node ${missing} not found`)
      skippedConnections.push(`${edge.from} -> ${edge.to}`)
      continue
    }

    // Determine handle positions based on edge direction
    let sourceHandle: HandlePosition = "bottom"
    let targetHandle: HandlePosition = "top"

    if (edge.points && edge.points.length >= 2) {
      const startPoint = edge.points[0]
      const endPoint = edge.points[edge.points.length - 1]
      const dx = endPoint.x - startPoint.x
      const dy = endPoint.y - startPoint.y

      // Determine best handles based on direction
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal connection
        sourceHandle = dx > 0 ? "right" : "left"
        targetHandle = dx > 0 ? "left" : "right"
      } else {
        // Vertical connection
        sourceHandle = dy > 0 ? "bottom" : "top"
        targetHandle = dy > 0 ? "top" : "bottom"
      }
    }

    ctx.addConnectionMutation({
      sourceId: sourceElementId,
      targetId: targetElementId,
      sourceHandle,
      targetHandle,
      label: edge.label,
      strokeColor: foregroundColor,
      strokeWidth: 2,
      strokeStyle: "solid",
      arrowHeadEnd: "arrow",
      pathType: "smoothstep",
    })
  }

  const successfulConnections = layout.edges.length - skippedConnections.length
  let message = `Created flowchart with ${layout.nodes.length} nodes and ${successfulConnections} connections`
  
  // Warn about skipped connections in the response
  if (skippedConnections.length > 0) {
    message += `. Warning: ${skippedConnections.length} connection(s) skipped due to invalid node IDs.`
  }

  return {
    success: true,
    message,
    direction: args.direction || "vertical",
    nodeCount: layout.nodes.length,
    connectionCount: successfulConnections,
    swimlaneCount: layout.swimlanes?.length || 0,
    nodeIds: Object.fromEntries(nodeElementIds),
  }
}
