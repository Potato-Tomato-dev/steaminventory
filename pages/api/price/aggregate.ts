import type { NextApiRequest, NextApiResponse } from "next"
import { type ExternalPriceData, getSourcesForGame, appidToGameType } from "../../../utils/price-sources"
import { aggregatePrices, getCachedPrice, cachePrice, createCacheKey } from "../../../utils/price-aggregator"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { appid, market_hash_name } = req.query

  if (!appid || !market_hash_name) {
    return res.status(400).json({ error: "Missing required parameters: appid and market_hash_name" })
  }

  try {
    const cacheKey = createCacheKey(appid as string, market_hash_name as string)
    const gameType = appidToGameType(appid as string)

    // Check if we have cached aggregated data
    const cachedData = getCachedPrice(cacheKey)
    if (cachedData) {
      return res.status(200).json(cachedData)
    }

    // Get enabled price sources for this game type
    const enabledSources = getSourcesForGame(gameType)

    // Fetch prices from all enabled sources in parallel
    const pricePromises = enabledSources.map(async (source) => {
      try {
        const protocol = req.headers["x-forwarded-proto"] || "http"
        const host = req.headers.host
        const baseUrl = `${protocol}://${host}`

        const response = await fetch(
          `${baseUrl}/api/price/${source}?appid=${appid}&market_hash_name=${encodeURIComponent(market_hash_name as string)}`,
        )

        if (!response.ok) {
          throw new Error(`${source} API returned ${response.status}`)
        }

        return (await response.json()) as ExternalPriceData
      } catch (error) {
        console.error(`Error fetching price from ${source}:`, error)
        return {
          source,
          price: null,
          lastUpdated: Date.now(),
          error: error instanceof Error ? error.message : "Unknown error",
          gameType,
        } as ExternalPriceData
      }
    })

    // Wait for all price fetches to complete
    const prices = await Promise.all(pricePromises)

    // Aggregate the prices
    const aggregatedData = aggregatePrices(prices)

    // Cache the aggregated data
    cachePrice(cacheKey, aggregatedData)

    return res.status(200).json(aggregatedData)
  } catch (error) {
    console.error("Error aggregating prices:", error)
    return res.status(500).json({
      error: "Failed to aggregate prices",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
