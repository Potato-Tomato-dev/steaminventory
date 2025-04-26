import SteamUser from "steam-user"
import TradeOfferManager from "steam-tradeoffer-manager"
import SteamCommunity from "steamcommunity"
import dotenv from "dotenv"
import { saveSession, loadSession, clearSession } from "./session-manager"

dotenv.config()

const client = new SteamUser({
  // Enable automatic reconnection
  autoRelogin: true,
  // Increase the max reconnect attempts
  maxReconnectAttempts: 30,
  // Increase the reconnect delay
  reconnectDelay: 5000,
  // Enable debug logging
  enablePicsCache: true,
})

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
let heartbeatTimer = null
let reconnectTimer = null

// Function to initialize Steam client with Steam Guard code
const initializeSteamBot = async (steamGuardCode) => {
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

  // Try to load saved session first if no TOTP code is provided
  if (!steamGuardCode) {
    const savedSession = await loadSession()
    if (savedSession) {
      return loginWithSavedSession(savedSession)
    } else {
      return { success: false, message: "Steam Guard code is required for first login" }
    }
  }

  return loginWithCredentials(steamGuardCode)
}

// Login with saved session data
const loginWithSavedSession = async (sessionData) => {
  console.log("🔄 Attempting to login with saved session...")

  return new Promise((resolve) => {
    setupEventHandlers(resolve)

    try {
      client.logOn(sessionData)
    } catch (error) {
      console.error("❌ Exception during login with saved session:", error)
      clearSession().catch(console.error)
      resolve({
        success: false,
        message: `Failed to login with saved session: ${error.message}. Please provide a new Steam Guard code.`,
      })
    }
  })
}

// Login with username, password and TOTP code
const loginWithCredentials = (steamGuardCode) => {
  console.log("🔄 Attempting to login with credentials...")

  return new Promise((resolve) => {
    setupEventHandlers(resolve)

    // Attempt to log in
    try {
      client.logOn({
        accountName: process.env.STEAM_USERNAME,
        password: process.env.STEAM_PASSWORD,
        twoFactorCode: steamGuardCode,
        rememberPassword: true,
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

// Set up event handlers for the Steam client
const setupEventHandlers = (resolvePromise) => {
  // Clear any existing timers
  if (sessionRefreshTimer) {
    clearInterval(sessionRefreshTimer)
    sessionRefreshTimer = null
  }

  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }

  if (reconnectTimer) {
    clearInterval(reconnectTimer)
    reconnectTimer = null
  }

  // Set up event handlers
  client.once("loggedOn", async () => {
    console.log("✅ Bot logged into Steam!")
    isLoggedIn = true
    client.setPersona(SteamUser.EPersonaState.Online)

    // Save session for future use
    const sessionData = client._getLoginSession()
    if (sessionData) {
      await saveSession(sessionData)
    }

    // Set up automatic session refresh every 20 minutes
    sessionRefreshTimer = setInterval(
      () => {
        console.log("⏰ Refreshing Steam web session automatically...")
        client.webLogOn()
      },
      20 * 60 * 1000,
    ) // 20 minutes

    // Set up heartbeat to check connection every 5 minutes
    heartbeatTimer = setInterval(
      () => {
        if (client.steamID) {
          console.log("💓 Bot heartbeat - still connected as", client.steamID.getSteamID64())
        } else {
          console.log("⚠️ Bot heartbeat - not connected, attempting to reconnect...")
          reconnectBot()
        }
      },
      5 * 60 * 1000,
    ) // 5 minutes

    resolvePromise({ success: true, message: "Bot successfully logged in" })
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

    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }

    // If error is because of invalid credentials, clear the saved session
    if (
      err.eresult === SteamUser.EResult.InvalidPassword ||
      err.eresult === SteamUser.EResult.InvalidSteamGuardCode ||
      err.eresult === SteamUser.EResult.AccountLogonDenied
    ) {
      clearSession().catch(console.error)
    }

    resolvePromise({ success: false, message: `Login failed: ${err.message}` })
  })

  // Handle disconnections
  client.on("disconnected", (eresult, msg) => {
    console.log(`⚠️ Bot disconnected from Steam: ${eresult} - ${msg}`)

    if (isLoggedIn) {
      console.log("🔄 Attempting to reconnect...")
      reconnectBot()
    }
  })
}

// Function to attempt reconnection
const reconnectBot = async () => {
  if (reconnectTimer) {
    return // Already attempting to reconnect
  }

  console.log("🔄 Attempting to reconnect to Steam...")

  // Try to reconnect with saved session
  const savedSession = await loadSession()
  if (savedSession) {
    try {
      client.logOn(savedSession)
      console.log("🔄 Reconnect attempt sent with saved session")
    } catch (error) {
      console.error("❌ Failed to reconnect with saved session:", error)
      console.log("⚠️ Manual re-authentication with a new Steam Guard code may be required")
    }
  }

  // Set a timer to check if reconnection was successful
  reconnectTimer = setTimeout(() => {
    if (!isLoggedIn) {
      console.log("⚠️ Reconnection attempt failed, will try again later")
    }
    reconnectTimer = null
  }, 30000) // Check after 30 seconds
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
    steamId: client.steamID ? client.steamID.getSteamID64() : null,
    personaName: client.personaName || null,
    sessionAge: isLoggedIn ? Math.floor((Date.now() - lastLoginAttempt) / 1000 / 60) + " minutes" : null,
  }
}

// Force logout and clear session
const logoutBot = async () => {
  if (sessionRefreshTimer) {
    clearInterval(sessionRefreshTimer)
    sessionRefreshTimer = null
  }

  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }

  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  await clearSession()

  if (isLoggedIn) {
    client.logOff()
    isLoggedIn = false
  }

  return { success: true, message: "Bot logged out and session cleared" }
}

// Try to login with saved session on startup
;(async () => {
  const savedSession = await loadSession()
  if (savedSession) {
    console.log("🔄 Found saved session, attempting automatic login...")
    initializeSteamBot().catch((error) => {
      console.error("❌ Failed to auto-login with saved session:", error)
    })
  }
})()

export { client, manager, community, initializeSteamBot, getBotStatus, logoutBot }
