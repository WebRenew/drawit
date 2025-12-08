/**
 * AI Diagram API - Trigger.dev Integration
 * 
 * Triggers server-side AI diagram generation using Trigger.dev
 * Returns run ID for polling status
 */

import { NextResponse } from "next/server"
import { tasks } from "@trigger.dev/sdk/v3"
import type { aiDiagramTask } from "@/src/trigger/ai-diagram"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const maxDuration = 60

interface RequestBody {
  prompt: string
  canvasInfo?: {
    centerX: number
    centerY: number
    width: number
    height: number
  }
  theme?: string
  diagramId?: string
  model?: string
}

export async function POST(req: Request) {
  try {
    // Verify authentication
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json() as RequestBody
    const { prompt, canvasInfo, theme, diagramId, model } = body

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    console.log("[ai-diagram] Triggering task for user:", user.id)

    // Trigger the background task
    const handle = await tasks.trigger<typeof aiDiagramTask>("ai-diagram-generation", {
      prompt,
      canvasInfo: canvasInfo || { centerX: 400, centerY: 300, width: 800, height: 600 },
      theme: theme || "dark",
      userId: user.id,
      diagramId,
      model: model || "anthropic/claude-opus-4.5",
    })

    console.log("[ai-diagram] Task triggered:", handle.id)

    return NextResponse.json({
      runId: handle.id,
      status: "triggered",
    })

  } catch (error) {
    console.error("[ai-diagram] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

