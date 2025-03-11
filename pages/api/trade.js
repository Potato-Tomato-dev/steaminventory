export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const itemId = 41091967445;
    const { steamId, tradeUrl, items } = req.body;
  
    if (!steamId || !tradeUrl || !itemId) {
      return res.status(400).json({ error: "Missing trade details" });
    }
  
    try {
      // Build trade offer URL
      const offerUrl = `${tradeUrl}&partner=${steamId}&token=YOUR_TRADE_TOKEN`;
  
      // Send trade (this requires a Steam bot implementation)
      // Example: Call a backend bot that sends the trade
        // await sendTradeOffer(steamId, items);
        console.log(offerUrl);
      res.json({ success: true, tradeUrl: offerUrl });
    } catch (error) {
      res.status(500).json({ error: "Trade request failed" });
    }
  }
  