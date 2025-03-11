import SteamUser from "steam-user";
import TradeOfferManager from "steam-tradeoffer-manager";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const client = new SteamUser();
  const manager = new TradeOfferManager({
    steam: client,
    language: "en",
  });

  client.logOn({
    accountName: process.env.STEAM_USERNAME,
    password: process.env.STEAM_PASSWORD,
  });

  client.on("loggedOn", () => {
    console.log("Logged into Steam!");
    res.status(200).json({ message: "Bot logged in successfully!" });
  });

  client.on("error", (err) => {
    console.error("Steam login failed:", err);
    res.status(500).json({ error: "Steam login failed" });
  });
}
