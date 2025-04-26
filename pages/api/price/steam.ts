import type { NextApiRequest, NextApiResponse } from "next"
import type { ExternalPriceData } from "../../../utils/price-sources"
import { appidToGameType } from "../../../utils/price-sources"

// Simple in-memory cache to avoid excessive API calls
const priceCache = new Map<string, { data: ExternalPriceData; timestamp: number }>()
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { appid, market_hash_name } = req.query

  if (!appid || !market_hash_name) {
    return res.status(400).json({ error: "Missing required parameters: appid and market_hash_name" })
  }

  try {
    // Check if we have a cached price that's still valid
    const cacheKey = `${appid}-${market_hash_name}`
    const cachedData = priceCache.get(cacheKey)

    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return res.status(200).json(cachedData.data)
    }

    // Fetch price from Steam Market
    const price = await fetchSteamMarketPrice(appid as string, market_hash_name as string)

    // Cache the result
    priceCache.set(cacheKey, {
      timestamp: Date.now(),
      data: price,
    })

    return res.status(200).json(price)
  } catch (error) {
    console.error("Error fetching Steam market price:", error)
    return res.status(500).json({
      error: "Failed to fetch market price",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

async function fetchSteamMarketPrice(appid: string, market_hash_name: string): Promise<ExternalPriceData> {
  // URL encode the market_hash_name
  const encodedName = encodeURIComponent(market_hash_name)

  // Steam Community Market API URL
  const url = `https://steamcommunity.com/market/priceoverview/?appid=${appid}&currency=1&market_hash_name=${encodedName}`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Steam API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    // If the request was successful but no price data was found
    if (!data.success) {
      return {
        source: "steam",
        price: null,
        lastUpdated: Date.now(),
        error: "No price data available",
        gameType: appidToGameType(appid),
      }
    }

    // Extract numeric price from string (e.g., "$10.50" -> 10.50)
    let price: number | null = null
    if (data.lowest_price) {
      const numericPrice = Number.parseFloat(data.lowest_price.replace(/[^0-9.]/g, ""))
      if (!isNaN(numericPrice)) {
        price = numericPrice
      }
    }

    return {
      source: "steam",
      price,
      url: `https://steamcommunity.com/market/listings/${appid}/${encodedName}`,
      lastUpdated: Date.now(),
      available: data.volume ? Number.parseInt(data.volume.replace(/,/g, ""), 10) : undefined,
      gameType: appidToGameType(appid),
    }
  } catch (error) {
    console.error(`Failed to fetch Steam price for ${market_hash_name}:`, error)
    return {
      source: "steam",
      price: null,
      lastUpdated: Date.now(),
      error: error instanceof Error ? error.message : "Unknown error",
      gameType: appidToGameType(appid),
    }
  }
}
