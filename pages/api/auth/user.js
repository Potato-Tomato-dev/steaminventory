import nextConnect from "next-connect";
import session from "cookie-session";

const handler = nextConnect()
  .use(
    session({
      name: "session",
      keys: ["secret_key"], // Use the same key as in the Steam return handler
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    })
  )
  .get((req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ user: null });
    }
    res.json({ user: req.session.user });
  });

export default handler;
