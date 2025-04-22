import { client, manager, getBotStatus } from "./bot/index"

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.json({ message: "Bot API is working!" })
  }

  if (req.method === "POST") {
    const { item, userTradeUrl } = req.body

    // Validate request
    if (!item) {
      return res.status(400).json({ error: "Missing trade items." })
    }

    if (!userTradeUrl) {
      return res.status(400).json({ error: "Missing trade URL. Please provide your Steam trade URL." })
    }

    // Validate trade URL format
    const tradeUrlRegex = /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=\d+&token=[a-zA-Z0-9_-]+$/
    if (!tradeUrlRegex.test(userTradeUrl)) {
      return res.status(400).json({ error: "Invalid trade URL format. Please provide a valid Steam trade URL." })
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
      // Refresh web session before sending trade
      await refreshWebSession()

      const result = await sendTradeOfferToUser(item, userTradeUrl)
      return res.json(result)
    } catch (error) {
      console.error("❌ Error processing trade:", error)

      // Handle specific error codes
      let errorMessage = error.message || "Failed to process trade offer"

      // Check for specific Steam error codes
      if (error.eresult) {
        switch (error.eresult) {
          case 15:
            errorMessage =
              "Access denied. This could be due to trade restrictions, invalid trade URL, or the bot's session has expired. Please try re-authenticating the bot."
            break
          case 16:
            errorMessage = "Trade offer limit exceeded. Please try again later."
            break
          case 25:
            errorMessage = "Trade hold in effect. Please check your Steam Guard Mobile Authenticator settings."
            break
          case 26:
            errorMessage = "Need to confirm email. Please check your email for Steam Guard confirmation."
            break
          default:
            errorMessage = `Steam error (${error.eresult}): ${errorMessage}`
        }
      }

      return res.status(500).json({
        error: errorMessage,
        code: error.eresult || "unknown",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      })
    }
  }

  // Method not allowed
  return res.status(405).json({ error: "Method not allowed" })
}

// Function to refresh web session
function refreshWebSession() {
  return new Promise((resolve, reject) => {
    console.log("Refreshing web session...")

    client.webLogOn()

    // Listen for the webSession event
    const sessionHandler = (sessionID, cookies) => {
      console.log("✅ Web session refreshed successfully!")

      // Set the cookies for the trade manager
      manager.setCookies(cookies, (err) => {
        if (err) {
          console.error("❌ Failed to set cookies:", err)
          reject(new Error("Failed to set cookies after refreshing session"))
          return
        }

        console.log("✅ Trade Manager cookies updated!")
        resolve()
      })

      // Remove the listener to avoid memory leaks
      client.removeListener("webSession", sessionHandler)
    }

    // Add the listener
    client.once("webSession", sessionHandler)

    // Set a timeout in case the event never fires
    setTimeout(() => {
      client.removeListener("webSession", sessionHandler)
      reject(new Error("Timed out while waiting for web session"))
    }, 30000) // 30 second timeout
  })
}

function sendTradeOfferToUser(items, userTradeUrl) {
  return new Promise((resolve, reject) => {
    try {
      // Extract Steam ID and token from trade URL
      const { steamID64, token } = extractSteamIdAndTokenFromTradeUrl(userTradeUrl)

      // Create the trade offer
      const offer = manager.createOffer(userTradeUrl)

      // Set trade token if provided
      // if (token) {
      //   offer.setToken(token)
      // }

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

      // Send the trade offer with retries
      let retries = 0
      const maxRetries = 2

      const attemptSend = () => {
        offer.send((err, status) => {
          if (err) {
            console.error(`❌ Trade Error (attempt ${retries + 1}/${maxRetries + 1}):`, err)

            // Check if we should retry
            if (retries < maxRetries) {
              retries++
              console.log(`Retrying... (${retries}/${maxRetries})`)

              // Wait a bit before retrying
              setTimeout(attemptSend, 3000)
              return
            }

            return reject(Object.assign(new Error(`Trade offer failed: ${err.message}`), { eresult: err.eresult }))
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
      }

      attemptSend()
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
