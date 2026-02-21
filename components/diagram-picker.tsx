"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/components/auth-provider"
import { useCanvasStore } from "@/lib/store"
import { diagramService, type Diagram } from "@/lib/services/diagram-service"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  FolderOpen,
  Plus,
  MoreHorizontal,
  Trash2,
  Edit2,
  FileText,
  Clock,
  Cloud,
  CloudOff,
  Loader2,
  Save,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface DiagramPickerProps {
  className?: string
}

export function DiagramPicker({ className }: DiagramPickerProps) {
  const { user } = useAuth()
  const currentDiagram = useCanvasStore((state) => state.currentDiagram)
  const currentDiagramId = useCanvasStore((state) => state.currentDiagramId)
  const isSaving = useCanvasStore((state) => state.isSaving)
  const lastSaved = useCanvasStore((state) => state.lastSaved)
  const isLoading = useCanvasStore((state) => state.isLoading)
  const loadDiagram = useCanvasStore((state) => state.loadDiagram)
  const createNewDiagram = useCanvasStore((state) => state.createNewDiagram)
  const closeDiagram = useCanvasStore((state) => state.closeDiagram)
  const saveDiagram = useCanvasStore((state) => state.saveDiagram)
  const updateDiagramTitle = useCanvasStore((state) => state.updateDiagramTitle)
  const clearAll = useCanvasStore((state) => state.clearAll)

  const [isOpen, setIsOpen] = useState(false)
  const [diagrams, setDiagrams] = useState<Diagram[]>([])
  const [isLoadingList, setIsLoadingList] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Diagram | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState("")

  // Load diagrams when dialog opens
  const loadDiagrams = useCallback(async () => {
    if (!user) return
    setIsLoadingList(true)
    try {
      const data = await diagramService.list()
      setDiagrams(data)
    } catch (error) {
      console.error("Failed to load diagrams:", error)
    } finally {
      setIsLoadingList(false)
    }
  }, [user])

  useEffect(() => {
    if (isOpen && user) {
      loadDiagrams()
    }
  }, [isOpen, user, loadDiagrams])

  const handleOpenDiagram = async (diagram: Diagram) => {
    await loadDiagram(diagram.id)
    setIsOpen(false)
  }

  const handleCreateNew = async () => {
    const title = newTitle.trim() || "Untitled Diagram"
    // First clear the canvas
    clearAll()
    // Then create the new diagram
    const id = await createNewDiagram(title)
    if (id) {
      setNewTitle("")
      setIsCreating(false)
      setIsOpen(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await diagramService.delete(deleteTarget.id)
      setDiagrams((prev) => prev.filter((d) => d.id !== deleteTarget.id))
      // If we deleted the current diagram, close it
      if (currentDiagramId === deleteTarget.id) {
        closeDiagram()
      }
    } catch (error) {
      console.error("Failed to delete diagram:", error)
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleRename = async (id: string) => {
    const title = editTitle.trim()
    if (!title) return
    try {
      await diagramService.update(id, { title })
      setDiagrams((prev) =>
        prev.map((d) => (d.id === id ? { ...d, title } : d))
      )
      // Update current diagram if it's the one being renamed
      if (currentDiagramId === id) {
        await updateDiagramTitle(title)
      }
    } catch (error) {
      console.error("Failed to rename diagram:", error)
    } finally {
      setEditingId(null)
      setEditTitle("")
    }
  }

  const handleStartNewFromScratch = () => {
    closeDiagram()
    clearAll()
    setIsOpen(false)
  }

  // If not logged in, show sign in prompt
  if (!user) {
    return null
  }

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Current diagram indicator */}
        {currentDiagram ? (
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50 text-sm">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="max-w-[120px] truncate">{currentDiagram.title}</span>
            {isSaving ? (
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
            ) : lastSaved ? (
              <Cloud className="w-3 h-3 text-green-500" />
            ) : (
              <CloudOff className="w-3 h-3 text-muted-foreground" />
            )}
          </div>
        ) : null}

        {/* Save button - only show when diagram is loaded */}
        {currentDiagramId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={saveDiagram}
            disabled={isSaving}
            title={lastSaved ? `Last saved ${formatDistanceToNow(lastSaved)} ago` : "Save diagram"}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
          </Button>
        )}

        {/* Open dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Diagrams</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>My Diagrams</DialogTitle>
              <DialogDescription>
                Open an existing diagram or create a new one
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* New diagram section */}
              {isCreating ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Diagram title..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateNew()
                      if (e.key === "Escape") setIsCreating(false)
                    }}
                    autoFocus
                  />
                  <Button onClick={handleCreateNew} disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                  </Button>
                  <Button variant="ghost" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={() => setIsCreating(true)}
                    className="flex-1 gap-2"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4" />
                    New Diagram
                  </Button>
                  {currentDiagramId && (
                    <Button
                      onClick={handleStartNewFromScratch}
                      variant="ghost"
                      title="Start fresh without saving"
                    >
                      Start Fresh
                    </Button>
                  )}
                </div>
              )}

              {/* Diagrams list */}
              <ScrollArea className="h-[300px] pr-4">
                {isLoadingList ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : diagrams.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No diagrams yet</p>
                    <p className="text-sm">Create your first diagram above</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {diagrams.map((diagram) => (
                      <div
                        key={diagram.id}
                        className={`group flex items-center gap-2 p-3 rounded-lg border transition-colors hover:bg-muted/50 ${
                          currentDiagramId === diagram.id
                            ? "border-primary bg-primary/5"
                            : "border-transparent"
                        }`}
                      >
                        {editingId === diagram.id ? (
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRename(diagram.id)
                              if (e.key === "Escape") setEditingId(null)
                            }}
                            onBlur={() => handleRename(diagram.id)}
                            autoFocus
                            className="flex-1"
                          />
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenDiagram(diagram)}
                              className="flex-1 text-left"
                            >
                              <div className="font-medium truncate">
                                {diagram.title}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(diagram.updated_at), {
                                  addSuffix: true,
                                })}
                              </div>
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingId(diagram.id)
                                    setEditTitle(diagram.title)
                                  }}
                                >
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteTarget(diagram)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete diagram?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
