import type { ToolHandlerContext } from "../types"
import { getForegroundColor, generateId } from "../canvas-helpers"
import { createTextElement, createShapeElement } from "../element-creators"
import { calculateMolecularGeometry, parseMolecularFormula, type BondType } from "@/lib/molecular-geometries"

export interface CreateMoleculeInput {
  formula?: string
  centralAtom?: string
  surroundingAtoms?: Array<{ symbol: string; bondType?: BondType }>
  geometry?: string
  centerX?: number
  centerY?: number
  bondLength?: number
  atomRadius?: number
}

export function handleCreateMolecule(
  args: CreateMoleculeInput,
  ctx: ToolHandlerContext,
): {
  success: boolean
  message: string
  atomCount?: number
  bondCount?: number
  geometry?: string
  atomIds?: Record<string, string>
} {
  if (!args) {
    return {
      success: false,
      message: "No arguments provided to createMolecule tool",
    }
  }

  const foregroundColor = getForegroundColor(ctx.resolvedTheme)

  let moleculeStructure

  // Parse from formula if provided
  if (args.formula) {
    moleculeStructure = parseMolecularFormula(args.formula)
    if (!moleculeStructure) {
      return {
        success: false,
        message: `Unknown molecular formula: ${args.formula}. Try common molecules like H2O, NH3, CH4, CO2, BF3, PCl5, SF6.`,
      }
    }
  } else if (args.centralAtom && args.surroundingAtoms && args.geometry) {
    // Build from custom definition
    moleculeStructure = {
      centralAtom: {
        symbol: args.centralAtom,
        id: `${args.centralAtom}-center`,
      },
      surroundingAtoms: args.surroundingAtoms.map((atom, i) => ({
        symbol: atom.symbol,
        id: `${atom.symbol}-${i + 1}`,
        bondType: atom.bondType || "single",
      })),
      geometry: args.geometry as any,
    }
  } else {
    return {
      success: false,
      message: "Must provide either 'formula' or 'centralAtom' + 'surroundingAtoms' + 'geometry'",
    }
  }

  // Calculate molecular layout
  const layout = calculateMolecularGeometry(
    moleculeStructure,
    args.centerX || 500,
    args.centerY || 400,
    args.bondLength || 100,
  )

  const atomRadius = args.atomRadius || 40
  const atomIds = new Map<string, string>()

  // Create atom shapes
  for (const atom of layout.atoms) {
    const elementId = generateId()

    ctx.addElementMutation(
      createShapeElement("ellipse", atom.x - atomRadius, atom.y - atomRadius, atomRadius * 2, atomRadius * 2, {
        strokeColor: foregroundColor,
        backgroundColor: atom.color,
      }),
    )
    atomIds.set(atom.id, elementId)

    // Add atom label
    ctx.addElementMutation(
      createTextElement(atom.x - 15, atom.y - 10, 30, 20, atom.symbol, {
        strokeColor: foregroundColor,
        textAlign: "center",
        fontSize: "medium",
        fontWeight: "bold",
      }),
    )

    // Store in registry
    ctx.shapeRegistryRef.current.set(atom.id, elementId)
    ctx.shapeDataRef.current.set(atom.id, {
      x: atom.x - atomRadius,
      y: atom.y - atomRadius,
      width: atomRadius * 2,
      height: atomRadius * 2,
      type: "ellipse",
    })
  }

  // Create bonds
  for (const bond of layout.bonds) {
    const fromAtom = layout.atoms.find((a) => a.id === bond.from)!
    const toAtom = layout.atoms.find((a) => a.id === bond.to)!

    // Calculate the angle from center of each atom to the other atom's center
    const fromToAngle = Math.atan2(toAtom.y - fromAtom.y, toAtom.x - fromAtom.x)
    const toFromAngle = Math.atan2(fromAtom.y - toAtom.y, fromAtom.x - toAtom.x)

    // For ellipse shapes, calculate intersection point on the boundary
    // Using the parametric ellipse equation: x = cx + rx*cos(t), y = cy + ry*sin(t)
    const start = {
      x: fromAtom.x + atomRadius * Math.cos(fromToAngle),
      y: fromAtom.y + atomRadius * Math.sin(fromToAngle),
    }
    const end = {
      x: toAtom.x + atomRadius * Math.cos(toFromAngle),
      y: toAtom.y + atomRadius * Math.sin(toFromAngle),
    }

    // Create bond line(s) based on bond type
    const bondType = bond.type || "single"
    const dx = end.x - start.x
    const dy = end.y - start.y
    const len = Math.sqrt(dx * dx + dy * dy)

    const perpX = len > 0 ? (-dy / len) * 4 : 0
    const perpY = len > 0 ? (dx / len) * 4 : 0

    if (bondType === "single") {
      ctx.addElementMutation({
        type: "line",
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        width: Math.abs(end.x - start.x) || 1,
        height: Math.abs(end.y - start.y) || 1,
        strokeColor: foregroundColor,
        strokeWidth: 3,
        backgroundColor: "transparent",
        opacity: 1,
        isLocked: false,
        groupId: undefined,
        points: [
          [start.x < end.x ? 0 : Math.abs(end.x - start.x), start.y < end.y ? 0 : Math.abs(end.y - start.y)],
          [start.x < end.x ? Math.abs(end.x - start.x) : 0, start.y < end.y ? Math.abs(end.y - start.y) : 0],
        ],
      } as any)
    } else if (bondType === "double") {
      // Two parallel lines
      for (const offset of [-1, 1]) {
        const offsetX = perpX * offset
        const offsetY = perpY * offset
        ctx.addElementMutation({
          type: "line",
          x: Math.min(start.x + offsetX, end.x + offsetX),
          y: Math.min(start.y + offsetY, end.y + offsetY),
          width: Math.abs(end.x - start.x) || 1,
          height: Math.abs(end.y - start.y) || 1,
          strokeColor: foregroundColor,
          strokeWidth: 2,
          backgroundColor: "transparent",
          opacity: 1,
          isLocked: false,
          groupId: undefined,
          points: [
            [
              start.x + offsetX < end.x + offsetX ? 0 : Math.abs(end.x - start.x),
              start.y + offsetY < end.y + offsetY ? 0 : Math.abs(end.y - start.y),
            ],
            [
              start.x + offsetX < end.x + offsetX ? Math.abs(end.x - start.x) : 0,
              start.y + offsetY < end.y + offsetY ? Math.abs(end.y - start.y) : 0,
            ],
          ],
        } as any)
      }
    } else if (bondType === "triple") {
      // Three parallel lines
      for (const offset of [-1.5, 0, 1.5]) {
        const offsetX = perpX * offset
        const offsetY = perpY * offset
        ctx.addElementMutation({
          type: "line",
          x: Math.min(start.x + offsetX, end.x + offsetX),
          y: Math.min(start.y + offsetY, end.y + offsetY),
          width: Math.abs(end.x - start.x) || 1,
          height: Math.abs(end.y - start.y) || 1,
          strokeColor: foregroundColor,
          strokeWidth: 2,
          backgroundColor: "transparent",
          opacity: 1,
          isLocked: false,
          groupId: undefined,
          points: [
            [
              start.x + offsetX < end.x + offsetX ? 0 : Math.abs(end.x - start.x),
              start.y + offsetY < end.y + offsetY ? 0 : Math.abs(end.y - start.y),
            ],
            [
              start.x + offsetX < end.x + offsetX ? Math.abs(end.x - start.x) : 0,
              start.y + offsetY < end.y + offsetY ? Math.abs(end.y - start.y) : 0,
            ],
          ],
        } as any)
      }
    }
  }

  return {
    success: true,
    message: `Created ${args.formula || "custom"} molecule with ${layout.atoms.length} atoms and ${layout.bonds.length} bonds`,
    atomCount: layout.atoms.length,
    bondCount: layout.bonds.length,
    geometry: moleculeStructure.geometry,
    atomIds: Object.fromEntries(atomIds),
  }
}
