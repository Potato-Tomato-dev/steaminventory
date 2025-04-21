import { initializeSteamBot, getBotStatus } from "./index"

export default async function handler(req, res) {
  // Only allow POST requests for authentication
  if (req.method === "POST") {
    const { steamGuardCode, adminPassword } = req.body

    // Basic security check - require an admin password that matches the environment variable
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(403).json({ success: false, message: "Unauthorized access" })
    }

    try {
      const result = await initializeSteamBot(steamGuardCode)
      return res.status(result.success ? 200 : 400).json(result)
    } catch (error) {
      return res.status(500).json({ success: false, message: `Server error: ${error.message}` })
    }
  }
  // GET request to check status
  else if (req.method === "GET") {
    const status = getBotStatus()
    return res.status(200).json(status)
  }

  // Method not allowed
  return res.status(405).json({ success: false, message: "Method not allowed" })
}
