/**
 * Combined export of all AI tools
 */

import { canvasTools } from "./canvas-tools"
import { diagramTools } from "./diagram-tools"
import { shapeTools } from "./shape-tools"
import { styleTools } from "./style-tools"
import { backgroundTools } from "./background-tools"

export const allTools = {
  ...canvasTools,
  ...diagramTools,
  ...shapeTools,
  ...styleTools,
  ...backgroundTools,
}

// Type for tool names
export type ToolName = keyof typeof allTools

