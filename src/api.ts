import express from "express";

import { sendResponse } from "./utils/client-response";

/** Express app */
export var app = express();

// ==============================
// Middlewares
// ==============================

app.use(express.json()); // for parsing incoming data
app.use(express.urlencoded({ extended: true })); // parses incoming requests with urlencoded payloads

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
