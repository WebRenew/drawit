"use client"

import { useEffect, useState } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "./theme-provider"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-[96px] h-8 rounded-lg border border-border bg-background/50" />
  }

  return (
    <div className="flex items-center p-1 rounded-full border border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <button
        className={cn(
          "p-2 rounded-full transition-all hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          theme === "system" && "bg-muted text-foreground shadow-sm",
        )}
        onClick={() => setTheme("system")}
        onMouseDown={(e) => e.stopPropagation()}
        title="System theme"
        aria-label="System theme"
        type="button"
      >
        <Monitor className="h-4 w-4" />
      </button>
      <button
        className={cn(
          "p-2 rounded-full transition-all hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          theme === "light" && "bg-muted text-foreground shadow-sm",
        )}
        onClick={() => setTheme("light")}
        onMouseDown={(e) => e.stopPropagation()}
        title="Light theme"
        aria-label="Light theme"
        type="button"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        className={cn(
          "p-2 rounded-full transition-all hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          theme === "dark" && "bg-muted text-foreground shadow-sm",
        )}
        onClick={() => setTheme("dark")}
        onMouseDown={(e) => e.stopPropagation()}
        title="Dark theme"
        aria-label="Dark theme"
        type="button"
      >
        <Moon className="h-4 w-4" />
      </button>
    </div>
  )
}
