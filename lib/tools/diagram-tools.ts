/**
 * Diagram creation tools - flowcharts, workflows, mind maps, org charts, etc.
 *
 * IMPORTANT: All these tools create SVG canvas elements, NOT React Flow nodes.
 * The diagrams are rendered on the custom SVG canvas (components/editor/canvas.tsx).
 *
 * React Flow is only used for connection path rendering in smart-connector-layer.tsx.
 * The disabled /app/workflow page is a separate React Flow experiment (not used by these tools).
 *
 * AI SDK v6 - uses inputSchema instead of parameters
 *
 * @see /components/editor/canvas.tsx - Main SVG canvas where diagrams are rendered
 * @see /lib/ai-chat/tool-handlers/ - Handler implementations
 * @see /components/editor/smart-connector-layer.tsx - React Flow for paths only
 */

import { tool } from "ai"
import {
  createFlowchartSchema,
  createWorkflowSchema,
  createMindMapSchema,
  createOrgChartSchema,
  createERDiagramSchema,
  createNetworkDiagramSchema,
  createMoleculeSchema,
} from "./schemas"

export const diagramTools = {
  createFlowchart: tool({
    description: "Create a flowchart with connected nodes as SVG shapes on the canvas. Supports per-node colors for visual distinction. Creates CanvasElement objects positioned in a hierarchical flow.",
    inputSchema: createFlowchartSchema,
  }),

  createWorkflow: tool({
    description: "Create n8n-style workflow automation diagrams as SVG shapes. Each node type (trigger, action, condition, loop, transform, output) gets a distinct shape and color. Creates CanvasElement objects, NOT React Flow nodes.",
    inputSchema: createWorkflowSchema,
  }),

  createMindMap: tool({
    description: "Create a mind map for brainstorming and idea organization as SVG shapes. Creates a radial tree layout with the central idea in the middle and branches extending outward.",
    inputSchema: createMindMapSchema,
  }),

  createOrgChart: tool({
    description: "Create an organizational chart showing team hierarchy as SVG rectangles. Automatically positions nodes in a tree structure with the top-level role at the top.",
    inputSchema: createOrgChartSchema,
  }),

  createERDiagram: tool({
    description: "Create an entity-relationship diagram for database design using SVG shapes. Entities are rendered as rectangles with their attributes listed inside.",
    inputSchema: createERDiagramSchema,
  }),

  createNetworkDiagram: tool({
    description: "Create a network/architecture diagram showing how systems connect as SVG shapes. Each node type (server, database, client, etc.) gets an appropriate shape. Supports per-node colors.",
    inputSchema: createNetworkDiagramSchema,
  }),

  createMolecule: tool({
    description: "Create a molecular structure diagram as SVG elements. Atoms are rendered as circles with element symbols, connected by lines representing bonds. Supports common molecules like H2O, CO2, CH4, etc.",
    inputSchema: createMoleculeSchema,
  }),
}
