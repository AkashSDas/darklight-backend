import cookieParser from "cookie-parser";
import cors from "cors";
import { config } from "dotenv";
import express from "express";
import expressSession from "express-session";
import morgan from "morgan";
import passport from "passport";
import swaggerUI from "swagger-ui-express";
import YAML from "yamljs";
import fileUpload from "express-fileupload";

if (process.env.NODE_ENV != "production") config();

// OAuth Passport Strategies. Should come after the config() call.
import "./_passport/google-signup.strategy";
import "./_passport/google-login.strategy";
import "./_passport/facebook-signup.strategy";
import "./_passport/facebook-login.strategy";
import "./_passport/twitter-signup.strategy";
import "./_passport/twitter-login.strategy";

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
app.use(fileUpload({ useTempFiles: true, tempFileDir: "/tmp/" }));
app.use(passport.initialize());
app.use(
  expressSession({
    secret: process.env.COOKIE_SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
  })
);
app.use(passport.session());

var swaggerDoc = YAML.load("./swagger.yml");
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDoc));

// ==============================
// Routes
// ==============================

app.get("/api/test", function testRoute(req, res) {
  res.status(200).json({ msg: "🌗 DarkLight back-end (RESTful)" });
});

// Version 2
app.use("/api/v2/test", require("./_route/test.route").router);
app.use("/api/v2/user", require("./_route/user.route").router);
app.use("/api/v2/auth", require("./_route/auth.route").router);
app.use("/api/v2/course", require("./_route/course.route").router);

app.all("*", function handleRemainingRoute(req, res) {
  return res.status(404).json({
    message: `Cannot find ${req.originalUrl} on this server!`,
  });
});
