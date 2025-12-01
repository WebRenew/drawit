"use client"

import { Icons } from "./icons"
import { cn } from "@/lib/utils"
import type { CanvasElement } from "@/lib/types"

interface ActionsMenuProps {
  selectedElements: CanvasElement[]
  onAction: (
    action: "delete" | "duplicate" | "sendToBack" | "bringToFront" | "group" | "ungroup" | "lock" | "unlock",
  ) => void
}

export function ActionsMenu({ selectedElements, onAction }: ActionsMenuProps) {
  if (selectedElements.length === 0) return null

  const hasMultipleSelected = selectedElements.length > 1
  const selectedGroupIds = [...new Set(selectedElements.map((el) => el.groupId).filter(Boolean))]
  const allInSameGroup = selectedGroupIds.length === 1 && selectedElements.length > 1
  const allLocked = selectedElements.every((el) => el.isLocked)

  return (
    <div
      className="absolute top-16 right-4 z-50 flex flex-col gap-2 p-2 bg-card rounded-lg shadow-sm border border-border/50"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex gap-2">
        <button
          onClick={() => onAction(allLocked ? "unlock" : "lock")}
          className={cn(
            "w-9 h-9 flex items-center justify-center rounded transition-colors",
            allLocked
              ? "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900 border border-amber-100 dark:border-amber-900"
              : "bg-secondary text-foreground hover:bg-secondary/80",
          )}
          title={allLocked ? "Unlock" : "Lock"}
        >
          {allLocked ? <Icons.Lock className="w-4 h-4" /> : <Icons.Unlock className="w-4 h-4" />}
        </button>

        <button
          onClick={() => onAction("delete")}
          className="w-9 h-9 flex items-center justify-center rounded bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 transition-colors border border-red-100 dark:border-red-900"
          title="Delete"
        >
          <Icons.Trash className="w-4 h-4" />
        </button>

        <button
          onClick={() => onAction("duplicate")}
          className="w-9 h-9 flex items-center justify-center rounded bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
          title="Duplicate"
        >
          <Icons.Copy className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onAction("sendToBack")}
          className="flex-1 h-9 flex items-center justify-center rounded bg-secondary text-foreground hover:bg-secondary/80 transition-colors text-xs px-2"
          title="Send to Back"
        >
          To Back
        </button>
        <button
          onClick={() => onAction("bringToFront")}
          className="flex-1 h-9 flex items-center justify-center rounded bg-secondary text-foreground hover:bg-secondary/80 transition-colors text-xs px-2"
          title="Bring to Front"
        >
          To Front
        </button>
      </div>

      {hasMultipleSelected && (
        <div className="flex gap-2">
          <button
            onClick={() => onAction("group")}
            className="flex-1 h-9 flex items-center justify-center rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-xs"
            title="Group"
          >
            Group
          </button>
          {allInSameGroup && (
            <button
              onClick={() => onAction("ungroup")}
              className="flex-1 h-9 flex items-center justify-center rounded bg-secondary text-foreground hover:bg-secondary/80 transition-colors text-xs"
              title="Ungroup"
            >
              Ungroup
            </button>
          )}
        </div>
      )}
    </div>
  )
}
