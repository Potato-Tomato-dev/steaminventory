import SteamUser from "steam-user"
import TradeOfferManager from "steam-tradeoffer-manager"
import SteamCommunity from "steamcommunity"
import dotenv from "dotenv"

dotenv.config()

const client = new SteamUser()
const manager = new TradeOfferManager({
  steam: client,
  language: "en",
})
const community = new SteamCommunity()

let isLoggedIn = false
let lastLoginAttempt = 0

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
    // Set up event handlers before logging in
    client.once("loggedOn", () => {
      console.log("✅ Bot logged into Steam!")
      isLoggedIn = true
      client.setPersona(SteamUser.EPersonaState.Online)
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
    })

    client.once("error", (err) => {
      console.error("❌ Steam login failed:", err)
      isLoggedIn = false
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
      resolve({ success: false, message: `Exception: ${error.message}` })
    }
  })
}

// Set up session expiration handler
community.on("sessionExpired", () => {
  console.log("⚠️ Session expired. Refreshing session...")
  isLoggedIn = false
  client.webLogOn()
})

// Check bot status
const getBotStatus = () => {
  return {
    isLoggedIn,
    lastLoginAttempt,
    cooldownRemaining: Math.max(0, 30000 - (Date.now() - lastLoginAttempt)),
  }
}

export { client, manager, initializeSteamBot, getBotStatus }
