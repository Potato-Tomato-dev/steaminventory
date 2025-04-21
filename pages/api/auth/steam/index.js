import nc from "next-connect";
import passport from "../../../../lib/passport";
import sessionMiddleware from "../../../../lib/session";

const STEAM_API_KEY = "4C36C0BA3B142CBC6238A471DF472BA2"; // Replace with your actual Steam API key

const handler = nc();

handler.use(sessionMiddleware);
handler.use(passport.initialize());
handler.use(passport.session());

handler.get(passport.authenticate("steam"));

handler.get("/return", (req, res, next) => {
  passport.authenticate("steam", { failureRedirect: "/" }, async (err, user) => {
    if (err) return next(err);
    if (!user) return res.redirect("/");

    // Extract the username (Vanity URL) from the user profile
    const username = user._json.personaname; // Steam username

    try {
      // Call the Steam API to resolve the Vanity URL to a Steam ID
      const response = await fetch(
        `http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${STEAM_API_KEY}&vanityurl=${username}`
      );
      const data = await response.json();

      if (data.response && data.response.success === 1) {
        req.session.steamId = data.response.steamid; // Store Steam ID in session
      } else {
        console.error("Failed to resolve Steam ID");
      }
    } catch (error) {
      console.error("Error fetching Steam ID:", error);
    }

    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.redirect("/trade"); // Redirect to user page after login
    });
  })(req, res, next);
});

export default handler;
