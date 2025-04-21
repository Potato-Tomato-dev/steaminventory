import { client, manager, getBotStatus } from "./bot/index"

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.json({ message: "Bot API is working!" })
  }

  if (req.method === "POST") {
    const { item, userTradeUrl } = req.body

    // Validate request
    if (!item || !userTradeUrl) {
      return res.status(400).json({ error: "Missing trade items or trade URL." })
    }

    // Check if bot is logged in
    const botStatus = getBotStatus()
    if (!botStatus.isLoggedIn || !client || !client.steamID) {
      return res.status(503).json({
        error: "Bot is not logged in. Please authenticate the bot first.",
        botStatus,
      })
    }

    try {
      const result = await sendTradeOfferToUser(item, userTradeUrl)
      return res.json(result)
    } catch (error) {
      console.error("❌ Error processing trade:", error)
      return res.status(500).json({
        error: error.message || "Failed to process trade offer",
        details: error.stack,
      })
    }
  }

  // Method not allowed
  return res.status(405).json({ error: "Method not allowed" })
}

function sendTradeOfferToUser(items, userTradeUrl) {
  return new Promise((resolve, reject) => {
    try {
      // Extract Steam ID and token from trade URL
      const { steamID64, token } = extractSteamIdAndTokenFromTradeUrl(userTradeUrl)

      // Create the trade offer
      const offer = manager.createOffer(steamID64,token)

      // Set trade token if provided
      if (token) {
        offer.setToken(token)
      }

      // Log trade details for debugging
      console.log(`Creating trade offer:`)
      console.log(`- Bot's Steam ID: ${client.steamID.getSteamID64()}`)
      console.log(`- Recipient's Steam ID: ${steamID64}`)
      console.log(`- Using Trade Token: ${token || "None"}`)
      console.log(`- Number of items: ${Array.isArray(items) ? items.length : 1}`)

      // Add items to the trade
      const itemsArray = Array.isArray(items) ? items : [items]

      itemsArray.forEach((item) => {
        // Determine the correct appid based on the game
        // CS2 = 730, Dota 2 = 570
        const appid = item.appid || (item.type && item.type.includes("Dota") ? 570 : 730)

        offer.addTheirItem({
          assetid: item.assetid,
          appid: appid,
          contextid: "2", // Steam inventory context ID (2 is standard for games)
          amount: item.amount || 1,
        })

        console.log(`Added item to trade: ${item.name || item.assetid} (${appid})`)
      })
      console.log(offer);

      // Send the trade offer
      offer.send((err, status) => {
        if (err) {
          console.error("❌ Trade Error:", err)
          return reject(new Error(`Trade offer failed: ${err.message}`))
        }

        console.log(`✅ Trade Sent! Status: ${status}`)
        return resolve({
          success: true,
          message: "Trade offer sent successfully!",
          status,
          tradeOfferId: offer.id || null,
          itemCount: itemsArray.length,
        })
      })
    } catch (error) {
      console.error("❌ Error creating trade offer:", error)
      reject(error)
    }
  })
}

function extractSteamIdAndTokenFromTradeUrl(tradeUrl) {
  // Example URL: https://steamcommunity.com/tradeoffer/new/?partner=1009663456&token=2SMnK6T7
  const steamIdRegex = /partner=([^&]+)/
  const tokenRegex = /token=([^&]+)/

  const steamIdMatch = tradeUrl.match(steamIdRegex)
  const tokenMatch = tradeUrl.match(tokenRegex)

  if (!steamIdMatch || !steamIdMatch[1]) {
    throw new Error("Invalid trade URL: SteamID not found.")
  }

  const partnerId = steamIdMatch[1]
  // Convert partner ID to SteamID64
  const steamID64 = convertToSteamID64(partnerId)
  const token = tokenMatch ? tokenMatch[1] : null

  return { steamID64, token }
}

function convertToSteamID64(partnerId) {
  // Convert partner ID to SteamID64
  // Partner ID is the account ID, which needs to be converted to the full SteamID64
  // SteamID64 = 76561197960265728 + partner ID
  const steamID64Base = "76561197960265728"

  // Use safer conversion method that works in all Node.js environments
  const partnerIdNum = Number.parseInt(partnerId, 10)
  const steamID64 = (Number(steamID64Base) + partnerIdNum).toString()

  console.log(`Converting partner ID ${partnerId} to SteamID64: ${steamID64}`)
  return steamID64
}
