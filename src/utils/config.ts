/** Get environment variables */
export function getEnv() {
  return {
    env: process.env.NODE_ENV as "development" | "production" | "test",
    mongodbURL: process.env.MONGODB_CONNECT_URL,
  };
}
