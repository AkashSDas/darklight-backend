import { config } from "dotenv";

import { app } from "./api";
import { connectToCloudinary } from "./utils/cloudinary.util";
import { connectToDB } from "./utils/db.util";
import logger from "./utils/logger.util";

if (process.env.NODE_ENV != "production") config();

connectToDB();
connectToCloudinary();

var port = process.env.PORT || 5002;
app.listen(port, function initApp() {
  logger.info(`API is available on http://localhost:${port}/api`);
});
