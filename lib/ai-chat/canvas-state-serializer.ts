/**
 * Canvas State Serializer
 * Creates a compact JSON representation of canvas state for AI agent context
 * This is automatically included in every request so the agent knows what's on the canvas
 */

import type { CanvasElement, SmartConnection } from "@/lib/types"

/**
 * Compact element representation for AI context
 * Includes only the properties the AI needs to understand and edit elements
 */
export interface SerializedElement {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  label?: string
  text?: string
  strokeColor?: string
  backgroundColor?: string
  // Connection tracking
  connectable?: boolean
}

/**
 * Compact connection representation for AI context
 */
export interface SerializedConnection {
  id: string
  sourceId: string
  targetId: string
  label?: string
}

/**
 * Full canvas state for AI context
 */
export interface SerializedCanvasState {
  /** Number of elements on canvas */
  elementCount: number
  /** Number of connections on canvas */
  connectionCount: number
  /** Compact element list */
  elements: SerializedElement[]
  /** Compact connection list */
  connections: SerializedConnection[]
  /** Bounding box of all content */
  bounds: {
    minX: number
    minY: number
    maxX: number
    maxY: number
    width: number
    height: number
  } | null
  /** Summary for quick understanding */
  summary: string
}

/**
 * Serialize a single element to compact form
 */
function serializeElement(el: CanvasElement): SerializedElement {
  const serialized: SerializedElement = {
    id: el.id,
    type: el.type,
    x: Math.round(el.x),
    y: Math.round(el.y),
    width: Math.round(el.width),
    height: Math.round(el.height),
  }

  // Only include optional fields if they have values
  if (el.label) serialized.label = el.label
  if (el.text) serialized.text = el.text
  if (el.strokeColor && typeof el.strokeColor === "string") {
    serialized.strokeColor = el.strokeColor
  }
  if (el.backgroundColor && el.backgroundColor !== "transparent") {
    serialized.backgroundColor = el.backgroundColor
  }
  if (el.connectable) serialized.connectable = true

  return serialized
}

/**
 * Serialize a single connection to compact form
 */
function serializeConnection(conn: SmartConnection): SerializedConnection {
  const serialized: SerializedConnection = {
    id: conn.id,
    sourceId: conn.sourceId,
    targetId: conn.targetId,
  }

  if (conn.label) serialized.label = conn.label

  return serialized
}

/**
 * Calculate bounding box of all elements
 */
function calculateBounds(elements: CanvasElement[]): SerializedCanvasState["bounds"] {
  if (elements.length === 0) return null

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const el of elements) {
    minX = Math.min(minX, el.x)
    minY = Math.min(minY, el.y)
    maxX = Math.max(maxX, el.x + el.width)
    maxY = Math.max(maxY, el.y + el.height)
  }

  return {
    minX: Math.round(minX),
    minY: Math.round(minY),
    maxX: Math.round(maxX),
    maxY: Math.round(maxY),
    width: Math.round(maxX - minX),
    height: Math.round(maxY - minY),
  }
}

/**
 * Generate a human-readable summary of canvas contents
 */
function generateSummary(elements: CanvasElement[], connections: SmartConnection[]): string {
  if (elements.length === 0) {
    return "Canvas is empty."
  }

  // Count element types
  const typeCounts = new Map<string, number>()
  for (const el of elements) {
    typeCounts.set(el.type, (typeCounts.get(el.type) || 0) + 1)
  }

  const typeList = Array.from(typeCounts.entries())
    .map(([type, count]) => `${count} ${type}${count > 1 ? "s" : ""}`)
    .join(", ")

  const connInfo = connections.length > 0 
    ? ` with ${connections.length} connection${connections.length > 1 ? "s" : ""}`
    : ""

  return `Canvas has ${elements.length} element${elements.length > 1 ? "s" : ""} (${typeList})${connInfo}.`
}

/**
 * Serialize full canvas state for AI context
 * This creates a compact JSON object that tells the AI what's currently on the canvas
 */
export function serializeCanvasState(
  elements: CanvasElement[],
  connections: SmartConnection[]
): SerializedCanvasState {
  return {
    elementCount: elements.length,
    connectionCount: connections.length,
    elements: elements.map(serializeElement),
    connections: connections.map(serializeConnection),
    bounds: calculateBounds(elements),
    summary: generateSummary(elements, connections),
  }
}

/**
 * Create a minimal state string for the system prompt
 * This is a more compact representation for token efficiency
 */
export function createCanvasContextString(
  elements: CanvasElement[],
  connections: SmartConnection[]
): string {
  if (elements.length === 0) {
    return "CURRENT CANVAS: Empty - no elements or connections."
  }

  const state = serializeCanvasState(elements, connections)
  
  // Create compact element list
  const elementList = state.elements
    .slice(0, 20) // Limit to first 20 to avoid token bloat
    .map(el => {
      const label = el.label || el.text || ""
      const labelPart = label ? ` "${label}"` : ""
      return `  - ${el.id}: ${el.type}${labelPart} at (${el.x},${el.y}) size ${el.width}x${el.height}`
    })
    .join("\n")

  const truncatedNote = elements.length > 20 
    ? `\n  ... and ${elements.length - 20} more elements`
    : ""

  // Create compact connection list  
  const connectionList = state.connections.length > 0
    ? "\nConnections:\n" + state.connections
        .slice(0, 15)
        .map(c => `  - ${c.sourceId} → ${c.targetId}${c.label ? ` "${c.label}"` : ""}`)
        .join("\n")
    : ""

  const connTruncatedNote = connections.length > 15
    ? `\n  ... and ${connections.length - 15} more connections`
    : ""

  return `CURRENT CANVAS STATE:
${state.summary}
Elements:
${elementList}${truncatedNote}${connectionList}${connTruncatedNote}

Use these IDs when updating existing elements. Create new IDs for new elements.`
}

