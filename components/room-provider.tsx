"use client"

import type { ReactNode } from "react"

export function DrawingRoomProvider({ children }: { children: ReactNode }) {
  // No longer need Liveblocks - just render children
  // State is now managed by Zustand store in lib/store.ts
  return <>{children}</>
}
