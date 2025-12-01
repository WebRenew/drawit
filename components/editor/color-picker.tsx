"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  GEIST_COLORS,
  getStrokeColors,
  getBackgroundColors,
  COLOR_SCALE_NAMES,
  PRESET_GRADIENTS,
} from "@/lib/constants"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronDown } from "lucide-react"
import type { StrokeGradient } from "@/lib/types"
import { isGradientStroke } from "@/lib/types"

interface ColorPickerProps {
  value: string | StrokeGradient
  onChange: (color: string | StrokeGradient) => void
  type: "stroke" | "background"
  isDark: boolean
  label?: string
}

export function ColorPicker({ value, onChange, type, isDark, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedScale, setSelectedScale] = useState<keyof typeof GEIST_COLORS | null>(null)
  const [showGradients, setShowGradients] = useState(false)

  const quickColors = type === "stroke" ? getStrokeColors(isDark) : getBackgroundColors(isDark)

  const getDisplayValue = () => {
    if (isGradientStroke(value)) {
      return `linear-gradient(${value.angle}deg, ${value.colors[0]}, ${value.colors[1]})`
    }
    return value
  }

  const handleColorSelect = (color: string) => {
    onChange(color)
  }

  const handleGradientSelect = (gradient: { colors: [string, string]; angle: number }) => {
    onChange({
      type: "linear",
      colors: gradient.colors,
      angle: gradient.angle,
    })
    setIsOpen(false)
    setShowGradients(false)
  }

  const handleScaleColorSelect = (color: string) => {
    onChange(color)
    setIsOpen(false)
    setSelectedScale(null)
  }

  const isGradientSelected = (gradient: { colors: [string, string]; angle: number }) => {
    if (!isGradientStroke(value)) return false
    return (
      value.colors[0] === gradient.colors[0] && value.colors[1] === gradient.colors[1] && value.angle === gradient.angle
    )
  }

  return (
    <div className="space-y-3">
      {label && <label className="text-xs font-medium text-muted-foreground">{label}</label>}

      {/* Current color preview */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-8 h-8 rounded border border-border"
          style={{
            background: getDisplayValue(),
          }}
        />
        <span className="text-xs text-muted-foreground truncate flex-1">
          {isGradientStroke(value) ? "Gradient" : value}
        </span>
      </div>

      {/* Quick color grid */}
      <div className="grid grid-cols-5 gap-1">
        {quickColors.map((color, idx) => (
          <button
            key={`${color}-${idx}`}
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleColorSelect(color)
            }}
            className={cn(
              "w-8 h-8 rounded hover:scale-110 transition-transform focus:outline-none ring-offset-1 cursor-pointer",
              !isGradientStroke(value) && value === color ? "ring-2 ring-primary" : "",
              color === "transparent"
                ? "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI4IiB2aWV3Qm94PSIwIDAgOCA4IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNjY2MiLz48cmVjdCB4PSI0IiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjY2NjIi8+PC9zdmc+')] border border-border"
                : "",
            )}
            style={{ backgroundColor: color === "transparent" ? undefined : color }}
            title={color}
          />
        ))}
      </div>

      {/* Expand button for full palette */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-muted-foreground hover:bg-secondary/50 rounded transition-colors cursor-pointer"
          >
            <span>More colors</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-72 p-3"
          align="start"
          onPointerDownOutside={(e) => e.stopPropagation()}
          onInteractOutside={(e) => e.stopPropagation()}
        >
          <div className="space-y-3" onMouseDown={(e) => e.stopPropagation()}>
            {type === "stroke" && (
              <div className="flex gap-1 p-1 bg-secondary/30 rounded-md">
                <button
                  type="button"
                  onClick={() => setShowGradients(false)}
                  className={cn(
                    "flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer",
                    !showGradients ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Solid
                </button>
                <button
                  type="button"
                  onClick={() => setShowGradients(true)}
                  className={cn(
                    "flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer",
                    showGradients ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Gradient
                </button>
              </div>
            )}

            {showGradients && type === "stroke" ? (
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">Select a gradient</div>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_GRADIENTS.map((gradient, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleGradientSelect(gradient)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-2 rounded hover:bg-secondary/50 transition-colors cursor-pointer",
                        isGradientSelected(gradient) ? "ring-2 ring-primary ring-offset-1" : "",
                      )}
                      title={gradient.name}
                    >
                      <div
                        className="w-full h-6 rounded border border-border/50"
                        style={{
                          background: `linear-gradient(${gradient.angle}deg, ${gradient.colors[0]}, ${gradient.colors[1]})`,
                        }}
                      />
                      <span className="text-[10px] text-muted-foreground">{gradient.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : selectedScale ? (
              <>
                {/* Back button and scale name */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedScale(null)}
                    className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    ← Back
                  </button>
                  <span className="text-xs font-medium">{GEIST_COLORS[selectedScale].name}</span>
                </div>

                {/* Full scale shades */}
                <div className="grid grid-cols-5 gap-1">
                  {Object.entries(isDark ? GEIST_COLORS[selectedScale].dark : GEIST_COLORS[selectedScale].light).map(
                    ([shade, color]) => (
                      <button
                        key={shade}
                        type="button"
                        onClick={() => handleScaleColorSelect(color)}
                        className={cn(
                          "w-10 h-10 rounded hover:scale-105 transition-transform focus:outline-none cursor-pointer relative group",
                          !isGradientStroke(value) && value === color ? "ring-2 ring-primary ring-offset-1" : "",
                        )}
                        style={{ backgroundColor: color }}
                        title={`${shade}: ${color}`}
                      >
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded text-white">
                          {shade}
                        </span>
                      </button>
                    ),
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Color scale selection */}
                <div className="text-xs font-medium text-muted-foreground mb-2">Select a color scale</div>
                <div className="grid grid-cols-5 gap-2">
                  {COLOR_SCALE_NAMES.map((scaleName) => {
                    const scale = GEIST_COLORS[scaleName]
                    const previewColor = isDark ? scale.dark[6] : scale.light[6]
                    return (
                      <button
                        key={scaleName}
                        type="button"
                        onClick={() => setSelectedScale(scaleName)}
                        className="flex flex-col items-center gap-1 p-1 rounded hover:bg-secondary/50 transition-colors cursor-pointer"
                        title={scale.name}
                      >
                        <div
                          className="w-8 h-8 rounded-full border border-border/50"
                          style={{ backgroundColor: previewColor }}
                        />
                        <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                          {scale.name}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Transparent option for backgrounds */}
                {type === "background" && (
                  <button
                    type="button"
                    onClick={() => handleScaleColorSelect("transparent")}
                    className={cn(
                      "w-full flex items-center gap-2 p-2 rounded hover:bg-secondary/50 transition-colors cursor-pointer",
                      value === "transparent" ? "bg-secondary" : "",
                    )}
                  >
                    <div className="w-6 h-6 rounded bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI4IiB2aWV3Qm94PSIwIDAgOCA4IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNjY2MiLz48cmVjdCB4PSI0IiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjY2NjIi8+PC9zdmc+')] border border-border" />
                    <span className="text-xs">Transparent</span>
                  </button>
                )}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
