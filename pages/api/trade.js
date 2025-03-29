import SteamUser from "steam-user";
import TradeOfferManager from "steam-tradeoffer-manager";
import SteamCommunity from "steamcommunity";

import { client,manager } from "../../lib/bot";

export default function handler(req, res) {
  if (req.method === "GET") {
    return res.json({ message: "Bot API is working!" });
  }

  if (req.method === "POST") {
    const { item, userTradeUrl } = req.body; // 'item' comes from req.body

    if (!item || !userTradeUrl) {
      return res.status(400).json({ error: "Missing trade item or trade URL." });
    }
    if (client) {
        sendTradeOfferToUser(item[0], userTradeUrl, res);
        client.on("error", (err) => {
          console.error("❌ Steam login failed:", err);
          res.status(500).json({ error: "Steam login failed" });
        });
      } else {
      console.log(client);
      }
    }
}

function sendTradeOfferToUser(item, userTradeUrl, res) {
  if (!client || !client.steamID) {
    console.error("❌ Bot is not logged in properly.");
    return res.status(500).json({ error: "Bot is not logged in properly." });
  }

  try {
    const { steamID64, token } = extractSteamIdAndTokenFromTradeUrl(userTradeUrl);
    const offer = token ? manager.createOffer(steamID64, token) : manager.createOffer(steamID64);

    console.log(token);
    console.log(`Trade Offer Options:`, offer.options);
    offer.addTheirItem({
      assetid: item.assetid,
      appid: item.appid || 570,
      contextid: 2
    });

    console.log(`Bot's Steam ID: ${client.steamID.getSteamID64()}`);
    console.log(`Recipient's Steam ID: ${steamID64}, Using Trade Token: ${token}`);
    console.log(offer);

    offer.send((err, status) => {
      if (err) {
        console.error("❌ Trade Error:", err);
        return res.status(500).json({ error: "Trade offer failed" });
      }
      console.log(`✅ Trade Sent! Status: ${status}`);
      return res.json({ success: true, message: "Trade offer sent!", status });
    });
    // offer.send();
  } catch (error) {
    console.error("❌ Error processing trade:", error.message);
    return res.status(500).json({ error: "Invalid trade URL or Steam ID." });
  }
}

function extractSteamIdAndTokenFromTradeUrl(tradeUrl) {
  // Example URL: https://steamcommunity.com/tradeoffer/new/?partner=1009663456&token=2SMnK6T7
  const steamIdRegex = /partner=([^&]+)/;
  const tokenRegex = /token=([^&]+)/;

  const steamIdMatch = tradeUrl.match(steamIdRegex);
  const tokenMatch = tradeUrl.match(tokenRegex);

  if (!steamIdMatch || !steamIdMatch[1]) {
    throw new Error("Invalid trade URL: SteamID not found.");
  }

  let id = steamIdMatch[1];
  // If id is not already a 17-digit SteamID64, convert from SteamID32
  if (!/^\d{17}$/.test(id)) {
    id = convertToSteamID64(id);
  }
  const token = tokenMatch ? tokenMatch[1] : null;

  console.log(`Extracted SteamID: ${id}, Trade Token: ${token}`);
  return { steamID64: id, token };
}

function convertToSteamID64(steamID32) {
  return (BigInt(steamID32) + BigInt("76561197960265728")).toString();
}
