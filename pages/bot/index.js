const SteamUser = require("steam-user");
const TradeOfferManager = require("steam-tradeoffer-manager");

const client = new SteamUser();
const manager = new TradeOfferManager({
  steam: client,
  domain: "yourdomain.com",
  language: "en",
});

client.logOn({
  accountName: process.env.STEAM_BOT_USERNAME,
  password: process.env.STEAM_BOT_PASSWORD,
});

client.on("loggedOn", () => {
  console.log("Bot logged in!");
  client.setPersona(SteamUser.EPersonaState.Online);
});

manager.on("newOffer", (offer) => {
  if (offer.isOurOffer) return;
  offer.accept((err) => {
    if (err) console.log("Error accepting offer:", err);
    else console.log("Trade accepted!");
  });
});
