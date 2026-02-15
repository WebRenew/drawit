"use client"

import { useRef } from "react"
// import { WorkflowCanvas } from "@/components/workflow/workflow-canvas"
import type { WorkflowCanvasHandle } from "@/components/workflow/workflow-canvas"
import { WorkflowAIChat } from "@/components/workflow/workflow-ai-chat"

/**
 * WORKFLOW PAGE - CURRENTLY DISABLED
 *
 * This page was intended to provide a React Flow-based workflow editor.
 * However, the main application uses a custom SVG canvas implementation instead.
 *
 * Current Status:
 * - The WorkflowCanvas component is commented out and not rendered
 * - The "createWorkflow" AI tool creates SVG shapes on the main canvas (/)
 * - This React Flow implementation is NOT integrated with the AI system
 *
 * If you want to enable this:
 * 1. Uncomment the WorkflowCanvas component below
 * 2. Create React Flow-specific AI tools (separate from SVG tools)
 * 3. Integrate WorkflowAIChat with the canvas ref properly
 *
 * Why Two Canvas Systems?
 * - Main canvas: Custom SVG for full control (components/editor/canvas.tsx)
 * - Workflow canvas: React Flow experiment (this page)
 * - React Flow IS used in main canvas, but only for connection path rendering
 *   (see components/editor/smart-connector-layer.tsx)
 *
 * @see /components/editor/canvas.tsx - Main SVG canvas used by AI
 * @see /lib/ai-chat/tool-handlers/workflow-handler.ts - Creates SVG workflows
 * @see /components/editor/smart-connector-layer.tsx - React Flow for paths only
 */
export default function WorkflowPage() {
  const canvasRef = useRef<WorkflowCanvasHandle | null>(null)

  return (
    <main className="w-screen h-screen overflow-hidden bg-background relative">
      {/* React Flow Canvas - DISABLED: See documentation above */}
      {/* <WorkflowCanvas ref={canvasRef} /> */}

      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center max-w-md">
          <p className="text-lg mb-2">React Flow Workflow Canvas</p>
          <p className="text-sm">This page is currently disabled. The main application uses a custom SVG canvas.</p>
          <p className="text-xs mt-4 opacity-60">
            To create workflows, use the AI chat on the main page (/)
          </p>
        </div>
      </div>

      <WorkflowAIChat canvasRef={canvasRef} />
    </main>
  )
}
