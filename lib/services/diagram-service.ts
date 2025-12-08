import { createClient } from "@/lib/supabase/client"
import type { CanvasElement, SmartConnection } from "@/lib/types"

export interface Diagram {
  id: string
  user_id: string
  title: string
  elements: CanvasElement[]
  connections: SmartConnection[]
  viewport: { x: number; y: number; zoom: number }
  theme: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export type DiagramCreate = Pick<Diagram, "title"> & Partial<Omit<Diagram, "id" | "user_id" | "created_at" | "updated_at">>
export type DiagramUpdate = Partial<Omit<Diagram, "id" | "user_id" | "created_at">>

class DiagramService {
  private getClient() {
    return createClient()
  }

  async list(): Promise<Diagram[]> {
    const supabase = this.getClient()
    const { data, error } = await supabase
      .from("diagrams")
      .select("*")
      .order("updated_at", { ascending: false })

    if (error) throw error
    return data ?? []
  }

  async get(id: string): Promise<Diagram | null> {
    const supabase = this.getClient()
    const { data, error } = await supabase
      .from("diagrams")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null // Not found
      throw error
    }
    return data
  }

  async create(diagram: DiagramCreate): Promise<Diagram> {
    const supabase = this.getClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error("Not authenticated")

    const { data, error } = await supabase
      .from("diagrams")
      .insert({
        user_id: user.id,
        title: diagram.title || "Untitled Diagram",
        elements: diagram.elements || [],
        connections: diagram.connections || [],
        viewport: diagram.viewport || { x: 0, y: 0, zoom: 1 },
        theme: diagram.theme || "dark",
        is_public: diagram.is_public || false,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async update(id: string, updates: DiagramUpdate): Promise<Diagram> {
    const supabase = this.getClient()
    const { data, error } = await supabase
      .from("diagrams")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async delete(id: string): Promise<void> {
    const supabase = this.getClient()
    const { error } = await supabase.from("diagrams").delete().eq("id", id)

    if (error) throw error
  }

  /**
   * Auto-save elements and connections (called with debounce from store)
   */
  async autoSave(
    id: string,
    elements: CanvasElement[],
    connections: SmartConnection[]
  ): Promise<void> {
    await this.update(id, { elements, connections })
  }
}

// Singleton instance
export const diagramService = new DiagramService()

