"use client"

import type React from "react"
import { useState } from "react"
import { ExternalLink, ChevronDown, ChevronUp, RefreshCw, Tag, Gamepad2 } from "lucide-react"
import {
  type AggregatedPriceData,
  type PriceSource,
  getSourceDisplayName,
  getSourceColor,
  getGameDisplayName,
} from "../utils/price-sources"
import { formatUsd, formatMnt, convertUsdToMnt } from "../utils/currency"

interface PriceDisplayProps {
  priceData: AggregatedPriceData | null
  isLoading: boolean
  onRefresh?: () => void
  showDetailed?: boolean
  className?: string
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  priceData,
  isLoading,
  onRefresh,
  showDetailed = false,
  className = "",
}) => {
  const [expanded, setExpanded] = useState(showDetailed)

  if (isLoading) {
    return (
      <div className={`flex items-center gap-1 text-gray-400 text-xs ${className}`}>
        <RefreshCw className="w-3 h-3 animate-spin" />
        <span>Loading prices...</span>
      </div>
    )
  }

  if (!priceData || (!priceData.lowestPrice && !priceData.steamPrice)) {
    return (
      <div className={`flex items-center gap-1 text-gray-500 text-xs ${className}`}>
        <Tag className="w-3 h-3" />
        <span>No price data</span>
      </div>
    )
  }

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)

    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const getBestSourceStyle = (source: PriceSource | null) => {
    if (!source) return {}
    return {
      backgroundColor: `${getSourceColor(source)}20`, // 20% opacity
      color: getSourceColor(source),
      borderColor: `${getSourceColor(source)}40`, // 40% opacity
    }
  }

  return (
    <div className={className}>
      {/* Main price display */}
      <div className="flex items-center gap-2">
        <div
          className="text-xs font-medium flex items-center gap-1 px-2 py-0.5 rounded border"
          style={getBestSourceStyle(priceData.lowestSource)}
        >
          <Tag className="w-3 h-3" />
          {priceData.lowestPrice ? (
            <>
              <span>{formatUsd(priceData.lowestPrice)}</span>
              <span className="text-gray-400">({formatMnt(convertUsdToMnt(priceData.lowestPrice))})</span>
            </>
          ) : (
            <span>N/A</span>
          )}
        </div>

        {/* Game type indicator */}
        <div className="text-xs text-gray-400 flex items-center gap-1">
          <Gamepad2 className="w-3 h-3" />
          <span>{getGameDisplayName(priceData.gameType)}</span>
        </div>

        {/* Toggle for detailed view */}
        <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-white">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Refresh button */}
        {onRefresh && (
          <button onClick={onRefresh} className="text-gray-400 hover:text-white" title="Refresh prices">
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expanded detailed view */}
      {expanded && (
        <div className="mt-2 bg-gray-800/50 rounded p-2 text-xs">
          <div className="mb-2 flex justify-between text-gray-400">
            <span>Source</span>
            <span>Price</span>
          </div>

          {priceData.sources
            .filter((source) => source.price !== null || source.error)
            .sort((a, b) => {
              // Sort by price (null prices at the bottom)
              if (a.price === null && b.price !== null) return 1
              if (a.price !== null && b.price === null) return -1
              if (a.price === null && b.price === null) return 0
              return (a.price || 0) - (b.price || 0)
            })
            .map((source, index) => (
              <div
                key={index}
                className={`flex justify-between items-center py-1 ${
                  index !== 0 ? "border-t border-gray-700" : ""
                } ${source.source === priceData.lowestSource ? "font-medium" : ""}`}
              >
                <div className="flex items-center gap-1">
                  <span style={{ color: getSourceColor(source.source) }}>{getSourceDisplayName(source.source)}</span>
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-gray-300"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div>
                  {source.error ? (
                    <span className="text-red-400">{source.error}</span>
                  ) : source.price ? (
                    <span>{formatUsd(source.price)}</span>
                  ) : (
                    <span className="text-gray-500">N/A</span>
                  )}
                </div>
              </div>
            ))}

          {/* Summary section */}
          <div className="mt-2 pt-2 border-t border-gray-700">
            <div className="flex justify-between text-gray-400">
              <span>Average:</span>
              <span>{formatUsd(priceData.averagePrice)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Median:</span>
              <span>{formatUsd(priceData.medianPrice)}</span>
            </div>
            <div className="flex justify-between text-gray-400 text-[10px] mt-1">
              <span>Last updated:</span>
              <span>{formatTimeAgo(priceData.lastUpdated)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
