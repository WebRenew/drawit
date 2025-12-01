import { put, list, del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const CHAT_SESSION_COOKIE = "chat-session-id"
const CHAT_HISTORY_PREFIX = "chat-history/"

// Generate a unique session ID
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

// GET - Load chat history for current session
export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get(CHAT_SESSION_COOKIE)?.value

    if (!sessionId) {
      // No session yet, return empty history
      return NextResponse.json({ messages: [], sessionId: null })
    }

    // Try to load chat history from Blob
    const { blobs } = await list({ prefix: `${CHAT_HISTORY_PREFIX}${sessionId}` })

    if (blobs.length === 0) {
      return NextResponse.json({ messages: [], sessionId })
    }

    // Get the most recent chat history file
    const latestBlob = blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0]

    // Fetch the content
    const response = await fetch(latestBlob.url)
    const data = await response.json()

    return NextResponse.json({
      messages: data.messages || [],
      sessionId,
    })
  } catch (error) {
    console.error("Error loading chat history:", error)
    return NextResponse.json({ messages: [], sessionId: null })
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

    // Save chat history to Blob
    const filename = `${CHAT_HISTORY_PREFIX}${sessionId}/history.json`
    const blob = await put(
      filename,
      JSON.stringify({
        messages,
        updatedAt: new Date().toISOString(),
      }),
      {
        access: "public",
        contentType: "application/json",
      },
    )

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      sessionId,
      url: blob.url,
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
    return NextResponse.json({ error: "Failed to save chat history" }, { status: 500 })
  }
}

// DELETE - Clear chat history and start new session
export async function DELETE() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get(CHAT_SESSION_COOKIE)?.value

    if (sessionId) {
      // Delete all blobs for this session
      const { blobs } = await list({ prefix: `${CHAT_HISTORY_PREFIX}${sessionId}` })
      await Promise.all(blobs.map((blob) => del(blob.url)))
    }

    // Generate new session
    const newSessionId = generateSessionId()

    const response = NextResponse.json({
      success: true,
      sessionId: newSessionId,
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
    return NextResponse.json({ error: "Failed to clear chat history" }, { status: 500 })
  }
}
