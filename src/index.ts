import { config } from "dotenv";
import Stripe from "stripe";

import { app } from "./api";
import { connectToCloudinary } from "./utils/cloudinary.util";
import { getEnv } from "./utils/config";
import { connectToDB } from "./utils/db.util";
import logger from "./utils/logger";

if (getEnv().env != "production") config();

connectToDB();
connectToCloudinary();

export var stripe = new Stripe(getEnv().stripeSecretKey, {
  apiVersion: "2022-11-15",
});

(function startApp() {
  var port = getEnv().port;

  app.listen(port, function initApp() {
    logger.info(`API is available on http://localhost:${port}/api/v2`);
  });
})();
