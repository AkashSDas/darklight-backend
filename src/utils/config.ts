/** Get environment variables */
export function getEnv() {
  return {
    env: process.env.NODE_ENV as "development" | "production" | "test",
    mongodbURL: process.env.MONGODB_CONNECT_URL,
    cookieSessionSecret: process.env.COOKIE_SESSION_SECRET,
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
    accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
    refreshTokenExpiresInMs: Number(process.env.REFRESH_TOKEN_EXPIRES_IN_MS),
  };
}
