import type { ToolHandlerContext } from "../types"
import { generateId } from "../canvas-helpers"
import type { CanvasElement } from "@/lib/types"

export interface PlaceImageInput {
  imageIndex?: number
  x: number
  y: number
  width?: number
  height?: number
  shapeId?: string
}

export interface PlaceImageOutput {
  success: boolean
  error?: string
  elementId?: string
  shapeId?: string | null
  position?: { x: number; y: number }
  size?: { width: number; height: number }
  imageIndex?: number
  message?: string
}

export function handlePlaceImage(args: PlaceImageInput, ctx: ToolHandlerContext): PlaceImageOutput {
  const { imageIndex = 0, x, y, width = 200, height = 200, shapeId } = args

  if (!ctx.uploadedImagesRef) {
    return {
      success: false,
      error: "No images have been uploaded",
    }
  }

  const imageUrl = ctx.uploadedImagesRef.current[imageIndex]
  if (!imageUrl) {
    return {
      success: false,
      error: `No image found at index ${imageIndex}. Available images: ${ctx.uploadedImagesRef.current.length}`,
    }
  }

  const id = generateId()
  const newElement: Omit<CanvasElement, "id"> = {
    type: "image",
    x,
    y,
    width,
    height,
    imageUrl,
    strokeColor: "#000000",
    backgroundColor: "transparent",
    strokeWidth: 0,
    strokeStyle: "solid",
    roughness: 0,
    opacity: 1,
    angle: 0,
    seed: Math.floor(Math.random() * 100000),
    isLocked: false,
  } as any

  ctx.addElementMutation(newElement)

  if (shapeId) {
    ctx.shapeRegistryRef.current.set(shapeId, id)
    ctx.shapeDataRef.current.set(shapeId, { x, y, width, height, type: "image" })
  }

  return {
    success: true,
    elementId: id,
    shapeId: shapeId || null,
    position: { x, y },
    size: { width, height },
    imageIndex,
    message: `Image placed at (${x}, ${y}) with size ${width}x${height}`,
  }
}
