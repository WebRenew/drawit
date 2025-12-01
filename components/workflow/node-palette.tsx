"use client"

import type { DragEvent } from "react"
import { NODE_TEMPLATES, type WorkflowNodeType } from "@/lib/workflow-types"
import { cn } from "@/lib/utils"
import { Play, Zap, GitBranch, Repeat, Shuffle, CheckCircle } from "lucide-react"

const iconMap = {
  play: Play,
  zap: Zap,
  "git-branch": GitBranch,
  repeat: Repeat,
  shuffle: Shuffle,
  "check-circle": CheckCircle,
}

interface NodePaletteProps {
  className?: string
}

export function NodePalette({ className }: NodePaletteProps) {
  const onDragStart = (event: DragEvent, nodeType: WorkflowNodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType)
    event.dataTransfer.effectAllowed = "move"
  }

  return (
    <div className={cn("p-4 space-y-2", className)}>
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Nodes</h3>
      <div className="space-y-2">
        {(Object.entries(NODE_TEMPLATES) as [WorkflowNodeType, (typeof NODE_TEMPLATES)[WorkflowNodeType]][]).map(
          ([type, template]) => {
            const Icon = template.icon ? iconMap[template.icon as keyof typeof iconMap] : Zap
            return (
              <div
                key={type}
                draggable
                onDragStart={(e) => onDragStart(e, type)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-grab",
                  "bg-card hover:bg-accent transition-colors",
                  "active:cursor-grabbing",
                )}
              >
                <div className="p-1.5 rounded-md bg-muted">
                  {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div>
                  <div className="text-sm font-medium capitalize">{type}</div>
                  <div className="text-xs text-muted-foreground">{template.description as string}</div>
                </div>
              </div>
            )
          },
        )}
      </div>
    </div>
  )
}
