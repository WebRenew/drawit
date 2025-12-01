"use client"

import { useRef } from "react"
// import { WorkflowCanvas, type WorkflowCanvasHandle } from "@/components/workflow/workflow-canvas"
import { WorkflowAIChat } from "@/components/workflow/workflow-ai-chat"

export default function WorkflowPage() {
  const canvasRef = useRef<any>(null)

  return (
    <main className="w-screen h-screen overflow-hidden bg-background relative">
      {/* <WorkflowCanvas ref={canvasRef} /> */}
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        <p>Workflow Canvas - Use the AI chat to create workflows</p>
      </div>
      <WorkflowAIChat canvasRef={canvasRef} />
    </main>
  )
}
