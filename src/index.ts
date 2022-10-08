import { config } from "dotenv";

import { app } from "./api";
import { connectToDB } from "./utils/db";
import logger from "./utils/logger";

if (process.env.NODE_ENV != "production") config();

connectToDB();

var port = process.env.PORT || 5002;
app.listen(port, function initApp() {
  logger.info(`API is available on http://localhost:${port}/api`);
});
