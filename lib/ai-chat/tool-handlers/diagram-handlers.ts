import type { ToolHandlerContext } from "../types"
import { getForegroundColor, generateId } from "../canvas-helpers"
import { createLineElement, createTextElement, createShapeElement, createArrowElement } from "../element-creators"
import { getStrokeColors, getBackgroundColors } from "@/lib/constants"
import {
  type Node,
  type Edge,
  treeLayout,
  circularLayout,
  gridLayout,
  forceDirectedLayout,
  detectCollisions,
} from "@/lib/diagram-layouts"
import { erDiagramLayout, getCardinalitySymbol, type EREntity, type ERRelationship } from "@/lib/er-diagram-layouts"
import {
  starTopology,
  ringTopology,
  meshTopology,
  treeTopology,
  busTopology,
  getNodeStyleForType,
  type NetworkNode,
  type NetworkLink,
} from "@/lib/network-topologies"
import { analyzeDiagram, beautifyDiagram } from "@/lib/diagram-analysis"

interface ColorScheme {
  strokeColor?: string
  backgroundColor?: string
  textColor?: string
}

// ===== ER Diagram Handler =====

export interface CreateERDiagramInput {
  entities: EREntity[]
  relationships: ERRelationship[]
  colorScheme?: ColorScheme // Added colorScheme support
}

export function handleCreateERDiagram(
  args: CreateERDiagramInput,
  ctx: ToolHandlerContext,
): {
  success: boolean
  message: string
  entityCount?: number
  relationshipCount?: number
  entityIds?: Record<string, string>
} {
  if (!args || !args.entities || !Array.isArray(args.entities)) {
    return {
      success: false,
      message: "Invalid input: entities array is required",
    }
  }

  const isDark = ctx.resolvedTheme !== "light"
  const strokeColors = getStrokeColors(isDark)
  const bgColors = getBackgroundColors(isDark)

  const customStroke = args.colorScheme?.strokeColor
  const customBg = args.colorScheme?.backgroundColor
  const customText = args.colorScheme?.textColor
  const foregroundColor = customText || getForegroundColor(ctx.resolvedTheme)

  const layoutResult = erDiagramLayout(args.entities)
  const createdEntityIds = new Map<string, string>()

  // Create entity rectangles with attributes
  for (const entity of args.entities) {
    const position = layoutResult.entities.get(entity.id)
    if (!position) continue

    const elementId = generateId()

    let strokeColor = customStroke || strokeColors[4]
    const bgColor = customBg || bgColors[0]
    if (!customStroke) {
      if (entity.type === "weak-entity") {
        strokeColor = strokeColors[8]
      } else if (entity.type === "associative") {
        strokeColor = strokeColors[12]
      }
    }

    ctx.addElementMutation(
      createShapeElement("rectangle", position.x, position.y, position.width, position.height, {
        strokeColor,
        backgroundColor: bgColor,
      }),
    )
    createdEntityIds.set(entity.id, elementId)

    ctx.shapeRegistryRef.current.set(entity.id, elementId)
    ctx.shapeDataRef.current.set(entity.id, {
      x: position.x,
      y: position.y,
      width: position.width,
      height: position.height,
      type: "rectangle",
    })

    // Add entity name header
    ctx.addElementMutation(
      createTextElement(position.x + 10, position.y + 10, position.width - 20, 24, entity.name, {
        strokeColor: customStroke || strokeColor,
        textAlign: "center",
        fontSize: "medium",
      }),
    )

    // Add divider line
    ctx.addElementMutation(
      createLineElement(
        position.x,
        position.y + 40,
        position.x + position.width,
        position.y + 40,
        customStroke || strokeColor,
      ),
    )

    // Add attributes
    let attributeY = position.y + 50
    for (const attr of entity.attributes) {
      const isPrimaryKey = entity.primaryKey === attr
      const attrText = isPrimaryKey ? `🔑 ${attr}` : attr

      ctx.addElementMutation(
        createTextElement(position.x + 10, attributeY, position.width - 20, 18, attrText, {
          strokeColor: foregroundColor,
          textAlign: "left",
          fontSize: "small",
        }),
      )
      attributeY += 20
    }
  }

  // Create relationships
  for (const rel of args.relationships) {
    const fromPos = layoutResult.entities.get(rel.from)
    const toPos = layoutResult.entities.get(rel.to)
    if (!fromPos || !toPos) continue

    const fromCenterX = fromPos.x + fromPos.width / 2
    const fromCenterY = fromPos.y + fromPos.height / 2
    const toCenterX = toPos.x + toPos.width / 2
    const toCenterY = toPos.y + toPos.height / 2

    const relType = rel.type || "association"
    let strokeColor = customStroke || foregroundColor
    let endArrow = false

    if (!customStroke) {
      if (relType === "inheritance") {
        endArrow = true
        strokeColor = strokeColors[6]
      } else if (relType === "composition") {
        strokeColor = strokeColors[3]
      } else if (relType === "aggregation") {
        strokeColor = strokeColors[12]
      }
    }

    ctx.addElementMutation(
      createLineElement(fromCenterX, fromCenterY, toCenterX, toCenterY, strokeColor, 2, { endArrow }),
    )

    // Add relationship label
    const midX = (fromCenterX + toCenterX) / 2
    const midY = (fromCenterY + toCenterY) / 2

    ctx.addElementMutation(
      createTextElement(midX - 40, midY - 25, 80, 18, rel.label, {
        strokeColor,
        backgroundColor: customBg || (isDark ? bgColors[1] : bgColors[0]),
        textAlign: "center",
        fontSize: "small",
        opacity: 0.95,
      }),
    )

    // Add cardinality symbols
    const fromCardSymbol = getCardinalitySymbol(rel.fromCardinality)
    const toCardSymbol = getCardinalitySymbol(rel.toCardinality)

    ctx.addElementMutation(
      createTextElement(
        fromCenterX + (toCenterX - fromCenterX) * 0.15 - 15,
        fromCenterY + (toCenterY - fromCenterY) * 0.15 - 20,
        30,
        18,
        fromCardSymbol,
        {
          strokeColor,
          backgroundColor: customBg || (isDark ? bgColors[1] : bgColors[0]),
          textAlign: "center",
          fontSize: "small",
          opacity: 0.95,
        },
      ),
    )

    ctx.addElementMutation(
      createTextElement(
        fromCenterX + (toCenterX - fromCenterX) * 0.85 - 15,
        fromCenterY + (toCenterY - fromCenterY) * 0.85 - 20,
        30,
        18,
        toCardSymbol,
        {
          strokeColor,
          backgroundColor: customBg || (isDark ? bgColors[1] : bgColors[0]),
          textAlign: "center",
          fontSize: "small",
          opacity: 0.95,
        },
      ),
    )
  }

  return {
    success: true,
    message: `Created ER diagram with ${args.entities.length} entities and ${args.relationships.length} relationships`,
    entityCount: args.entities.length,
    relationshipCount: args.relationships.length,
    entityIds: Object.fromEntries(createdEntityIds),
  }
}

// ===== Network Diagram Handler =====

export interface NetworkNodeWithColor extends NetworkNode {
  strokeColor?: string
  backgroundColor?: string
}

export interface CreateNetworkDiagramInput {
  nodes: NetworkNodeWithColor[]
  links: NetworkLink[]
  topology: "star" | "mesh" | "tree" | "ring" | "bus"
  centerNodeId?: string
  rootNodeId?: string
  colorScheme?: ColorScheme // Fallback colorScheme for all nodes
}

export function handleCreateNetworkDiagram(
  args: CreateNetworkDiagramInput,
  ctx: ToolHandlerContext,
): {
  success: boolean
  message: string
  nodeCount?: number
  linkCount?: number
  nodeIds?: Record<string, string>
} {
  if (!args || !args.nodes || !Array.isArray(args.nodes)) {
    return {
      success: false,
      message: "Invalid input: nodes array is required",
    }
  }

  if (!args.links || !Array.isArray(args.links)) {
    args.links = []
  }

  const isDark = ctx.resolvedTheme !== "light"
  const strokeColors = getStrokeColors(isDark)
  const bgColors = getBackgroundColors(isDark)

  const customStroke = args.colorScheme?.strokeColor
  const customBg = args.colorScheme?.backgroundColor
  const customText = args.colorScheme?.textColor
  const foregroundColor = customText || getForegroundColor(ctx.resolvedTheme)

  let layoutResult
  try {
    switch (args.topology) {
      case "star":
        if (!args.centerNodeId) {
          return { success: false, message: "Star topology requires centerNodeId parameter" }
        }
        layoutResult = starTopology(args.nodes, args.centerNodeId)
        break
      case "ring":
        layoutResult = ringTopology(args.nodes)
        break
      case "mesh":
        layoutResult = meshTopology(args.nodes, args.links)
        break
      case "tree":
        if (!args.rootNodeId) {
          return { success: false, message: "Tree topology requires rootNodeId parameter" }
        }
        layoutResult = treeTopology(args.nodes, args.links, args.rootNodeId)
        break
      case "bus":
        layoutResult = busTopology(args.nodes)
        break
      default:
        layoutResult = starTopology(args.nodes, args.nodes[0].id)
    }
  } catch (error) {
    return {
      success: false,
      message: `Layout error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }

  const createdNodeIds = new Map<string, string>()

  // Create nodes
  for (const node of args.nodes) {
    const position = layoutResult.nodes.get(node.id)
    if (!position) continue

    const elementId = generateId()
    const nodeStyle = getNodeStyleForType(node.type, ctx.resolvedTheme as "light" | "dark")

    // Per-node colors take priority, then global colorScheme, then defaults
    const nodeStrokeColor = node.strokeColor || customStroke || nodeStyle.strokeColor
    const nodeBgColor = node.backgroundColor || customBg || nodeStyle.backgroundColor

    ctx.addElementMutation(
      createShapeElement(nodeStyle.shape, position.x, position.y, position.width, position.height, {
        strokeColor: nodeStrokeColor,
        backgroundColor: nodeBgColor,
      }),
    )
    createdNodeIds.set(node.id, elementId)

    ctx.shapeRegistryRef.current.set(node.id, elementId)
    ctx.shapeDataRef.current.set(node.id, {
      x: position.x,
      y: position.y,
      width: position.width,
      height: position.height,
      type: nodeStyle.shape,
    })

    // Add label
    ctx.addElementMutation(
      createTextElement(position.x + 10, position.y + position.height / 2 - 10, position.width - 20, 20, node.label, {
        strokeColor: foregroundColor,
        textAlign: "center",
        fontSize: "small",
      }),
    )
  }

  // Create connections
  for (const link of args.links) {
    const fromPos = layoutResult.nodes.get(link.from)
    const toPos = layoutResult.nodes.get(link.to)
    if (!fromPos || !toPos) continue

    const fromCenterX = fromPos.x + fromPos.width / 2
    const fromCenterY = fromPos.y + fromPos.height / 2
    const toCenterX = toPos.x + toPos.width / 2
    const toCenterY = toPos.y + toPos.height / 2

    ctx.addElementMutation(
      createLineElement(fromCenterX, fromCenterY, toCenterX, toCenterY, customStroke || foregroundColor),
    )

    if (link.label || link.bandwidth) {
      const midX = (fromCenterX + toCenterX) / 2
      const midY = (fromCenterY + toCenterY) / 2
      const labelText = [link.label, link.bandwidth].filter(Boolean).join(" ")

      ctx.addElementMutation(
        createTextElement(midX - 40, midY - 15, 80, 20, labelText, {
          strokeColor: customStroke || strokeColors[12],
          backgroundColor: customBg || (isDark ? bgColors[1] : bgColors[0]),
          textAlign: "center",
          fontSize: "small",
          opacity: 0.9,
        }),
      )
    }
  }

  // Bus topology backbone
  if (args.topology === "bus") {
    ctx.addElementMutation(createLineElement(200, 400, 1800, 400, customStroke || strokeColors[7]))
  }

  return {
    success: true,
    message: `Created ${args.topology} network topology with ${args.nodes.length} nodes and ${args.links.length} links`,
    nodeCount: args.nodes.length,
    linkCount: args.links.length,
    nodeIds: Object.fromEntries(createdNodeIds),
  }
}

// ===== Generic Diagram Handler =====

export interface CreateDiagramInput {
  nodes: Node[]
  edges: Edge[]
  layout: "tree" | "circular" | "grid" | "force-directed"
  layoutOptions?: any
  colorScheme?: ColorScheme // Added colorScheme support
}

export function handleCreateDiagram(
  args: CreateDiagramInput,
  ctx: ToolHandlerContext,
): {
  success: boolean
  message: string
  nodeCount?: number
  edgeCount?: number
  nodeIds?: Record<string, string>
} {
  if (!args || !args.nodes || !Array.isArray(args.nodes)) {
    return {
      success: false,
      message: "Invalid input: nodes array is required",
    }
  }

  if (!args.edges || !Array.isArray(args.edges)) {
    args.edges = []
  }

  const isDark = ctx.resolvedTheme !== "light"
  const strokeColors = getStrokeColors(isDark)
  const bgColors = getBackgroundColors(isDark)

  const customStroke = args.colorScheme?.strokeColor
  const customBg = args.colorScheme?.backgroundColor

  let layoutResult
  switch (args.layout) {
    case "tree":
      layoutResult = treeLayout(args.nodes, args.edges, args.layoutOptions)
      break
    case "circular":
      layoutResult = circularLayout(args.nodes, args.edges, args.layoutOptions)
      break
    case "grid":
      layoutResult = gridLayout(args.nodes, args.edges, args.layoutOptions)
      break
    case "force-directed":
      layoutResult = forceDirectedLayout(args.nodes, args.edges, args.layoutOptions)
      break
    default:
      layoutResult = treeLayout(args.nodes, args.edges, args.layoutOptions)
  }

  const collisionCount = detectCollisions(layoutResult)
  const nodeElementIds = new Map<string, string>()

  // Create nodes
  for (const node of args.nodes) {
    const position = layoutResult.nodes.get(node.id)!
    const elementId = generateId()

    const element = createShapeElement(
      node.style?.shape || "rectangle",
      position.x,
      position.y,
      position.width,
      position.height,
      {
        strokeColor: customStroke || node.style?.strokeColor || strokeColors[8],
        backgroundColor: customBg || node.style?.backgroundColor || bgColors[9],
      },
    )

    if (node.label) {
      ;(element as any).text = node.label
      ;(element as any).textAlign = "center"
      ;(element as any).fontSize = "medium"
    }

    ctx.addElementMutation(element)
    nodeElementIds.set(node.id, elementId)
    ctx.shapeRegistryRef.current.set(node.id, elementId)
    ctx.shapeDataRef.current.set(node.id, {
      x: position.x,
      y: position.y,
      width: position.width,
      height: position.height,
      type: node.style?.shape || "rectangle",
    })
  }

  // Create edges
  for (const edge of args.edges) {
    const fromPos = layoutResult.nodes.get(edge.from)!
    const toPos = layoutResult.nodes.get(edge.to)!

    const fromCenterX = fromPos.x + fromPos.width / 2
    const fromCenterY = fromPos.y + fromPos.height / 2
    const toCenterX = toPos.x + toPos.width / 2
    const toCenterY = toPos.y + toPos.height / 2

    ctx.addElementMutation(
      createArrowElement(fromCenterX, fromCenterY, toCenterX, toCenterY, {
        strokeColor: customStroke || strokeColors[0],
        endArrow: edge.type === "arrow" || edge.type === undefined,
      }),
    )
  }

  return {
    success: true,
    message: `Created diagram with ${args.nodes.length} nodes, ${args.edges.length} edges using ${args.layout} layout`,
    nodeCount: args.nodes.length,
    edgeCount: args.edges.length,
    nodeIds: Object.fromEntries(nodeElementIds),
  }
}

// ===== Analysis Handlers =====

export function handleAnalyzeDiagram(ctx: ToolHandlerContext): {
  success: boolean
  overallQuality?: string
  issueCount?: number
  issues?: any[]
  suggestions?: string[]
  message: string
} {
  const currentElements = ctx.elements || []
  const analysis = analyzeDiagram(currentElements)

  return {
    success: true,
    overallQuality: analysis.overallQuality,
    issueCount: analysis.issues.length,
    issues: analysis.issues.map((issue) => ({
      type: issue.type,
      severity: issue.severity,
      description: issue.description,
      suggestion: issue.suggestion,
    })),
    suggestions: analysis.suggestions,
    message: `Diagram quality: ${analysis.overallQuality}. Found ${analysis.issues.length} issue(s).`,
  }
}

export function handleBeautifyDiagram(ctx: ToolHandlerContext): {
  success: boolean
  updatedCount: number
  message: string
} {
  const currentElements = ctx.elements || []
  const updates = beautifyDiagram(currentElements)

  if (updates.length > 0) {
    ctx.updateElements(updates)
  }

  return {
    success: true,
    updatedCount: updates.length,
    message: `Optimized diagram: adjusted ${updates.length} element(s) for better alignment and spacing`,
  }
}

export function handlePreviewDiagram(args: {
  nodes: Array<{ id: string; label: string; type?: string }>
  edges: Array<{ from: string; to: string; label?: string }>
}): {
  success: boolean
  preview: string
} {
  if (!args || !args.nodes) {
    return {
      success: false,
      preview: "No nodes provided for preview",
    }
  }

  const preview = args.nodes.map((node) => node.label).join(", ")
  return {
    success: true,
    preview,
  }
}
