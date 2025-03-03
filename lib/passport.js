import passport from "passport";
import { Strategy as SteamStrategy } from "passport-steam";

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

passport.use(
  new SteamStrategy(
    {
      returnURL: "http://localhost:3000/api/auth/steam/return",
      realm: "http://localhost:3000/",
      apiKey: "4C36C0BA3B142CBC6238A471DF472BA2", // Replace with your Steam API Key
    },
    (identifier, profile, done) => {
      profile.identifier = identifier;
      return done(null, profile);
    }
  )
);

export default passport;
