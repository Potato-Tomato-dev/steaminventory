import SteamUser from "steam-user";
import TradeOfferManager from "steam-tradeoffer-manager";
import SteamCommunity from "steamcommunity";
import dotenv from "dotenv";

dotenv.config();

const client = new SteamUser();
const manager = new TradeOfferManager({
  steam: client,
  language: "en",
});
const community = new SteamCommunity();

let isLoggedIn = false;

// Function to initialize Steam client
const initializeSteamBot = () => {
  if (isLoggedIn) return;

  client.logOn({
    accountName: process.env.STEAM_USERNAME,
    password: process.env.STEAM_PASSWORD,
    twoFactorCode: process.env.STEAM_TOTP || "",
  });

  client.once("loggedOn", () => {
    console.log("✅ Bot logged into Steam!");
    isLoggedIn = true;
    client.setPersona(SteamUser.EPersonaState.Online);
  });

  client.once("webSession", (sessionID, cookies) => {
    console.log("✅ Got web session!");
    manager.setCookies(cookies, (err) => {
      if (err) {
        console.error("❌ Failed to set cookies:", err);
        return;
      }
      console.log("✅ Trade Manager is ready!");
    });
  });

  client.on("error", (err) => {
    console.error("❌ Steam login failed:", err);
  });

  community.on("sessionExpired", () => {
    console.log("⚠️ Session expired. Refreshing session...");
    client.webLogOn();
  });
};

// Call the function to log in immediately
initializeSteamBot();

export { client, manager };
