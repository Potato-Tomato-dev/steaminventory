import { createServer } from "http";
import next from "next";
import { initializeSteamBot } from "./lib/bot.js"; // Ensure this is correctly imported

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// Start Steam Bot on Server Startup
initializeSteamBot();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(3000, () => {
    console.log("🚀 Next.js server running on http://localhost:3000");
  });
});
