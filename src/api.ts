import cors from "cors";
import { config } from "dotenv";
import express from "express";
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

// =====================================
// Routes
// =====================================

app.get("/api/v2/testing/test", function testController(_req, res) {
  res.status(200).json({ message: "Hello World!" });
});

app.all("*", function handleUnknownRoutes(req, res) {
  return res.status(404).json({
    message: `Cannot find ${req.originalUrl} on this server!`,
  });
});
