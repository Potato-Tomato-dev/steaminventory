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

  const gameType = appidToGameType(appid as string)

  try {
    // Check if we have a cached price that's still valid
    const cacheKey = `${appid}-${market_hash_name}`
    const cachedData = priceCache.get(cacheKey)

    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return res.status(200).json(cachedData.data)
    }

    // In a real implementation, you would fetch from BUFF163 API
    // For now, we'll simulate a response with slightly lower prices than Steam
    const protocol = req.headers["x-forwarded-proto"] || "http"
    const host = req.headers.host
    const baseUrl = `${protocol}://${host}`

    const steamPriceResponse = await fetch(
      `${baseUrl}/api/price/steam?appid=${appid}&market_hash_name=${encodeURIComponent(market_hash_name as string)}`,
    )
    const steamPriceData = await steamPriceResponse.json()

    // Simulate BUFF163 price (typically 10-20% lower than Steam)
    // For Dota 2 items, we'll use a different discount rate
    const steamPrice = steamPriceData.price
    const discountRate = gameType === "dota2" ? 0.9 : 0.85 // 10% discount for Dota 2, 15% for CS:GO
    const buffPrice = steamPrice ? steamPrice * discountRate : null

    // Generate appropriate URL based on game type
    let url = ""
    if (gameType === "cs2") {
      url = `https://buff.163.com/market/csgo#tab=selling&page_num=1&search=${encodeURIComponent(market_hash_name as string)}`
    } else {
      url = `https://buff.163.com/market/dota2#tab=selling&page_num=1&search=${encodeURIComponent(market_hash_name as string)}`
    }

    const priceData: ExternalPriceData = {
      source: "buff163",
      price: buffPrice,
      url,
      lastUpdated: Date.now(),
      available: Math.floor(Math.random() * 50) + 1, // Random number of available items
      gameType,
    }

    // Cache the result
    priceCache.set(cacheKey, {
      timestamp: Date.now(),
      data: priceData,
    })

    return res.status(200).json(priceData)
  } catch (error) {
    console.error("Error fetching BUFF163 price:", error)
    return res.status(500).json({
      source: "buff163",
      price: null,
      lastUpdated: Date.now(),
      error: error instanceof Error ? error.message : "Unknown error",
      gameType,
    })
  }
}
