import { config } from "dotenv";

import { app } from "./api";
import { connectToCloudinary } from "./_utils/cloudinary.util";
import { connectToDB } from "./_utils/db.util";
import logger from "./_utils/logger.util";

if (process.env.NODE_ENV != "production") config();

connectToDB();
connectToCloudinary();

var port = process.env.PORT || 5002;
app.listen(port, function initApp() {
  logger.info(`API is available on http://localhost:${port}/api`);
});
