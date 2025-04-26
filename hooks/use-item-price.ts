"use client"

import { useState, useEffect, useCallback } from "react"
import type { AggregatedPriceData } from "../utils/price-sources"

interface UseItemPriceProps {
  appid: number | string
  market_hash_name: string
  enabled?: boolean
}

export function useItemPrice({ appid, market_hash_name, enabled = true }: UseItemPriceProps) {
  const [priceData, setPriceData] = useState<AggregatedPriceData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPrice = useCallback(async () => {
    if (!enabled || !market_hash_name) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/price/aggregate?appid=${appid}&market_hash_name=${encodeURIComponent(market_hash_name)}`,
      )

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }

      const data = await response.json()
      setPriceData(data)
    } catch (err) {
      console.error("Error fetching price data:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }, [appid, market_hash_name, enabled])

  useEffect(() => {
    if (enabled) {
      fetchPrice()
    }
  }, [fetchPrice, enabled])

  return {
    priceData,
    isLoading,
    error,
    refetch: fetchPrice,
  }
}
