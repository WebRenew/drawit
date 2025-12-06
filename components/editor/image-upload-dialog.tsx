"use client"

import type React from "react"

import { useState, useRef } from "react"
import { X, Upload, LinkIcon } from "lucide-react"
import { compressImage } from "@/lib/canvas-helpers"

interface ImageUploadDialogProps {
  onImageSelect?: (imageUrl: string) => void
  onSelect?: (imageUrl: string) => void
  onClose: () => void
  position?: { x: number; y: number }
}

export function ImageUploadDialog({ onImageSelect, onSelect, onClose, position }: ImageUploadDialogProps) {
  // Support both onImageSelect and onSelect for backwards compatibility
  const handleImageSelect = (imageUrl: string) => {
    if (onImageSelect) onImageSelect(imageUrl)
    if (onSelect) onSelect(imageUrl)
  }
  const [isDragging, setIsDragging] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload")
  const fileInputRef = useRef<HTMLInputElement>(null)


  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return

    try {
      const imageUrl = await compressImage(file)
      handleImageSelect(imageUrl)
    } catch (error) {
      console.error("Error processing image:", error)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      handleImageSelect(urlInput.trim())
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-card rounded-lg shadow-lg w-full max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold mb-4">Add Image</h2>

        <div className="flex gap-2 mb-4 border-b border-border">
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-4 py-2 transition-colors ${activeTab === "upload"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Upload
          </button>
          <button
            onClick={() => setActiveTab("url")}
            className={`px-4 py-2 transition-colors ${activeTab === "url"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            URL
          </button>
        </div>

        {activeTab === "upload" ? (
          <div>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">Drag and drop an image here</p>
              <p className="text-xs text-muted-foreground mb-4">or</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Choose File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileInputChange}
              />
            </div>
          </div>
        ) : (
          <div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUrlSubmit()
                    }
                  }}
                  placeholder="Paste image URL..."
                  className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                onClick={handleUrlSubmit}
                disabled={!urlInput.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
