"use client"

import { ChevronDown } from "lucide-react"
import type { AIModel } from "@/lib/ai-chat/types"

interface ModelSelectorProps {
  selectedModel: string
  onModelChange: (model: string) => void
  models: AIModel[]
  showMenu: boolean
  onToggleMenu: () => void
}

export function ModelSelector({ selectedModel, onModelChange, models, showMenu, onToggleMenu }: ModelSelectorProps) {
  const modelList = models || []
  const selectedModelInfo = modelList.find((m) => m.id === selectedModel)
  const selectedModelName = selectedModelInfo?.name || "Select Model"

  return (
    <div className="relative flex items-center justify-between">
      <span className="text-xs text-muted-foreground">Model:</span>
      <button
        onClick={onToggleMenu}
        className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
      >
        <span>{selectedModelName}</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {showMenu && (
        <div className="absolute top-full right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg min-w-48 overflow-hidden z-10">
          {modelList.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                onModelChange(model.id)
                onToggleMenu()
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${
                selectedModel === model.id ? "bg-accent/50 font-medium" : ""
              }`}
            >
              {model.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
