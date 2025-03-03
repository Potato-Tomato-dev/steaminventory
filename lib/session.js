import session from "express-session";

export default function sessionMiddleware(req, res, next) {
  session({
    secret: "your_secret_key", // Change this to a strong secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to `true` if using HTTPS
  })(req, res, next);
}
