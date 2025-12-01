"use client"

import { memo } from "react"
import { Handle, Position } from "@xyflow/react"
import { cn } from "@/lib/utils"
import type { WorkflowNodeData } from "@/lib/workflow-types"
import { Play, Zap, GitBranch, Repeat, Shuffle, CheckCircle, Loader2 } from "lucide-react"

interface WorkflowNodeProps {
  data: WorkflowNodeData
  selected?: boolean
}

const iconMap = {
  play: Play,
  zap: Zap,
  "git-branch": GitBranch,
  repeat: Repeat,
  shuffle: Shuffle,
  "check-circle": CheckCircle,
}

const typeColors: Record<string, { bg: string; border: string; text: string }> = {
  trigger: {
    bg: "bg-green-50 dark:bg-green-950",
    border: "border-green-500",
    text: "text-green-700 dark:text-green-300",
  },
  action: { bg: "bg-blue-50 dark:bg-blue-950", border: "border-blue-500", text: "text-blue-700 dark:text-blue-300" },
  condition: {
    bg: "bg-amber-50 dark:bg-amber-950",
    border: "border-amber-500",
    text: "text-amber-700 dark:text-amber-300",
  },
  loop: {
    bg: "bg-purple-50 dark:bg-purple-950",
    border: "border-purple-500",
    text: "text-purple-700 dark:text-purple-300",
  },
  transform: { bg: "bg-pink-50 dark:bg-pink-950", border: "border-pink-500", text: "text-pink-700 dark:text-pink-300" },
  output: { bg: "bg-teal-50 dark:bg-teal-950", border: "border-teal-500", text: "text-teal-700 dark:text-teal-300" },
}

function WorkflowNodeComponent({ data, selected }: WorkflowNodeProps) {
  const Icon = data.icon ? iconMap[data.icon as keyof typeof iconMap] : Zap
  const colors = typeColors[data.type] || typeColors.action

  return (
    <div
      className={cn(
        "px-4 py-3 rounded-lg border-2 shadow-sm min-w-[160px] transition-all",
        colors.bg,
        colors.border,
        selected && "ring-2 ring-offset-2 ring-blue-500",
      )}
    >
      {/* Input handle - not shown for trigger nodes */}
      {data.type !== "trigger" && (
        <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white" />
      )}

      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-md", colors.bg, colors.text)}>
          {data.status === "running" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            Icon && <Icon className="w-4 h-4" />
          )}
        </div>
        <div className="flex-1">
          <div className={cn("font-medium text-sm", colors.text)}>{data.label}</div>
          {data.description && <div className="text-xs text-muted-foreground mt-0.5">{data.description}</div>}
        </div>
      </div>

      {/* Status indicator */}
      {data.status && data.status !== "idle" && (
        <div
          className={cn(
            "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
            data.status === "running" && "bg-blue-500",
            data.status === "success" && "bg-green-500",
            data.status === "error" && "bg-red-500",
          )}
        />
      )}

      {/* Output handle - not shown for output nodes */}
      {data.type !== "output" && (
        <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white" />
      )}

      {/* Condition nodes have two outputs */}
      {data.type === "condition" && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="false"
          className="!w-3 !h-3 !bg-red-400 !border-2 !border-white"
        />
      )}
    </div>
  )
}

export const WorkflowNode = memo(WorkflowNodeComponent)
