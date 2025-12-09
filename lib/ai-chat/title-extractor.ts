/**
 * Title Extractor
 * Extracts meaningful diagram titles from chat context
 */

import type { UIMessage } from "@ai-sdk/react"

/** Words to remove from titles (common filler words) */
const STOP_WORDS = new Set([
  "a", "an", "the", "for", "of", "to", "in", "on", "with", "and", "or",
  "create", "make", "build", "draw", "generate", "show", "me", "please",
  "can", "you", "i", "want", "need", "would", "like", "could",
  "diagram", "chart", "flowchart", "graph", // Don't duplicate "diagram" in title
])

/** Max title length */
const MAX_TITLE_LENGTH = 50

/** Diagram tool names that warrant title extraction */
const DIAGRAM_TOOLS = new Set([
  "createFlowchart",
  "createWorkflow", 
  "createMindMap",
  "createOrgChart",
  "createERDiagram",
  "createNetworkDiagram",
  "createMolecule",
  "runBackgroundDiagram",
])

/**
 * Check if a tool creates a diagram (warrants title update)
 */
export function isDiagramCreationTool(toolName: string): boolean {
  return DIAGRAM_TOOLS.has(toolName)
}

/**
 * Clean and capitalize a word
 */
function cleanWord(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

/**
 * Extract key terms from a message, removing stop words
 */
function extractKeyTerms(text: string): string[] {
  // Remove special characters, keep alphanumeric and spaces
  const cleaned = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  // Split into words and filter out stop words
  const words = cleaned.split(" ").filter(word => {
    return word.length > 2 && !STOP_WORDS.has(word)
  })

  return words
}

/**
 * Extract a meaningful title from user's message
 * 
 * Examples:
 * - "Create an EHR system diagram" → "EHR System"
 * - "Show me a flowchart for user authentication" → "User Authentication"
 * - "Draw a network diagram for AWS infrastructure" → "AWS Infrastructure"
 */
export function extractTitleFromMessage(message: string): string | null {
  if (!message || message.trim().length === 0) {
    return null
  }

  const keyTerms = extractKeyTerms(message)
  
  if (keyTerms.length === 0) {
    return null
  }

  // Take first 3-4 key terms and capitalize
  const titleWords = keyTerms
    .slice(0, 4)
    .map(cleanWord)

  let title = titleWords.join(" ")

  // Add "Diagram" suffix if not already present and title is short enough
  if (title.length < MAX_TITLE_LENGTH - 8 && !title.toLowerCase().includes("diagram")) {
    title += " Diagram"
  }

  // Truncate if still too long
  if (title.length > MAX_TITLE_LENGTH) {
    title = title.substring(0, MAX_TITLE_LENGTH - 3) + "..."
  }

  return title
}

/**
 * Extract title from the most recent user message in chat
 */
export function extractTitleFromMessages(messages: UIMessage[]): string | null {
  // Find the most recent user message
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg.role === "user") {
      // Handle both string content and multi-part content
      let textContent: string | null = null
      
      // UIMessage may have content as a separate property in some SDK versions
      const msgWithContent = msg as UIMessage & { content?: string }
      if (typeof msgWithContent.content === "string") {
        textContent = msgWithContent.content
      } else if (Array.isArray(msg.parts)) {
        // Find text part in multi-part message
        const textPart = msg.parts.find((p) => {
          const typedPart = p as { type?: string }
          return typedPart.type === "text"
        })
        if (textPart && "text" in textPart) {
          textContent = (textPart as { type: "text"; text: string }).text
        }
      }

      if (textContent) {
        const title = extractTitleFromMessage(textContent)
        if (title) return title
      }
    }
  }

  return null
}

/**
 * Generate a default title based on diagram type
 */
export function getDefaultTitleForTool(toolName: string): string {
  const toolTitles: Record<string, string> = {
    createFlowchart: "Flowchart",
    createWorkflow: "Workflow",
    createMindMap: "Mind Map",
    createOrgChart: "Org Chart",
    createERDiagram: "ER Diagram",
    createNetworkDiagram: "Network Diagram",
    createMolecule: "Molecule",
    runBackgroundDiagram: "Diagram",
  }

  return toolTitles[toolName] || "Untitled Diagram"
}

