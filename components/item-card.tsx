"use client"

import type React from "react"
import { useItemPrice } from "../hooks/use-item-price"
import { PriceDisplay } from "./price-display"
import type { SteamInventoryItem } from "../types/steam"

interface ItemCardProps {
  item: SteamInventoryItem
  isSelected: boolean
  onSelect: () => void
  className?: string
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, isSelected, onSelect, className = "" }) => {
  const { priceData, isLoading, refetch } = useItemPrice({
    appid: item.appid || 730,
    market_hash_name: item.market_hash_name || item.name,
    enabled: item.marketable !== 0,
  })

  return (
    <div
      onClick={onSelect}
      className={`
        bg-gradient-to-b from-gray-800 to-gray-900 
        rounded-lg overflow-hidden cursor-pointer transition-all
        ${isSelected ? "ring-2 ring-yellow-500 transform scale-[1.02]" : "hover:scale-[1.02]"}
        ${className}
      `}
    >
      <div className="h-40 bg-gray-700 relative flex items-center justify-center p-2">
        <img
          src={`https://community.cloudflare.steamstatic.com/economy/image/${item.icon_url}`}
          alt={item.name}
          className="max-w-full max-h-full object-contain"
        />
      </div>
      <div className="p-3">
        <h3
          className="font-medium truncate text-sm"
          style={{ color: item.name_color ? `#${item.name_color}` : "white" }}
        >
          {item.name}
        </h3>
        <p className="text-gray-400 text-xs truncate">{item.type}</p>

        {/* Price display component */}
        {item.marketable !== 0 && (
          <div className="mt-1">
            <PriceDisplay priceData={priceData} isLoading={isLoading} onRefresh={refetch} className="mt-1" />
          </div>
        )}

        <div className="flex justify-between items-center mt-2">
          <span className="text-green-500 text-xs">Tradable</span>
          {isSelected && <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded">Selected</span>}
        </div>
      </div>
    </div>
  )
}
