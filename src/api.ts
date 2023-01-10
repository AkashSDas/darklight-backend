import cookieParser from "cookie-parser";
import cors from "cors";
import { config } from "dotenv";
import express from "express";
import expressSession from "express-session";
import morgan from "morgan";

// Load env vars
if (process.env.NODE_ENV != "production") config();

/** Express app */
export var app = express();

// =====================================
// Middlewares
// =====================================

app.use(morgan("dev"));
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json()); // for parsing incoming data
app.use(express.urlencoded({ extended: true })); // parses incoming requests with urlencoded payloads

app.use(cookieParser()); // Parse Cookie header and populate req.cookies with an object keyed by the cookie names
app.use(
  expressSession({
    secret: process.env.COOKIE_SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
  })
);

// =====================================
// Routes
// =====================================

app.get("/api/v2/testing/test", function testController(_req, res) {
  res.status(200).json({ message: "Hello World!" });
});

app.use("/api/v2/auth", require("./routes/auth.route").router);

app.all("*", function handleUnknownRoutes(req, res) {
  return res.status(404).json({
    message: `Cannot find ${req.originalUrl} on this server!`,
  });
});
