import fs from "fs"
import path from "path"
import { promisify } from "util"

const writeFileAsync = promisify(fs.writeFile)
const readFileAsync = promisify(fs.readFile)
const mkdirAsync = promisify(fs.mkdir)

// Directory for storing session data
const SESSION_DIR = path.join(process.cwd(), ".steam-sessions")
const SESSION_FILE = path.join(SESSION_DIR, "session.json")

// Ensure the session directory exists
async function ensureSessionDir() {
  try {
    if (!fs.existsSync(SESSION_DIR)) {
      await mkdirAsync(SESSION_DIR, { recursive: true })
    }
  } catch (error) {
    console.error("Failed to create session directory:", error)
  }
}

// Save session data to file
export async function saveSession(sessionData) {
  try {
    await ensureSessionDir()
    await writeFileAsync(SESSION_FILE, JSON.stringify(sessionData, null, 2))
    console.log("✅ Session data saved successfully")
    return true
  } catch (error) {
    console.error("❌ Failed to save session data:", error)
    return false
  }
}

// Load session data from file
export async function loadSession() {
  try {
    await ensureSessionDir()

    if (!fs.existsSync(SESSION_FILE)) {
      console.log("⚠️ No saved session found")
      return null
    }

    const data = await readFileAsync(SESSION_FILE, "utf8")
    const sessionData = JSON.parse(data)
    console.log("✅ Session data loaded successfully")
    return sessionData
  } catch (error) {
    console.error("❌ Failed to load session data:", error)
    return null
  }
}

// Clear saved session
export async function clearSession() {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      fs.unlinkSync(SESSION_FILE)
      console.log("✅ Session data cleared")
    }
    return true
  } catch (error) {
    console.error("❌ Failed to clear session data:", error)
    return false
  }
}
