export default async function handler(req, res) {
  const { steamId, game } = req.query;

  if (!steamId) {
    return res.status(400).json({ error: "Missing Steam ID" });
  }

  const appId = game === "cs2" ? 730 : game === "dota2" ? 570 : null;
  if (!appId) {
    return res.status(400).json({ error: "Invalid game" });
  }

  try {
    const response = await fetch(
      `https://steamcommunity.com/inventory/${steamId}/${appId}/2?l=english&count=500`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0", // Helps prevent bot detection
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch inventory" });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
