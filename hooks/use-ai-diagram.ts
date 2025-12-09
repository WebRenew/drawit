/**
 * useAIDiagram Hook
 * 
 * Custom hook for triggering AI diagram generation via Trigger.dev
 * and polling for results.
 */

import { useState, useCallback, useRef } from "react"

interface CanvasInfo {
  centerX: number
  centerY: number
  width: number
  height: number
}

interface DiagramNode {
  id: string
  type: string
  label: string
  x?: number
  y?: number
  width?: number
  height?: number
  strokeColor?: string
  backgroundColor?: string
}

interface DiagramConnection {
  from: string
  to: string
  label?: string
}

interface DiagramResult {
  elements: DiagramNode[]
  connections: DiagramConnection[]
  summary: string
}

type TaskStatus = "idle" | "triggering" | "running" | "completed" | "failed"

interface UseAIDiagramReturn {
  status: TaskStatus
  result: DiagramResult | null
  error: string | null
  progress: string
  trigger: (params: {
    prompt: string
    canvasInfo?: CanvasInfo
    theme?: string
    diagramId?: string
    model?: string
  }) => Promise<DiagramResult | null>
  cancel: () => void
}

const POLL_INTERVAL = 1000 // 1 second
const MAX_POLL_ATTEMPTS = 300 // 5 minutes max

export function useAIDiagram(): UseAIDiagramReturn {
  const [status, setStatus] = useState<TaskStatus>("idle")
  const [result, setResult] = useState<DiagramResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<string>("")
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const pollCountRef = useRef(0)

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setStatus("idle")
    setProgress("")
  }, [])

  const pollForResult = useCallback(async (runId: string): Promise<DiagramResult | null> => {
    pollCountRef.current = 0

    while (pollCountRef.current < MAX_POLL_ATTEMPTS) {
      if (abortControllerRef.current?.signal.aborted) {
        return null
      }

      try {
        const response = await fetch(`/api/ai-diagram/${runId}`, {
          signal: abortControllerRef.current?.signal,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to get run status")
        }

        const data = await response.json()

        switch (data.status) {
          case "COMPLETED":
            if (data.output) {
              return data.output as DiagramResult
            }
            throw new Error("Task completed but no output")

          case "FAILED":
          case "CRASHED":
          case "SYSTEM_FAILURE":
          case "CANCELED":
            throw new Error(data.error || `Task ${data.status.toLowerCase()}`)

          case "EXECUTING":
            setProgress("Generating diagram...")
            break

          case "QUEUED":
          case "PENDING":
            setProgress("Waiting in queue...")
            break

          default:
            setProgress(`Status: ${data.status}`)
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL))
        pollCountRef.current++

      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return null
        }
        throw err
      }
    }

    throw new Error("Timeout waiting for task to complete")
  }, [])

  const trigger = useCallback(async (params: {
    prompt: string
    canvasInfo?: CanvasInfo
    theme?: string
    diagramId?: string
    model?: string
  }): Promise<DiagramResult | null> => {
    // Cancel any existing request
    cancel()
    
    // Create new abort controller
    abortControllerRef.current = new AbortController()

    setStatus("triggering")
    setResult(null)
    setError(null)
    setProgress("Starting AI generation...")

    try {
      // Trigger the task
      const triggerResponse = await fetch("/api/ai-diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
        signal: abortControllerRef.current.signal,
      })

      if (!triggerResponse.ok) {
        const errorData = await triggerResponse.json()
        throw new Error(errorData.error || "Failed to trigger task")
      }

      const { runId } = await triggerResponse.json()
      
      setStatus("running")
      setProgress("AI is generating your diagram...")

      // Poll for result
      const diagramResult = await pollForResult(runId)

      if (diagramResult) {
        setResult(diagramResult)
        setStatus("completed")
        setProgress("")
        return diagramResult
      }

      return null

    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setStatus("idle")
        return null
      }

      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(errorMessage)
      setStatus("failed")
      setProgress("")
      console.error("[useAIDiagram] Error:", errorMessage)
      return null
    }
  }, [cancel, pollForResult])

  return {
    status,
    result,
    error,
    progress,
    trigger,
    cancel,
  }
}



