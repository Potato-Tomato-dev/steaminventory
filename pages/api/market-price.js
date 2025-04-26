// Simple in-memory cache to avoid excessive API calls
const priceCache = new Map()
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds

export default async function handler(req, res) {
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
    const price = await fetchSteamMarketPrice(appid, market_hash_name)

    // Cache the result
    priceCache.set(cacheKey, {
      timestamp: Date.now(),
      data: price,
    })

    return res.status(200).json(price)
  } catch (error) {
    console.error("Error fetching market price:", error)
    return res.status(500).json({
      error: "Failed to fetch market price",
      message: error.message,
    })
  }
}

async function fetchSteamMarketPrice(appid, market_hash_name) {
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
        success: false,
        lowest_price: null,
        median_price: null,
        volume: null,
      }
    }

    // Convert USD price to MNT (approximate conversion rate)
    const USD_TO_MNT_RATE = 3500
    let mnt_lowest_price = null
    let mnt_median_price = null

    if (data.lowest_price) {
      const numericPrice = Number.parseFloat(data.lowest_price.replace(/[^0-9.]/g, ""))
      if (!isNaN(numericPrice)) {
        mnt_lowest_price = `${Math.round(numericPrice * USD_TO_MNT_RATE).toLocaleString()}₮`
      }
    }

    if (data.median_price) {
      const numericPrice = Number.parseFloat(data.median_price.replace(/[^0-9.]/g, ""))
      if (!isNaN(numericPrice)) {
        mnt_median_price = `${Math.round(numericPrice * USD_TO_MNT_RATE).toLocaleString()}₮`
      }
    }

    return {
      success: true,
      lowest_price: data.lowest_price || null,
      median_price: data.median_price || null,
      mnt_lowest_price,
      mnt_median_price,
      volume: data.volume || null,
      market_url: `https://steamcommunity.com/market/listings/${appid}/${encodedName}`,
    }
  } catch (error) {
    console.error(`Failed to fetch price for ${market_hash_name}:`, error)
    return {
      success: false,
      error: error.message,
      lowest_price: null,
      median_price: null,
      volume: null,
    }
  }
}
