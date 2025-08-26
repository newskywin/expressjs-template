import dotenv from 'dotenv';
dotenv.config({
});

const port = process.env.PORT || '3456';

export const appConfig = {
  port,
  db: {
    dsn: process.env.DATABASE_URL || "",
  },
  jwtSecret: process.env.JWT_SECRET_KEY || 'NewSkyWin',
  rpc: {
    introspectUrl: process.env.VERIFY_TOKEN_URL || `http://localhost:${port}/v1/rpc/introspect`,
    topicServiceURL: process.env.TOPIC_SERVICE_URL || `http://localhost:${port}/v1`,
    postLikeServiceURL: process.env.POST_LIKE_SERVICE_URL || `http://localhost:${port}/v1`,
    postSavedServiceURL: process.env.POST_SAVED_SERVICE_URL || `http://localhost:${port}/v1`,
    userServiceURL: process.env.USER_SERVICE_URL || `http://localhost:${port}/v1`,
  },
  envName: process.env.NODE_ENV,
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    url: process.env.REDIS_URL
  },
};