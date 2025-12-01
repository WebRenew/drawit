// Professional styling system for AI-generated diagrams

export interface DiagramTheme {
  name: string
  description: string
  colors: {
    primary: string[]
    secondary: string[]
    accent: string[]
    neutral: string[]
  }
  typography: {
    fontSizes: {
      title: number
      heading: number
      body: number
      caption: number
    }
    fontWeights: {
      regular: string
      medium: string
      bold: string
    }
  }
  spacing: {
    compact: number
    normal: number
    spacious: number
  }
  borders: {
    width: number
    radius: number
    style: "solid" | "dashed" | "dotted"
  }
}

// Professional color palettes
export const DIAGRAM_THEMES: Record<string, DiagramTheme> = {
  professional: {
    name: "Professional",
    description: "Clean, corporate-friendly color scheme",
    colors: {
      primary: ["#2563eb", "#1d4ed8", "#1e40af"], // Blue shades
      secondary: ["#64748b", "#475569", "#334155"], // Slate shades
      accent: ["#10b981", "#059669", "#047857"], // Green shades
      neutral: ["#f8fafc", "#f1f5f9", "#e2e8f0"], // Light grays
    },
    typography: {
      fontSizes: {
        title: 24,
        heading: 18,
        body: 14,
        caption: 12,
      },
      fontWeights: {
        regular: "normal",
        medium: "500",
        bold: "bold",
      },
    },
    spacing: {
      compact: 80,
      normal: 120,
      spacious: 160,
    },
    borders: {
      width: 2,
      radius: 8,
      style: "solid",
    },
  },
  modern: {
    name: "Modern",
    description: "Bold, vibrant colors for contemporary designs",
    colors: {
      primary: ["#8b5cf6", "#7c3aed", "#6d28d9"], // Purple shades
      secondary: ["#ec4899", "#db2777", "#be185d"], // Pink shades
      accent: ["#f59e0b", "#d97706", "#b45309"], // Amber shades
      neutral: ["#fafafa", "#f5f5f5", "#e5e5e5"], // Neutral grays
    },
    typography: {
      fontSizes: {
        title: 26,
        heading: 20,
        body: 15,
        caption: 13,
      },
      fontWeights: {
        regular: "normal",
        medium: "600",
        bold: "bold",
      },
    },
    spacing: {
      compact: 100,
      normal: 140,
      spacious: 180,
    },
    borders: {
      width: 3,
      radius: 12,
      style: "solid",
    },
  },
  minimal: {
    name: "Minimal",
    description: "Simple, monochromatic design",
    colors: {
      primary: ["#18181b", "#27272a", "#3f3f46"], // Zinc darks
      secondary: ["#71717a", "#52525b", "#3f3f46"], // Zinc mediums
      accent: ["#a1a1aa", "#71717a", "#52525b"], // Zinc lights
      neutral: ["#ffffff", "#fafafa", "#f4f4f5"], // Whites
    },
    typography: {
      fontSizes: {
        title: 22,
        heading: 16,
        body: 13,
        caption: 11,
      },
      fontWeights: {
        regular: "normal",
        medium: "500",
        bold: "600",
      },
    },
    spacing: {
      compact: 70,
      normal: 100,
      spacious: 140,
    },
    borders: {
      width: 1.5,
      radius: 6,
      style: "solid",
    },
  },
}

// Node type to style mapping
export interface NodeStyle {
  shape: "rectangle" | "ellipse" | "diamond"
  colorIndex: number // Index into theme colors
  fontSizeKey: "title" | "heading" | "body" | "caption"
  fontWeightKey: "regular" | "medium" | "bold"
  opacity: number
  shadow: boolean
}

export const NODE_TYPE_STYLES: Record<string, NodeStyle> = {
  // Flowchart nodes
  start: {
    shape: "ellipse",
    colorIndex: 0, // Primary
    fontSizeKey: "heading",
    fontWeightKey: "bold",
    opacity: 1,
    shadow: true,
  },
  end: {
    shape: "ellipse",
    colorIndex: 2, // Accent
    fontSizeKey: "heading",
    fontWeightKey: "bold",
    opacity: 1,
    shadow: true,
  },
  process: {
    shape: "rectangle",
    colorIndex: 0, // Primary
    fontSizeKey: "body",
    fontWeightKey: "medium",
    opacity: 0.9,
    shadow: false,
  },
  decision: {
    shape: "diamond",
    colorIndex: 1, // Secondary
    fontSizeKey: "body",
    fontWeightKey: "medium",
    opacity: 0.9,
    shadow: false,
  },
  data: {
    shape: "rectangle",
    colorIndex: 2, // Accent
    fontSizeKey: "body",
    fontWeightKey: "regular",
    opacity: 0.85,
    shadow: false,
  },
  // Generic diagram nodes
  default: {
    shape: "rectangle",
    colorIndex: 0,
    fontSizeKey: "body",
    fontWeightKey: "regular",
    opacity: 0.9,
    shadow: false,
  },
  highlight: {
    shape: "rectangle",
    colorIndex: 2,
    fontSizeKey: "body",
    fontWeightKey: "bold",
    opacity: 1,
    shadow: true,
  },
}

// Helper to get styled properties for a node
export function getNodeStyling(
  nodeType: string,
  theme: DiagramTheme,
  isDark: boolean,
): {
  strokeColor: string
  backgroundColor: string
  fontSize: number
  fontWeight: string
  opacity: number
  strokeWidth: number
} {
  const style = NODE_TYPE_STYLES[nodeType] || NODE_TYPE_STYLES.default
  const colorPalette = theme.colors.primary // Default to primary

  // Select color based on type
  let colors: string[]
  if (nodeType === "decision") {
    colors = theme.colors.secondary
  } else if (nodeType === "data" || nodeType === "end" || nodeType === "highlight") {
    colors = theme.colors.accent
  } else {
    colors = theme.colors.primary
  }

  const strokeColor = colors[Math.min(style.colorIndex, colors.length - 1)]

  // Background is lighter version (add alpha or use neutral)
  const backgroundColor = isDark
    ? `${strokeColor}20` // 20% opacity in dark mode
    : theme.colors.neutral[0]

  return {
    strokeColor,
    backgroundColor,
    fontSize: theme.typography.fontSizes[style.fontSizeKey],
    fontWeight: theme.typography.fontWeights[style.fontWeightKey],
    opacity: style.opacity,
    strokeWidth: theme.borders.width,
  }
}

// Helper to apply consistent spacing
export function calculateSpacing(
  nodeCount: number,
  theme: DiagramTheme,
  spacingMode: "compact" | "normal" | "spacious" = "normal",
): number {
  const baseSpacing = theme.spacing[spacingMode]

  // Adjust spacing for larger diagrams
  if (nodeCount > 10) {
    return baseSpacing * 0.9
  } else if (nodeCount > 20) {
    return baseSpacing * 0.8
  }

  return baseSpacing
}

// Helper for text truncation and wrapping
export function formatNodeText(text: string, maxWidth: number, fontSize: number): string {
  const avgCharWidth = fontSize * 0.6
  const maxChars = Math.floor(maxWidth / avgCharWidth)

  if (text.length <= maxChars) {
    return text
  }

  // Try to break at word boundaries
  const words = text.split(" ")
  let lines: string[] = []
  let currentLine = ""

  for (const word of words) {
    if ((currentLine + " " + word).length <= maxChars) {
      currentLine = currentLine ? currentLine + " " + word : word
    } else {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    }
  }

  if (currentLine) lines.push(currentLine)

  // Limit to 3 lines
  if (lines.length > 3) {
    lines = lines.slice(0, 3)
    lines[2] = lines[2].substring(0, maxChars - 3) + "..."
  }

  return lines.join("\n")
}
