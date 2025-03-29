import SteamUser from "steam-user";
import TradeOfferManager from "steam-tradeoffer-manager";
import SteamCommunity from "steamcommunity";

let client = null;
let manager = null;
let isLoggedIn = false;

export default function handler(req, res) {
  if (req.method === "GET") {
    return res.json({ message: "Bot API is working!" });
  }

  if (req.method === "POST") {
    const { item, userTradeUrl } = req.body; // Using a single item from req.body

    if (!item || !userTradeUrl) {
      return res.status(400).json({ error: "Missing trade item or trade URL." });
    }

    // Initialize client and manager if not already
    if (!client) {
      client = new SteamUser();
      manager = new TradeOfferManager({
        steam: client,
        language: "en",
      });

      // Listen for session expiration to refresh cookies without re-logging on
      // (Using the community instance for session management)
      const community = new SteamCommunity();
      community.on("sessionExpired", () => {
        console.log("⚠️ Session expired. Refreshing session...");
        client.webLogOn(); // Refresh web session without re-calling logOn()
      });
    }

    // If not logged in, log in
    if (!isLoggedIn) {
      client.logOn({
        accountName: process.env.STEAM_USERNAME,
        password: process.env.STEAM_PASSWORD,
      });

      client.once("loggedOn", () => {
        console.log("✅ Bot logged into Steam!");
        client.setPersona(SteamUser.EPersonaState.Online);
        client.once("accountInfo", (name) => {
          console.log(`Logged in as: ${name} (Steam ID: ${client.steamID.getSteamID64()})`);
        });
      });
      client.once("webSession", (sessionID, cookies) => {
        console.log("✅ Got web session!");
        manager.setCookies(cookies, (err) => {
          if (err) {
            console.error("❌ Failed to set cookies:", err);
            return res.status(500).json({ error: "Failed to authenticate trade session." });
          }
          console.log("✅ Trade Manager is ready!");
          // After web session is set, proceed to send the trade offer.
          sendTradeOfferToUser(item, userTradeUrl, res);
        });
      });

      client.on("error", (err) => {
        console.error("❌ Steam login failed:", err);
        res.status(500).json({ error: "Steam login failed" });
      });
    } else {
      // Bot is already logged in and session should be valid—try sending the trade offer.
      sendTradeOfferToUser(item, userTradeUrl, res);
    }
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}

function sendTradeOfferToUser(item, userTradeUrl, res) {
  if (!client || !client.steamID) {
    console.error("❌ Bot is not logged in properly.");
    return res.status(500).json({ error: "Bot is not logged in properly." });
  }

  try {
    console.log(client.accountInfo);
    // Extract the recipient's SteamID64 and token from the trade URL
    const { steamID64: recipientSteamID, token } = extractSteamIdAndTokenFromTradeUrl(userTradeUrl);
    // Create the trade offer using the recipient's SteamID and the token if available
    const offer = manager.createOffer(recipientSteamID, token ? { accessToken: token } : {});

    // Add the item from the request to the trade offer (the bot is offering this item)
    offer.addMyItem({
      assetid: item.assetid,
      appid: item.appid || 570,      // Use provided appid or default to 570 (Dota 2) if needed
      contextid: item.contextid || 2,  // Use provided contextid or default to 2
    });

    // console.log(`Bot's Steam ID: ${client.steamID.getSteamID64()}`);
    console.log(`Recipient's Steam ID: ${recipientSteamID}, Using Trade Token: ${token}`);

    offer.send((err, status) => {
      if (err) {
        console.error("❌ Trade Error:", err);
        return res.status(500).json({ error: "Trade offer failed" });
      }
      console.log(`✅ Trade Sent! Status: ${status}`);
      return res.json({ success: true, message: "Trade offer sent!", status });
    });
  } catch (error) {
    console.error("❌ Error processing trade:", error.message);
    return res.status(500).json({ error: "Invalid trade URL or Steam ID." });
  }
}

function extractSteamIdAndTokenFromTradeUrl(tradeUrl) {
  // Expect a URL like: https://steamcommunity.com/tradeoffer/new/?partner=1009663456&token=abcdefg
  const steamIdRegex = /partner=([^&]+)/;
  const tokenRegex = /token=([^&]+)/;

  const steamIdMatch = tradeUrl.match(steamIdRegex);
  const tokenMatch = tradeUrl.match(tokenRegex);

  if (!steamIdMatch || !steamIdMatch[1]) {
    throw new Error("Invalid trade URL: SteamID not found.");
  }

  const steamID32 = steamIdMatch[1];
  const steamID64 = convertToSteamID64(steamID32);
  const token = tokenMatch ? tokenMatch[1] : null;

  console.log(`Extracted SteamID32: ${steamID32}, Converted to SteamID64: ${steamID64}, Trade Token: ${token}`);
  return { steamID64, token };
}

function convertToSteamID64(steamID32) {
  // Convert a SteamID32 (as a string) to SteamID64 using BigInt arithmetic.
  return (BigInt(steamID32) + BigInt("76561197960265728")).toString();
}
76561198855243351
1009663456