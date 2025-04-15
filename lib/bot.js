import SteamUser from "steam-user";
import TradeOfferManager from "steam-tradeoffer-manager";
import SteamCommunity from "steamcommunity";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

// Path for storing session data
const SESSION_FILE_PATH = path.join(process.cwd(), "steam_session.json");

const client = new SteamUser();
const manager = new TradeOfferManager({
  steam: client,
  language: "en",
});
const community = new SteamCommunity();

let isLoggedIn = false;

// Function to save session data
const saveSession = (sessionData) => {
  try {
    fs.writeFileSync(SESSION_FILE_PATH, JSON.stringify(sessionData, null, 2));
    console.log("✅ Session data saved successfully");
  } catch (err) {
    console.error("❌ Failed to save session data:", err);
  }
};

// Function to load session data
const loadSession = () => {
  try {
    if (fs.existsSync(SESSION_FILE_PATH)) {
      const data = fs.readFileSync(SESSION_FILE_PATH, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("❌ Failed to load session data:", err);
  }
  return null;
};

// Function to initialize Steam client with session persistence
const initializeSteamBot = () => {
  if (isLoggedIn) return;

  // First try to login with saved session
  const sessionData = loadSession();
  
  if (sessionData && sessionData.loginKey) {
    console.log("🔄 Attempting to login with saved session...");
    client.logOn({
      accountName: process.env.STEAM_USERNAME,
      loginKey: sessionData.loginKey,
      rememberPassword: true
    });
  } else {
    // If no session, login with credentials and 2FA
    console.log("🔑 No saved session found, logging in with credentials...");
    client.logOn({
      accountName: process.env.STEAM_USERNAME,
      password: process.env.STEAM_PASSWORD,
      twoFactorCode: process.env.STEAM_TOTP || "",
      rememberPassword: true // This helps with getting a loginKey
    });
  }

  // Handle login key event to save session
  client.on("loginKey", (loginKey) => {
    console.log("🔑 Received new login key, saving session...");
    const sessionData = {
      loginKey: loginKey,
      timestamp: Date.now()
    };
    saveSession(sessionData);
  });

  client.on("loggedOn", () => {
    console.log("✅ Bot logged into Steam!");
    isLoggedIn = true;
    client.setPersona(SteamUser.EPersonaState.Online);
  });

  client.on("webSession", (sessionID, cookies) => {
    console.log("✅ Got web session!");
    manager.setCookies(cookies, (err) => {
      if (err) {
        console.error("❌ Failed to set cookies:", err);
        return;
      }
      console.log("✅ Trade Manager is ready!");
    });
    
    community.setCookies(cookies);
    
    // Save cookies for potential future use
    const cookieData = {
      sessionID: sessionID,
      cookies: cookies,
      timestamp: Date.now()
    };
    
    try {
      fs.writeFileSync(
        path.join(process.cwd(), "steam_cookies.json"), 
        JSON.stringify(cookieData, null, 2)
      );
      console.log("✅ Cookies saved successfully");
    } catch (err) {
      console.error("❌ Failed to save cookies:", err);
    }
  });

  client.on("error", (err) => {
    console.error("❌ Steam login failed:", err);
    
    // If the error is because of an invalid login key, retry with credentials
    if (err.eresult === SteamUser.EResult.InvalidPassword && fs.existsSync(SESSION_FILE_PATH)) {
      console.log("⚠️ Session expired, retrying with credentials...");
      // Delete the invalid session file
      fs.unlinkSync(SESSION_FILE_PATH);
      
      // Login with credentials and 2FA
      client.logOn({
        accountName: process.env.STEAM_USERNAME,
        password: process.env.STEAM_PASSWORD,
        twoFactorCode: process.env.STEAM_TOTP || "",
        rememberPassword: true
      });
    }
  });

  community.on("sessionExpired", () => {
    console.log("⚠️ Session expired. Refreshing session...");
    client.webLogOn();
  });
};

// Function to handle trade confirmations with retry logic
const confirmTrade = async (offerId, maxRetries = 3) => {
  let retries = 0;
  
  while (retries < maxRetries) {
    retries++;
    console.log(`🔄 Attempting to confirm trade offer ${offerId} (Attempt ${retries}/${maxRetries})...`);
    
    try {
      return await new Promise((resolve, reject) => {
        community.acceptConfirmationForObject(
          process.env.STEAM_IDENTITY_SECRET, 
          offerId, 
          (err) => {
            if (err) {
              console.error(`❌ Confirmation error: ${err.message}`);
              reject(err);
            } else {
              console.log('✅ Trade confirmed successfully');
              resolve();
            }
          }
        );
      });
    } catch (err) {
      if (retries >= maxRetries) {
        throw new Error(`Failed to confirm trade after ${maxRetries} attempts: ${err.message}`);
      }
      console.log(`⏳ Retrying in 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// Function to send a trade offer
const sendTradeOffer = async (tradeUrl, assetId, appid, contextid, message) => {
  return new Promise((resolve, reject) => {
    try {
      // Create new offer
      const offer = manager.createOffer(tradeUrl);

      // Add item to offer
      offer.addMyItem({
        assetid: assetId,
        appid: appid,
        contextid: contextid || "2",
        amount: 1
      });

      // Set custom message
      offer.setMessage(message || "Here's your item!");

      // Send offer
      offer.send((err, status) => {
        if (err) {
          console.error("❌ Error sending trade offer:", err);
          return reject(err);
        }

        console.log(`✅ Sent offer. Status: ${status}. Waiting for auto confirmation...`);
        
        // Wait 5 seconds before confirming
        setTimeout(async () => {
          try {
            await confirmTrade(offer.id);
            resolve({
              success: true,
              offerId: offer.id,
              status: status,
              message: "Trade offer sent and confirmed!"
            });
          } catch (confirmErr) {
            console.error("❌ Error confirming trade:", confirmErr);
            reject(confirmErr);
          }
        }, 5000);
      });
    } catch (err) {
      console.error("❌ Error creating trade offer:", err);
      reject(err);
    }
  });
};

// Function to force refresh the session if needed
const refreshSteamSession = async () => {
  try {
    // Delete the session file to force a fresh login
    if (fs.existsSync(SESSION_FILE_PATH)) {
      fs.unlinkSync(SESSION_FILE_PATH);
    }
    
    // Logout and re-login
    client.logOff();
    
    // Wait a moment before logging back in
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Login with credentials and 2FA
    client.logOn({
      accountName: process.env.STEAM_USERNAME,
      password: process.env.STEAM_PASSWORD,
      twoFactorCode: process.env.STEAM_TOTP || "",
      rememberPassword: true
    });
    
    return { success: true, message: 'Steam session refresh initiated' };
  } catch (err) {
    console.error("❌ Error refreshing session:", err);
    throw err;
  }
};

// Call the function to log in immediately
initializeSteamBot();

export { 
  client, 
  manager, 
  community, 
  sendTradeOffer, 
  refreshSteamSession 
};
