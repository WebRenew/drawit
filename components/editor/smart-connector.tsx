"use client"

import { useMemo } from "react"
import type { CanvasElement, SmartConnection, ArrowHeadType } from "@/lib/types"
import { generateConnectorPath, getArrowHeadPoints } from "@/lib/connector-utils"
import { getSolidStrokeColor } from "@/lib/canvas-helpers"

interface SmartConnectorProps {
  elements: CanvasElement[]
  connection: SmartConnection
  isSelected?: boolean
  isDarkMode?: boolean
  onClick?: (connectionId: string) => void
}

export function SmartConnector({
  elements,
  connection,
  isSelected = false,
  isDarkMode = false,
  onClick,
}: SmartConnectorProps) {
  const pathData = useMemo(() => {
    return generateConnectorPath(elements, connection)
  }, [elements, connection])

  if (!pathData) return null

  const strokeColor = connection.strokeColor ? getSolidStrokeColor(connection.strokeColor) : (isDarkMode ? "#ffffff" : "#6366f1")
  const strokeWidth = connection.strokeWidth || 2
  const strokeDasharray =
    connection.strokeStyle === "dashed" ? "8 4" : connection.strokeStyle === "dotted" ? "2 4" : undefined

  const renderArrowHead = (x: number, y: number, angle: number, type: ArrowHeadType | undefined) => {
    if (!type || type === "none") return null

    const size = strokeWidth * 3

    if (type === "arrow") {
      return <polygon points={getArrowHeadPoints(x, y, angle, size)} fill={strokeColor} />
    }

    if (type === "dot") {
      return <circle cx={x} cy={y} r={size} fill={strokeColor} />
    }

    if (type === "bar") {
      const barLength = size * 2
      const cos = Math.cos(angle + Math.PI / 2)
      const sin = Math.sin(angle + Math.PI / 2)
      const x1 = x + cos * barLength
      const y1 = y + sin * barLength
      const x2 = x - cos * barLength
      const y2 = y - sin * barLength

      return (
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={strokeColor}
          strokeWidth={strokeWidth * 1.5}
          strokeLinecap="round"
        />
      )
    }

    return null
  }

  return (
    <g
      className={`smart-connector ${isSelected ? "selected" : ""} cursor-pointer`}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(connection.id)
      }}
      shapeRendering="geometricPrecision"
    >
      {/* Invisible wider path for easier selection */}
      <path
        d={pathData.path}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(strokeWidth * 4, 12)}
        className="pointer-events-auto"
      />

      {/* Visible path */}
      <path
        d={pathData.path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={isSelected ? strokeWidth + 1 : strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={connection.animated ? "animate-dash" : ""}
        vectorEffect="non-scaling-stroke"
      />

      {/* Arrow heads */}
      {renderArrowHead(pathData.targetX, pathData.targetY, pathData.endAngle, connection.arrowHeadEnd || "arrow")}
      {connection.arrowHeadStart &&
        connection.arrowHeadStart !== "none" &&
        renderArrowHead(pathData.sourceX, pathData.sourceY, pathData.startAngle, connection.arrowHeadStart)}

      {/* Label */}
      {connection.label && (
        <g transform={`translate(${pathData.labelX}, ${pathData.labelY})`}>
          <rect
            x={-connection.label.length * 3.5 - 4}
            y={-10}
            width={connection.label.length * 7 + 8}
            height={20}
            rx={6}
            ry={6}
            fill={isDarkMode ? "rgba(30, 30, 30, 0.9)" : "rgba(255, 255, 255, 0.9)"}
            stroke={isDarkMode ? "#444" : "#ddd"}
            strokeWidth={1}
          />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={11}
            fill={isDarkMode ? "#fff" : "#333"}
            className="select-none"
          >
            {connection.label}
          </text>
        </g>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <>
          <circle
            cx={pathData.sourceX}
            cy={pathData.sourceY}
            r={6}
            fill={isDarkMode ? "#6366f1" : "#4f46e5"}
            stroke="white"
            strokeWidth={2}
          />
          <circle
            cx={pathData.targetX}
            cy={pathData.targetY}
            r={6}
            fill={isDarkMode ? "#6366f1" : "#4f46e5"}
            stroke="white"
            strokeWidth={2}
          />
        </>
      )}
    </g>
  )
}

interface SmartConnectorsLayerProps {
  elements: CanvasElement[]
  connections: SmartConnection[]
  selectedConnectionId?: string | null
  isDarkMode?: boolean
  onConnectionClick?: (connectionId: string | null) => void
}

export function SmartConnectorsLayer({
  elements,
  connections,
  selectedConnectionId,
  isDarkMode = false,
  onConnectionClick,
}: SmartConnectorsLayerProps) {
  return (
    <g className="smart-connectors-layer">
      {connections.map((conn) => (
        <SmartConnector
          key={conn.id}
          elements={elements}
          connection={conn}
          isSelected={conn.id === selectedConnectionId}
          isDarkMode={isDarkMode}
          onClick={onConnectionClick}
        />
      ))}
    </g>
  )
}
