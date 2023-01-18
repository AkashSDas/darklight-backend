import "./passport";

import cookieParser from "cookie-parser";
import cors from "cors";
import { config } from "dotenv";
import express from "express";
import expressSession from "express-session";
import morgan from "morgan";
import passport from "passport";

import { getEnv } from "./utils/config";

// Load env vars
if (getEnv().env != "production") config();

/** Express app */
export var app = express();

// =====================================
// Middlewares
// =====================================

app.use(morgan("dev"));
app.use(cors({ origin: getEnv().frontendURL, credentials: true }));
app.use(express.json()); // for parsing incoming data
app.use(express.urlencoded({ extended: true })); // parses incoming requests with urlencoded payloads

app.use(cookieParser()); // Parse Cookie header and populate req.cookies with an object keyed by the cookie names
app.use(
  expressSession({
    secret: getEnv().cookieSessionSecret,
    resave: true,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

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
