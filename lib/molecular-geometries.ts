export type BondType = "single" | "double" | "triple"
export type MolecularGeometry =
  | "linear"
  | "bent"
  | "trigonal-planar"
  | "trigonal-pyramidal"
  | "tetrahedral"
  | "trigonal-bipyramidal"
  | "octahedral"

export interface AtomDefinition {
  symbol: string
  id: string
  bondType?: BondType
}

export interface MoleculeStructure {
  centralAtom: AtomDefinition
  surroundingAtoms: AtomDefinition[]
  geometry: MolecularGeometry
}

export interface AtomPosition {
  id: string
  symbol: string
  x: number
  y: number
  radius: number
  color: string
  bondType: BondType
}

export interface BondConnection {
  from: string
  to: string
  type: BondType
}

export interface MoleculeLayout {
  atoms: AtomPosition[]
  bonds: BondConnection[]
}

// Atom color palette (CPK coloring convention)
const ATOM_COLORS: Record<string, string> = {
  H: "#ffffff", // White
  C: "#343a40", // Gray/Black
  N: "#364fc7", // Blue
  O: "#c92a2a", // Red
  F: "#2b8a3e", // Green
  P: "#f76707", // Orange
  S: "#f59f00", // Yellow
  Cl: "#2b8a3e", // Green
  Br: "#a61e4d", // Brown/Red
  I: "#5f3dc4", // Purple
}

// Default atom radius in pixels
const DEFAULT_ATOM_RADIUS = 40

// Bond length in pixels
const BOND_LENGTH = 100

/**
 * Calculate positions for atoms based on molecular geometry
 */
export function calculateMolecularGeometry(
  structure: MoleculeStructure,
  centerX = 500,
  centerY = 400,
  bondLength: number = BOND_LENGTH,
): MoleculeLayout {
  const { centralAtom, surroundingAtoms, geometry } = structure

  const atoms: AtomPosition[] = []
  const bonds: BondConnection[] = []

  // Add central atom
  atoms.push({
    id: centralAtom.id,
    symbol: centralAtom.symbol,
    x: centerX,
    y: centerY,
    radius: DEFAULT_ATOM_RADIUS,
    color: ATOM_COLORS[centralAtom.symbol] || "#868e96",
    bondType: "single",
  })

  // Calculate surrounding atom positions based on geometry
  const positions = calculateAtomPositions(geometry, surroundingAtoms.length, bondLength)

  surroundingAtoms.forEach((atom, index) => {
    const pos = positions[index]
    atoms.push({
      id: atom.id,
      symbol: atom.symbol,
      x: centerX + pos.x,
      y: centerY + pos.y,
      radius: DEFAULT_ATOM_RADIUS,
      color: ATOM_COLORS[atom.symbol] || "#868e96",
      bondType: atom.bondType || "single",
    })

    bonds.push({
      from: centralAtom.id,
      to: atom.id,
      type: atom.bondType || "single",
    })
  })

  return { atoms, bonds }
}

/**
 * Calculate relative positions based on VSEPR geometry
 */
function calculateAtomPositions(
  geometry: MolecularGeometry,
  atomCount: number,
  bondLength: number,
): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = []

  switch (geometry) {
    case "linear": {
      // 180° between atoms
      positions.push({ x: -bondLength, y: 0 })
      if (atomCount > 1) positions.push({ x: bondLength, y: 0 })
      break
    }

    case "bent": {
      // ~104.5° for H2O, ~120° for SO2
      const angle = atomCount === 2 ? 104.5 : 120
      const halfAngle = (angle / 2) * (Math.PI / 180)
      positions.push({
        x: -bondLength * Math.cos(halfAngle),
        y: bondLength * Math.sin(halfAngle),
      })
      if (atomCount > 1) {
        positions.push({
          x: bondLength * Math.cos(halfAngle),
          y: bondLength * Math.sin(halfAngle),
        })
      }
      break
    }

    case "trigonal-planar": {
      // 120° between atoms, planar
      for (let i = 0; i < Math.min(atomCount, 3); i++) {
        const angle = (i * 120 - 90) * (Math.PI / 180) // Start from top
        positions.push({
          x: bondLength * Math.cos(angle),
          y: bondLength * Math.sin(angle),
        })
      }
      break
    }

    case "trigonal-pyramidal": {
      // ~107° bond angles, pyramid shape
      // Central atom at apex, three atoms at base
      const baseAngle = 120
      const pyramidHeight = bondLength * 0.8
      const baseRadius = bondLength * 0.6

      for (let i = 0; i < Math.min(atomCount, 3); i++) {
        const angle = (i * baseAngle - 90) * (Math.PI / 180)
        positions.push({
          x: baseRadius * Math.cos(angle),
          y: pyramidHeight + baseRadius * Math.sin(angle),
        })
      }
      break
    }

    case "tetrahedral": {
      // 109.5° bond angles, 3D tetrahedral
      // Approximated in 2D with strategic positioning
      positions.push({ x: 0, y: -bondLength }) // Top
      positions.push({ x: -bondLength * 0.866, y: bondLength * 0.5 }) // Bottom-left
      if (atomCount > 2) positions.push({ x: bondLength * 0.866, y: bondLength * 0.5 }) // Bottom-right
      if (atomCount > 3) positions.push({ x: 0, y: bondLength * 0.3 }) // Center-front
      break
    }

    case "trigonal-bipyramidal": {
      // 5 atoms: 3 equatorial (120°), 2 axial (180°)
      positions.push({ x: 0, y: -bondLength }) // Axial top
      positions.push({ x: 0, y: bondLength }) // Axial bottom
      for (let i = 0; i < Math.min(atomCount - 2, 3); i++) {
        const angle = i * 120 * (Math.PI / 180)
        positions.push({
          x: bondLength * 0.7 * Math.cos(angle),
          y: bondLength * 0.7 * Math.sin(angle),
        })
      }
      break
    }

    case "octahedral": {
      // 6 atoms: 4 square planar + 2 axial
      positions.push({ x: 0, y: -bondLength }) // Top
      positions.push({ x: 0, y: bondLength }) // Bottom
      positions.push({ x: -bondLength, y: 0 }) // Left
      positions.push({ x: bondLength, y: 0 }) // Right
      if (atomCount > 4) positions.push({ x: -bondLength * 0.5, y: -bondLength * 0.5 }) // Front-left
      if (atomCount > 5) positions.push({ x: bondLength * 0.5, y: -bondLength * 0.5 }) // Front-right
      break
    }
  }

  return positions
}

/**
 * Parse simple molecular formula like "H2O", "NH3", "CH4"
 */
export function parseMolecularFormula(formula: string): MoleculeStructure | null {
  // Very basic parser for common molecules
  const commonMolecules: Record<
    string,
    {
      central: string
      surrounding: Array<{ symbol: string; count: number; bondType?: BondType }>
      geometry: MolecularGeometry
    }
  > = {
    H2O: { central: "O", surrounding: [{ symbol: "H", count: 2 }], geometry: "bent" },
    NH3: { central: "N", surrounding: [{ symbol: "H", count: 3 }], geometry: "trigonal-pyramidal" },
    CH4: { central: "C", surrounding: [{ symbol: "H", count: 4 }], geometry: "tetrahedral" },
    CO2: { central: "C", surrounding: [{ symbol: "O", count: 2, bondType: "double" }], geometry: "linear" },
    H2S: { central: "S", surrounding: [{ symbol: "H", count: 2 }], geometry: "bent" },
    PH3: { central: "P", surrounding: [{ symbol: "H", count: 3 }], geometry: "trigonal-pyramidal" },
    SO2: { central: "S", surrounding: [{ symbol: "O", count: 2, bondType: "double" }], geometry: "bent" },
    BF3: { central: "B", surrounding: [{ symbol: "F", count: 3 }], geometry: "trigonal-planar" },
    PCl5: { central: "P", surrounding: [{ symbol: "Cl", count: 5 }], geometry: "trigonal-bipyramidal" },
    SF6: { central: "S", surrounding: [{ symbol: "F", count: 6 }], geometry: "octahedral" },
    C2H4: {
      central: "C",
      surrounding: [
        { symbol: "H", count: 2 },
        { symbol: "C", count: 1, bondType: "double" },
      ],
      geometry: "trigonal-planar",
    },
    C2H2: {
      central: "C",
      surrounding: [
        { symbol: "H", count: 1 },
        { symbol: "C", count: 1, bondType: "triple" },
      ],
      geometry: "linear",
    },
  }

  const molecule = commonMolecules[formula.toUpperCase()]
  if (!molecule) return null

  const centralAtom: AtomDefinition = {
    symbol: molecule.central,
    id: `${molecule.central}-center`,
  }

  const surroundingAtoms: AtomDefinition[] = []
  molecule.surrounding.forEach((group) => {
    for (let i = 0; i < group.count; i++) {
      surroundingAtoms.push({
        symbol: group.symbol,
        id: `${group.symbol}-${i + 1}`,
        bondType: group.bondType || "single",
      })
    }
  })

  return {
    centralAtom,
    surroundingAtoms,
    geometry: molecule.geometry,
  }
}
