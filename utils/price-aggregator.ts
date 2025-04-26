import type { AggregatedPriceData, ExternalPriceData, PriceSource } from "./price-sources"

// Cache duration in milliseconds (30 minutes)
const CACHE_DURATION = 30 * 60 * 1000

// In-memory cache for price data
const priceCache: Map<string, AggregatedPriceData> = new Map()

/**
 * Aggregates price data from multiple sources
 */
export function aggregatePrices(prices: ExternalPriceData[]): AggregatedPriceData {
  // Ensure all prices are for the same game
  const gameTypes = new Set(prices.map((p) => p.gameType))
  if (gameTypes.size > 1) {
    throw new Error("Cannot aggregate prices for different game types")
  }

  const gameType = prices.length > 0 ? prices[0].gameType : "cs2"

  // Filter out prices that are null
  const validPrices = prices.filter((p) => p.price !== null)

  // Calculate lowest price
  let lowestPrice: number | null = null
  let lowestSource: PriceSource | null = null

  if (validPrices.length > 0) {
    const lowestEntry = validPrices.reduce((lowest, current) => {
      if (current.price !== null && (lowest.price === null || current.price < lowest.price)) {
        return current
      }
      return lowest
    }, validPrices[0])

    lowestPrice = lowestEntry.price
    lowestSource = lowestEntry.source
  }

  // Calculate average price
  const averagePrice =
    validPrices.length > 0 ? validPrices.reduce((sum, p) => sum + (p.price || 0), 0) / validPrices.length : null

  // Calculate median price
  let medianPrice: number | null = null
  if (validPrices.length > 0) {
    const sortedPrices = [...validPrices].sort((a, b) => (a.price || 0) - (b.price || 0))
    const mid = Math.floor(sortedPrices.length / 2)

    medianPrice =
      sortedPrices.length % 2 === 0
        ? ((sortedPrices[mid - 1].price || 0) + (sortedPrices[mid].price || 0)) / 2
        : sortedPrices[mid].price
  }

  // Find Steam price specifically
  const steamPrice = prices.find((p) => p.source === "steam")?.price || null

  return {
    sources: prices,
    lowestPrice,
    lowestSource,
    averagePrice,
    medianPrice,
    steamPrice,
    lastUpdated: Date.now(),
    gameType,
  }
}

/**
 * Gets cached price data or returns null if not found or expired
 */
export function getCachedPrice(cacheKey: string): AggregatedPriceData | null {
  const cachedData = priceCache.get(cacheKey)

  if (cachedData && Date.now() - cachedData.lastUpdated < CACHE_DURATION) {
    return cachedData
  }

  return null
}

/**
 * Caches aggregated price data
 */
export function cachePrice(cacheKey: string, priceData: AggregatedPriceData): void {
  priceCache.set(cacheKey, priceData)
}

/**
 * Clears the entire price cache
 */
export function clearPriceCache(): void {
  priceCache.clear()
}

/**
 * Gets the size of the price cache
 */
export function getPriceCacheSize(): number {
  return priceCache.size
}

/**
 * Creates a cache key for an item
 */
export function createCacheKey(appid: string | number, market_hash_name: string): string {
  return `${appid}-${market_hash_name}`
}
