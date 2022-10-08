import { connect } from "mongoose";

import logger from "./logger";

export async function connectToDB() {
  try {
    await connect(process.env.MONGODB_CONNECT_URL);
    logger.info("Connected to MongoDB Atlas");
  } catch (error) {
    logger.error(`Couldn't connect to MongoDB Atlas\nError: ${error}`);
    process.exit(1);
  }
}
