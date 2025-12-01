import { put, list, del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const CHAT_SESSION_COOKIE = "chat-session-id"
const CHAT_HISTORY_PREFIX = "chat-history/"

// Check if Blob storage is configured
function isBlobConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}

// Generate a unique session ID
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

// GET - Load chat history for current session
export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get(CHAT_SESSION_COOKIE)?.value
    console.log("[chat-history] GET - sessionId from cookie:", sessionId ?? "none")

    if (!sessionId) {
      // No session yet, return empty history with flag for client to use localStorage
      console.log("[chat-history] No session cookie found")
      return NextResponse.json({ 
        messages: [], 
        sessionId: null,
        useLocalStorage: !isBlobConfigured()
      })
    }

    // If Blob is not configured, tell client to use localStorage
    if (!isBlobConfigured()) {
      return NextResponse.json({ 
        messages: [], 
        sessionId,
        useLocalStorage: true 
      })
    }

    // Try to load chat history from Blob
    const prefix = `${CHAT_HISTORY_PREFIX}${sessionId}`
    console.log("[chat-history] Looking for blobs with prefix:", prefix)
    const { blobs } = await list({ prefix })

    if (blobs.length === 0) {
      console.log("[chat-history] No blobs found for session:", sessionId)
      return NextResponse.json({ messages: [], sessionId, useLocalStorage: false })
    }

    // Get the most recent chat history file
    const latestBlob = blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0]
    console.log("[chat-history] Found blob:", latestBlob.pathname, "uploaded:", latestBlob.uploadedAt)

    // Fetch the content
    const response = await fetch(latestBlob.url)
    if (!response.ok) {
      console.error("[chat-history] Failed to fetch blob content:", response.status)
      return NextResponse.json({ messages: [], sessionId, useLocalStorage: false })
    }
    const data = await response.json()

    return NextResponse.json({
      messages: data.messages || [],
      sessionId,
      useLocalStorage: false,
    })
  } catch (error) {
    console.error("Error loading chat history:", error)
    // On error, tell client to use localStorage as fallback
    return NextResponse.json({ messages: [], sessionId: null, useLocalStorage: true })
  }
}

// POST - Save chat history for current session
export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()
    const cookieStore = await cookies()
    let sessionId = cookieStore.get(CHAT_SESSION_COOKIE)?.value

    // Create new session if needed
    if (!sessionId) {
      sessionId = generateSessionId()
    }

    // If Blob is not configured, just acknowledge and tell client to use localStorage
    if (!isBlobConfigured()) {
      const response = NextResponse.json({
        success: true,
        sessionId,
        useLocalStorage: true,
      })

      // Still set the session cookie for consistency
      response.cookies.set(CHAT_SESSION_COOKIE, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      })

      return response
    }

    // Save chat history to Blob
    // Use addRandomSuffix: false to ensure consistent paths for list() to work
    const filename = `${CHAT_HISTORY_PREFIX}${sessionId}/history.json`
    console.log("[chat-history] Saving to blob:", filename, "messages:", messages.length)
    
    const blob = await put(
      filename,
      JSON.stringify({
        messages,
        updatedAt: new Date().toISOString(),
      }),
      {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
      },
    )

    console.log("[chat-history] Saved blob at:", blob.url)

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      sessionId,
      url: blob.url,
      useLocalStorage: false,
    })

    // Set cookie if new session
    response.cookies.set(CHAT_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Error saving chat history:", error)
    return NextResponse.json({ error: "Failed to save chat history", useLocalStorage: true }, { status: 500 })
  }
}

// DELETE - Clear chat history and start new session
export async function DELETE() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get(CHAT_SESSION_COOKIE)?.value

    // Only try to delete blobs if Blob is configured and we have a session
    if (sessionId && isBlobConfigured()) {
      const { blobs } = await list({ prefix: `${CHAT_HISTORY_PREFIX}${sessionId}` })
      await Promise.all(blobs.map((blob) => del(blob.url)))
    }

    // Generate new session
    const newSessionId = generateSessionId()

    const response = NextResponse.json({
      success: true,
      sessionId: newSessionId,
      useLocalStorage: !isBlobConfigured(),
    })

    // Set new cookie
    response.cookies.set(CHAT_SESSION_COOKIE, newSessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Error clearing chat history:", error)
    return NextResponse.json({ error: "Failed to clear chat history", useLocalStorage: true }, { status: 500 })
  }
}
