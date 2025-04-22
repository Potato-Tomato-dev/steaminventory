import { Strategy as SteamStrategy } from "passport-steam";
import passport from "passport";
import nextConnect from "next-connect";
import session from "cookie-session";

// Setup session middleware
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI || "http://localhost:3000";
const auth = nextConnect()
  .use(
    session({
      name: "session",
      keys: ["secret_key"], // Change this to a secure random key
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    })
  )
  .use(passport.initialize())
  .use(passport.session());

passport.use(
  new SteamStrategy(
    {
      returnURL: `${REDIRECT_URI}/api/auth/steam/return`,
      realm: `${REDIRECT_URI}`,
      apiKey: "4C36C0BA3B142CBC6238A471DF472BA2", // Replace with your Steam API key
    },
    (identifier, profile, done) => {
      process.nextTick(() => {
        profile.identifier = identifier;
        return done(null, profile);
      });
    }
  )
);

// Serialize user
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

auth.get((req, res, next) => {
  passport.authenticate("steam", (err, user) => {
    if (err || !user) {
      return res.redirect("/"); // Redirect to home on failure
    }
    
    // Store user session
    req.session.user = user;

    // Redirect to /user after login
    res.redirect("/trade");
  })(req, res, next);
});

export default auth;
