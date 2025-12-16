# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install    # Install dependencies
pnpm dev        # Run development server (localhost:3000)
pnpm build      # Build for production
pnpm lint       # Run ESLint
```

## Architecture

Drawit is an AI-powered collaborative whiteboard built with Next.js 16 (App Router), React 19, Vercel AI SDK v5, and Supabase.

### Core Data Flow

1. **Canvas State** - Zustand store (`lib/store.ts`) manages `elements` (shapes) and `connections` (smart connectors)
2. **Authentication** - Supabase Auth with Google OAuth (`components/auth-provider.tsx`)
3. **Persistence** - Supabase database for diagrams and chat history (`lib/services/`)
4. **AI Integration** - Dual-mode AI execution:
   - **Streaming Chat** - `/api/ai-chat` with client-side tool execution
   - **Background Jobs** - Trigger.dev tasks for complex diagrams (`src/trigger/`)

### Key Types (`lib/types.ts`)

- `CanvasElement` - All drawable shapes (rectangle, ellipse, diamond, arrow, line, freedraw, text, image)
- `SmartConnection` - Connectors between elements with routing types (bezier, smoothstep, straight)
- `AppState` - Current tool, selection, and default styling properties

### Canvas Architecture (IMPORTANT)

Drawit uses a **custom SVG canvas**, NOT React Flow for canvas management.

**What React Flow IS used for:**
- Connection path rendering only (`components/editor/smart-connector-layer.tsx`)
- Invisible nodes are created at element positions
- React Flow's edge algorithms (bezier, smoothstep) calculate connection paths
- The paths are rendered, but React Flow does NOT manage the actual canvas elements

**What React Flow IS NOT used for:**
- Node/element creation or management
- Canvas state (managed by Zustand)
- AI diagram generation (all tools create SVG `CanvasElement` objects)

**The Workflow Page (`/app/workflow`):**
- Contains a React Flow-based workflow canvas (currently disabled)
- This is a separate experiment, NOT integrated with the AI system
- The `createWorkflow` AI tool creates SVG shapes on the main canvas, not React Flow nodes
- See documentation in `app/workflow/page.tsx` for details

**Key Files:**
- `components/editor/canvas.tsx` - Main 2330-line custom SVG canvas (where AI creates diagrams)
- `components/editor/smart-connector-layer.tsx` - React Flow for connection paths only
- `lib/ai-chat/tool-handlers/` - All handlers create `CanvasElement` objects (SVG)
- `app/workflow/page.tsx` - Disabled React Flow canvas (different system)

### AI Tool System

#### Tool Definitions (`lib/tools/`)
Centralized tool definitions using Zod schemas:
- `canvas-tools.ts` - getCanvasState, clearCanvas, analyzeDiagram, beautifyDiagram
- `diagram-tools.ts` - createFlowchart, createWorkflow, createMindMap, createOrgChart, createERDiagram, createNetworkDiagram, createMolecule
- `shape-tools.ts` - createShape, updateShape, getShapeInfo, placeImage, previewDiagram
- `style-tools.ts` - updateStyles
- `schemas.ts` - Shared Zod schemas for all tools

#### Tool Handlers (`lib/ai-chat/tool-handlers/`)
Client-side execution functions that mutate the Zustand store.

#### System Prompt Architecture (`app/api/ai-chat/route.ts`)
The `getSystemPrompt()` function uses a **layered contract architecture**:

| Module | Purpose |
|--------|---------|
| ROLE & MISSION | Agent identity and primary objective |
| CANVAS STATE | Dynamic context injection (center, dimensions, theme) |
| TOOL REGISTRY | Decision matrix with "Use When" guidance for all 15 tools |
| TOOL GOVERNANCE | Mandatory workflow, color rules, connection rules, multi-step limits |
| NODE TYPES REFERENCE | Quick lookup for valid enum values |
| COMMUNICATION CONTRACT | Response structure + tone guidelines |
| IMAGE RECREATION | Step-by-step protocol for recreating uploaded images |
| COMMON PATTERNS | User intent → tool sequence mapping |
| HARD CONSTRAINTS | Inviolable rules (always connect, always check state, etc.) |

### Server-Side Execution (Trigger.dev)

For complex diagrams that need longer execution time:
- `src/trigger/ai-diagram.ts` - Background task with server-side tools
- `app/api/ai-diagram/route.ts` - Trigger endpoint
- `hooks/use-ai-diagram.ts` - React hook for triggering/polling
- `components/ai-quick-create.tsx` - Quick Create UI (wand button)

### Component Structure

- `components/editor/canvas.tsx` - Main SVG-based canvas with shape rendering, selection, pan/zoom
- `components/ai-chat-panel.tsx` - Chat interface using `@ai-sdk/react` useChat hook
- `components/ai-quick-create.tsx` - Quick Create panel for Trigger.dev background jobs
- `components/editor/smart-connector-layer.tsx` - Connection rendering with automatic routing
- `components/auth-provider.tsx` - Authentication context provider
- `components/diagram-picker.tsx` - Diagram selection and management
- `components/chat-history-sheet.tsx` - Chat session history
- `components/ui/` - shadcn/ui components

### Services (`lib/services/`)

- `diagram-service.ts` - CRUD operations for diagrams in Supabase
- `chat-service.ts` - Chat session and message management in Supabase
- `image-service.ts` - Upload images to Supabase Storage, returns public URLs for AI

### Scheduled Tasks (Trigger.dev)

- `src/trigger/cleanup-temp-images.ts` - Daily cleanup of expired temp images (runs at 3 AM UTC)

### Environment Variables

```bash
# Required
AI_GATEWAY_API_KEY=           # Vercel AI Gateway API key
NEXT_PUBLIC_SUPABASE_URL=     # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=    # Supabase service role key (server-side)

# Optional
TRIGGER_SECRET_KEY=           # Trigger.dev secret for background jobs
```

### Path Aliases

`@/*` maps to project root (configured in `tsconfig.json`)

### Database Schema

See `supabase/migrations/` for full schema:

**001_initial_schema.sql:**
- `profiles` - User profiles (extends Supabase auth)
- `diagrams` - User diagrams with elements and connections
- `chat_sessions` - AI chat sessions
- `chat_messages` - Individual chat messages

**002_temp_images_storage.sql:**
- `temp-images` Storage bucket - For AI chat image uploads
- `temp_images` table - Tracks uploads with 24h expiry for cleanup
