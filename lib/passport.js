import passport from "passport";
import { Strategy as SteamStrategy } from "passport-steam";

const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI || "http://localhost:3000";

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

passport.use(
  new SteamStrategy(
    {
      returnURL: `${REDIRECT_URI}/api/auth/steam/return`,
      realm: `${REDIRECT_URI}`,
      apiKey: "4C36C0BA3B142CBC6238A471DF472BA2", // Replace with your Steam API Key
    },
    (identifier, profile, done) => {
      profile.identifier = identifier;
      return done(null, profile);
    }
  )
);

export default passport;
