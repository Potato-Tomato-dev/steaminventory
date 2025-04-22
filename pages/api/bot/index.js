import SteamUser from "steam-user"
import TradeOfferManager from "steam-tradeoffer-manager"
import SteamCommunity from "steamcommunity"
import dotenv from "dotenv"

dotenv.config()

const client = new SteamUser()
const manager = new TradeOfferManager({
  steam: client,
  language: "en",
  pollInterval: 10000, // Check for trade offers every 10 seconds
  cancelTime: 300000, // Cancel outgoing offers after 5 minutes
})
const community = new SteamCommunity()

let isLoggedIn = false
let lastLoginAttempt = 0
let sessionRefreshTimer = null

// Function to initialize Steam client with Steam Guard code
const initializeSteamBot = (steamGuardCode) => {
  // Prevent multiple login attempts in a short period
  const now = Date.now()
  if (now - lastLoginAttempt < 30000) {
    // 30 seconds cooldown
    return { success: false, message: "Please wait before trying again" }
  }

  lastLoginAttempt = now

  if (isLoggedIn) {
    return { success: true, message: "Bot is already logged in" }
  }

  if (!steamGuardCode) {
    return { success: false, message: "Steam Guard code is required" }
  }

  return new Promise((resolve) => {
    // Clear any existing session refresh timer
    if (sessionRefreshTimer) {
      clearInterval(sessionRefreshTimer)
    }

    // Set up event handlers before logging in
    client.once("loggedOn", () => {
      console.log("✅ Bot logged into Steam!")
      isLoggedIn = true
      client.setPersona(SteamUser.EPersonaState.Online)

      // Set up automatic session refresh every 20 minutes
      sessionRefreshTimer = setInterval(
        () => {
          console.log("⏰ Refreshing Steam web session automatically...")
          client.webLogOn()
        },
        20 * 60 * 1000,
      ) // 20 minutes

      resolve({ success: true, message: "Bot successfully logged in" })
    })

    client.once("webSession", (sessionID, cookies) => {
      console.log("✅ Got web session!")
      manager.setCookies(cookies, (err) => {
        if (err) {
          console.error("❌ Failed to set cookies:", err)
          return
        }
        console.log("✅ Trade Manager is ready!")
      })

      community.setCookies(cookies)
      community.startConfirmationChecker(30000, process.env.STEAM_IDENTITY_SECRET || "")
    })

    client.once("error", (err) => {
      console.error("❌ Steam login failed:", err)
      isLoggedIn = false

      if (sessionRefreshTimer) {
        clearInterval(sessionRefreshTimer)
        sessionRefreshTimer = null
      }

      resolve({ success: false, message: `Login failed: ${err.message}` })
    })

    // Attempt to log in
    try {
      client.logOn({
        accountName: process.env.STEAM_USERNAME,
        password: process.env.STEAM_PASSWORD,
        twoFactorCode: steamGuardCode,
      })
    } catch (error) {
      console.error("❌ Exception during login:", error)
      isLoggedIn = false

      if (sessionRefreshTimer) {
        clearInterval(sessionRefreshTimer)
        sessionRefreshTimer = null
      }

      resolve({ success: false, message: `Exception: ${error.message}` })
    }
  })
}

// Set up session expiration handler
community.on("sessionExpired", () => {
  console.log("⚠️ Session expired. Refreshing session...")
  client.webLogOn()
})

// Handle trade confirmations
community.on("confKeyNeeded", (tag, callback) => {
  console.log(`⚠️ Confirmation key needed for tag: ${tag}`)

  if (process.env.STEAM_IDENTITY_SECRET) {
    const time = Math.floor(Date.now() / 1000)
    callback(null, time, SteamCommunity.getConfirmationKey(process.env.STEAM_IDENTITY_SECRET, time, tag))
  } else {
    console.error("❌ No STEAM_IDENTITY_SECRET set, cannot confirm trades!")
    callback(new Error("No identity secret configured"))
  }
})

// Check bot status
const getBotStatus = () => {
  return {
    isLoggedIn,
    lastLoginAttempt,
    cooldownRemaining: Math.max(0, 30000 - (Date.now() - lastLoginAttempt)),
    sessionActive: !!sessionRefreshTimer,
  }
}

export { client, manager, community, initializeSteamBot, getBotStatus }
