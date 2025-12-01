"use client"

import type React from "react"
import { Icons } from "./icons"
import { cn } from "@/lib/utils"
import type { ToolType } from "@/lib/types"
import { useIsMobile } from "@/hooks/use-mobile"

interface ToolbarProps {
  activeTool: ToolType
  onToolChange: (tool: ToolType) => void
  undo?: () => void
  redo?: () => void
}

export function Toolbar({ activeTool, onToolChange }: ToolbarProps) {
  const isMobile = useIsMobile()

  const tools: { id: ToolType; icon: React.ElementType; label: string; shortcut?: string }[] = [
    { id: "selection", icon: Icons.Cursor, label: "Selection", shortcut: "1" },
    { id: "hand", icon: Icons.Hand, label: "Pan", shortcut: "H" },
    { id: "rectangle", icon: Icons.Square, label: "Rectangle", shortcut: "2" },
    { id: "diamond", icon: Icons.Diamond, label: "Diamond", shortcut: "3" },
    { id: "ellipse", icon: Icons.Circle, label: "Ellipse", shortcut: "4" },
    { id: "arrow", icon: Icons.Arrow, label: "Arrow", shortcut: "5" },
    { id: "line", icon: Icons.Line, label: "Line", shortcut: "6" },
    { id: "connector", icon: Icons.Connector, label: "Smart Connector", shortcut: "C" },
    { id: "freedraw", icon: Icons.Pen, label: "Draw", shortcut: "7" },
    { id: "text", icon: Icons.Text, label: "Text", shortcut: "8" },
    { id: "image", icon: Icons.Image, label: "Image", shortcut: "9" },
    { id: "eraser", icon: Icons.Eraser, label: "Eraser", shortcut: "0" },
  ]

  return (
    <div
      className={cn(
        "absolute z-50 flex items-center gap-1 p-1 bg-card rounded-lg shadow-sm border border-border/50",
        isMobile ? "top-2 left-2 right-2 overflow-x-auto scrollbar-hide" : "top-4 left-1/2 -translate-x-1/2 max-w-fit",
      )}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        className={cn(
          "p-2 hover:bg-secondary rounded-md text-muted-foreground transition-colors",
          isMobile && "hidden",
        )}
        title="Keep selected tool active"
      >
        <Icons.Lock className="w-4 h-4" />
      </button>

      {!isMobile && <div className="w-px h-4 bg-border mx-1" />}

      {tools.map((tool) => {
        const Icon = tool.icon
        const isActive = activeTool === tool.id
        return (
          <button
            key={tool.id}
            onClick={() => onToolChange(tool.id)}
            className={cn(
              "relative group p-2 rounded-md transition-all duration-200",
              isActive
                ? "bg-primary/10 text-primary"
                : "hover:bg-secondary text-muted-foreground hover:text-foreground",
              isMobile && "min-w-[44px] min-h-[44px] flex items-center justify-center",
            )}
            title={`${tool.label} ${tool.shortcut ? `(${tool.shortcut})` : ""}`}
          >
            <Icon className="w-4 h-4" />
            <span className="sr-only">{tool.label}</span>
            {tool.shortcut && !isMobile && (
              <span className="absolute bottom-0.5 right-1 text-[8px] opacity-50 font-mono">{tool.shortcut}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
