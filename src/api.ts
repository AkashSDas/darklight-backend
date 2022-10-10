import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import expressSession from "express-session";
import morgan from "morgan";
import passport from "passport";

import { sendResponse } from "./utils/client-response";

/** Express app */
export var app = express();

// ==============================
// Middlewares
// ==============================

app.use(morgan("tiny")); // Log requests to the console
app.use(cors({ origin: process.env.FRONTEND_BASE_URL, credentials: true })); // Enable CORS
app.use(cookieParser()); // Parse Cookie header and populate req.cookies with an object keyed by the cookie names
app.use(express.json()); // for parsing incoming data
app.use(express.urlencoded({ extended: true })); // parses incoming requests with urlencoded payloads
app.use(passport.initialize());
app.use(
  expressSession({
    secret: process.env.COOKIE_SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
  })
);
app.use(passport.session());

// ==============================
// Routes
// ==============================

app.get("/api/test", function testRoute(req, res) {
  res.status(200).json({ msg: "🌗 DarkLight back-end (RESTful)" });
});

app.use("/api/auth", require("./routes/auth.route").router);

app.all("*", function handleRemainingRoute(req, res) {
  sendResponse(res, {
    status: 404,
    msg: `Cannot find ${req.originalUrl} on this server!`,
  });
});
