// Export all tool handlers from a single entry point

// Re-export canvas state handler
import { handleGetCanvasState as _handleGetCanvasState } from "./canvas-state-handler"
export const handleGetCanvasState = _handleGetCanvasState
export type { CanvasStateOutput } from "./canvas-state-handler"

// Re-export image handler
import { handlePlaceImage as _handlePlaceImage } from "./image-handler"
export const handlePlaceImage = _handlePlaceImage

// Re-export shape handlers
import {
  handleCreateShape as _handleCreateShape,
  handleGetShapeInfo as _handleGetShapeInfo,
  handleUpdateShape as _handleUpdateShape,
  handleClearCanvas as _handleClearCanvas,
} from "./shape-handlers"
export const handleCreateShape = _handleCreateShape
export const handleGetShapeInfo = _handleGetShapeInfo
export const handleUpdateShape = _handleUpdateShape
export const handleClearCanvas = _handleClearCanvas

// Re-export style handler
import { handleUpdateStyles as _handleUpdateStyles } from "./style-handler"
export const handleUpdateStyles = _handleUpdateStyles

// Re-export diagram handlers
import {
  handleCreateERDiagram as _handleCreateERDiagram,
  handleCreateNetworkDiagram as _handleCreateNetworkDiagram,
  handleCreateDiagram as _handleCreateDiagram,
  handleAnalyzeDiagram as _handleAnalyzeDiagram,
  handleBeautifyDiagram as _handleBeautifyDiagram,
  handlePreviewDiagram as _handlePreviewDiagram,
} from "./diagram-handlers"
export const handleCreateERDiagram = _handleCreateERDiagram
export const handleCreateNetworkDiagram = _handleCreateNetworkDiagram
export const handleCreateDiagram = _handleCreateDiagram
export const handleAnalyzeDiagram = _handleAnalyzeDiagram
export const handleBeautifyDiagram = _handleBeautifyDiagram
export const handlePreviewDiagram = _handlePreviewDiagram

// Re-export flowchart handler
import { handleCreateFlowchart as _handleCreateFlowchart } from "./flowchart-handler"
export const handleCreateFlowchart = _handleCreateFlowchart

// Re-export molecule handler
import { handleCreateMolecule as _handleCreateMolecule } from "./molecule-handler"
export const handleCreateMolecule = _handleCreateMolecule

// Re-export org chart handler
import { handleCreateOrgChart as _handleCreateOrgChart } from "./org-chart-handler"
export const handleCreateOrgChart = _handleCreateOrgChart
