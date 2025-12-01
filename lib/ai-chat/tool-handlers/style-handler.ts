import type { ToolHandlerContext } from "../types"

export interface UpdateStylesInput {
  selector: "all" | "shapes" | "connections" | "byType" | "byIds"
  elementType?: string
  elementIds?: string[]
  styles: {
    strokeColor?: string
    backgroundColor?: string
    labelColor?: string
    strokeWidth?: number
    opacity?: number
  }
}

export function handleUpdateStyles(
  args: UpdateStylesInput,
  ctx: ToolHandlerContext,
): { success: boolean; message: string; updatedCount?: number } {
  if (!args || !args.styles) {
    return {
      success: false,
      message: "No style arguments provided",
    }
  }

  const elements = ctx.elements
  if (!elements || elements.length === 0) {
    return {
      success: false,
      message: "No elements on canvas to update",
    }
  }

  // Determine which elements to update based on selector
  let elementsToUpdate = [...elements]

  switch (args.selector) {
    case "all":
      // Update all elements
      break

    case "shapes":
      // Update only shape elements (not lines, arrows, or text-only)
      elementsToUpdate = elements.filter((el) => ["rectangle", "ellipse", "diamond", "circle"].includes(el.type))
      break

    case "connections":
      // Update only connection elements (lines, arrows)
      elementsToUpdate = elements.filter((el) => ["line", "arrow"].includes(el.type))
      break

    case "byType":
      if (!args.elementType) {
        return {
          success: false,
          message: "elementType is required when selector is 'byType'",
        }
      }
      // Map common type names to actual element types
      const typeMap: Record<string, string[]> = {
        rectangle: ["rectangle"],
        ellipse: ["ellipse", "circle"],
        circle: ["ellipse", "circle"],
        diamond: ["diamond"],
        text: ["text"],
        line: ["line"],
        arrow: ["arrow", "line"],
      }
      const matchTypes = typeMap[args.elementType.toLowerCase()] || [args.elementType]
      elementsToUpdate = elements.filter((el) => matchTypes.includes(el.type))
      break

    case "byIds":
      if (!args.elementIds || args.elementIds.length === 0) {
        return {
          success: false,
          message: "elementIds is required when selector is 'byIds'",
        }
      }
      elementsToUpdate = elements.filter((el) => args.elementIds!.includes(el.id))
      break

    default:
      return {
        success: false,
        message: `Unknown selector: ${args.selector}`,
      }
  }

  if (elementsToUpdate.length === 0) {
    return {
      success: false,
      message: `No elements found matching selector '${args.selector}'${args.elementType ? ` with type '${args.elementType}'` : ""}`,
    }
  }

  // Build updates array
  const updates = elementsToUpdate.map((el) => {
    const update: Partial<typeof el> & { id: string } = { id: el.id }

    if (args.styles.strokeColor !== undefined) {
      update.strokeColor = args.styles.strokeColor
    }
    if (args.styles.backgroundColor !== undefined) {
      update.backgroundColor = args.styles.backgroundColor
    }
    if (args.styles.labelColor !== undefined) {
      update.labelColor = args.styles.labelColor
    }
    if (args.styles.strokeWidth !== undefined) {
      update.strokeWidth = args.styles.strokeWidth
    }
    if (args.styles.opacity !== undefined) {
      update.opacity = args.styles.opacity
    }

    return update
  })

  // Apply updates
  ctx.updateElements(updates as any)

  const stylesList = Object.entries(args.styles)
    .filter(([_, v]) => v !== undefined)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ")

  return {
    success: true,
    message: `Updated ${updates.length} element(s) with styles: ${stylesList}`,
    updatedCount: updates.length,
  }
}
