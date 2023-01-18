import { connect } from "mongoose";

import { getEnv } from "./config";
import logger from "./logger";

export async function connectToDB() {
  try {
    await connect(getEnv().mongodbURL);
    logger.info("Connected to MongoDB Atlas");
  } catch (error) {
    logger.error(`Couldn't connect to MongoDB Atlas\nError: ${error}`);
    process.exit(1);
  }
}
