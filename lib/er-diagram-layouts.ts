export interface EREntity {
  id: string
  name: string
  attributes: string[]
  primaryKey?: string
  type?: "entity" | "weak-entity" | "associative"
}

export interface ERRelationship {
  from: string
  to: string
  label: string
  fromCardinality: "1" | "N" | "M" | "0..1" | "1..1" | "0..N" | "1..N"
  toCardinality: "1" | "N" | "M" | "0..1" | "1..1" | "0..N" | "1..N"
  type?: "inheritance" | "composition" | "aggregation" | "association"
}

export interface ERLayoutResult {
  entities: Map<
    string,
    {
      x: number
      y: number
      width: number
      height: number
    }
  >
}

export function erDiagramLayout(entities: EREntity[]): ERLayoutResult {
  const result: ERLayoutResult = {
    entities: new Map(),
  }

  // Calculate dimensions based on attributes
  const entityWidth = 180
  const baseEntityHeight = 60
  const attributeHeight = 20

  // Use a grid-based layout for ER diagrams
  const columns = Math.ceil(Math.sqrt(entities.length))
  const horizontalSpacing = 300
  const verticalSpacing = 250

  entities.forEach((entity, index) => {
    const row = Math.floor(index / columns)
    const col = index % columns

    const attributeCount = entity.attributes.length
    const entityHeight = baseEntityHeight + attributeCount * attributeHeight

    result.entities.set(entity.id, {
      x: 200 + col * horizontalSpacing,
      y: 150 + row * verticalSpacing,
      width: entityWidth,
      height: entityHeight,
    })
  })

  return result
}

export function getCardinalitySymbol(cardinality: string): string {
  switch (cardinality) {
    case "1":
      return "1"
    case "N":
    case "M":
      return "∗"
    case "0..1":
      return "0..1"
    case "1..1":
      return "1"
    case "0..N":
      return "0..∗"
    case "1..N":
      return "1..∗"
    default:
      return cardinality
  }
}
