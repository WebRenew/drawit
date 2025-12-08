/**
 * AI Quick Create - Server-side diagram generation via Trigger.dev
 * 
 * This component provides a quick way to generate diagrams using
 * server-side AI processing for complex diagrams that need more
 * compute time or reliability.
 */

"use client"

import { useState } from "react"
import { Wand2, Loader2, X, CheckCircle2, AlertCircle } from "lucide-react"
import { useAIDiagram } from "@/hooks/use-ai-diagram"
import { useCanvasStore } from "@/lib/store"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"
import { nanoid } from "nanoid"

interface QuickCreateProps {
  canvasDimensions?: {
    width: number
    height: number
    centerX: number
    centerY: number
  }
}

const QUICK_PROMPTS = [
  { label: "Flowchart", prompt: "Create a software development lifecycle flowchart with start, design, develop, test, deploy, and end stages. Use different colors for each stage." },
  { label: "Architecture", prompt: "Create a web application architecture diagram showing frontend, API gateway, backend services, database, and cache. Use star topology with API gateway in center." },
  { label: "Mind Map", prompt: "Create a mind map for project planning with branches for Timeline, Resources, Risks, Goals, and Deliverables. Add 2-3 sub-items for each branch." },
  { label: "Org Chart", prompt: "Create an organizational chart with CEO at top, 3 VPs reporting to CEO, and 2 managers under each VP." },
]

export function AIQuickCreate({ canvasDimensions }: QuickCreateProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customPrompt, setCustomPrompt] = useState("")
  const { status, progress, error, trigger, cancel } = useAIDiagram()
  const { user } = useAuth()
  
  const addElement = useCanvasStore((state) => state.addElement)
  const addConnection = useCanvasStore((state) => state.addConnection)
  const currentDiagramId = useCanvasStore((state) => state.currentDiagramId)

  const handleQuickCreate = async (prompt: string) => {
    if (!user) return

    const result = await trigger({
      prompt,
      canvasInfo: canvasDimensions || {
        centerX: 400,
        centerY: 300,
        width: 800,
        height: 600,
      },
      theme: "dark",
      diagramId: currentDiagramId || undefined,
    })

    if (result) {
      // Add elements to canvas
      result.elements.forEach((element) => {
        addElement({
          id: element.id || nanoid(),
          type: mapElementType(element.type),
          x: element.x || 0,
          y: element.y || 0,
          width: element.width || 160,
          height: element.height || 60,
          strokeColor: element.strokeColor || "#4a90d9",
          backgroundColor: element.backgroundColor || "#1a1a2e",
          label: element.label,
          opacity: 100,
          roughness: 0,
          strokeWidth: 2,
          strokeStyle: "solid",
          angle: 0,
          seed: Math.random() * 1000,
        })
      })

      // Add connections
      result.connections.forEach((conn) => {
        addConnection({
          id: nanoid(),
          startElementId: conn.from,
          endElementId: conn.to,
          startPoint: "right",
          endPoint: "left",
          routingType: "smoothstep",
          strokeColor: "#6b7280",
          strokeWidth: 2,
          animated: false,
          label: conn.label,
        })
      })

      setIsOpen(false)
      setCustomPrompt("")
    }
  }

  const mapElementType = (type: string): "rectangle" | "ellipse" | "diamond" | "text" | "line" | "arrow" | "freedraw" | "image" => {
    switch (type) {
      case "start":
      case "end":
      case "ellipse":
        return "ellipse"
      case "decision":
      case "diamond":
        return "diamond"
      case "text":
        return "text"
      default:
        return "rectangle"
    }
  }

  if (!user) return null

  const isRunning = status === "triggering" || status === "running"

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-4 left-4 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-colors",
          isRunning
            ? "bg-orange-500 text-white"
            : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
        )}
        aria-label="Quick Create"
        disabled={isRunning}
      >
        {isRunning ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Wand2 className="h-5 w-5" />
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-20 left-4 z-50 w-80 bg-background border border-border rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-purple-500" />
              <h3 className="font-semibold text-sm">AI Quick Create</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-muted text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-3 space-y-3">
            {/* Status */}
            {isRunning && (
              <div className="flex items-center gap-2 p-2 bg-orange-500/10 rounded text-sm text-orange-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{progress || "Processing..."}</span>
                <button
                  onClick={cancel}
                  className="ml-auto text-xs underline hover:no-underline"
                >
                  Cancel
                </button>
              </div>
            )}

            {status === "completed" && (
              <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded text-sm text-green-500">
                <CheckCircle2 className="h-4 w-4" />
                <span>Diagram created!</span>
              </div>
            )}

            {status === "failed" && error && (
              <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded text-sm text-red-500">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Prompts */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Quick Templates</p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_PROMPTS.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleQuickCreate(item.prompt)}
                    disabled={isRunning}
                    className={cn(
                      "px-3 py-2 text-xs font-medium rounded border transition-colors",
                      isRunning
                        ? "opacity-50 cursor-not-allowed bg-muted"
                        : "bg-muted/50 hover:bg-muted border-border hover:border-primary/50"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Prompt */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Custom Request</p>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe the diagram you want to create..."
                className="w-full h-20 px-3 py-2 text-sm bg-muted/50 border border-border rounded resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={isRunning}
              />
              <button
                onClick={() => handleQuickCreate(customPrompt)}
                disabled={isRunning || !customPrompt.trim()}
                className={cn(
                  "w-full px-3 py-2 text-sm font-medium rounded transition-colors",
                  isRunning || !customPrompt.trim()
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                )}
              >
                {isRunning ? "Generating..." : "Generate Diagram"}
              </button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Powered by Trigger.dev • Complex diagrams in seconds
            </p>
          </div>
        </div>
      )}
    </>
  )
}

