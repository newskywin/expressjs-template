import { CacheConfig } from '@shared/interfaces';
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
  auth: {
    accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
  },
  rpc: {
    introspectUrl: process.env.VERIFY_TOKEN_URL || `http://localhost:${port}/v1/rpc/introspect`,
    topicServiceURL: process.env.TOPIC_SERVICE_URL || `http://localhost:${port}/v1`,
    postLikeServiceURL: process.env.POST_LIKE_SERVICE_URL || `http://localhost:${port}/v1`,
    postSavedServiceURL: process.env.POST_SAVED_SERVICE_URL || `http://localhost:${port}/v1`,
    userServiceURL: process.env.USER_SERVICE_URL || `http://localhost:${port}/v1`,
  },
  envName: process.env.NODE_ENV,
  pubsub: {
    type: process.env.PUBSUB_TYPE || 'redis',
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    url: process.env.REDIS_URL
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    exchange: process.env.RABBITMQ_EXCHANGE || 'events',
    exchangeType: process.env.RABBITMQ_EXCHANGE_TYPE || 'topic',
  },
};

export const cacheConfig: CacheConfig = {
  enabled: process.env.CACHE_ENABLED === 'true' || true,
  prefix: process.env.CACHE_PREFIX || 'app:v1:',
  ttl: {
    entity: parseInt(process.env.REDIS_CACHE_TTL_ENTITY || '3600'),
    list: parseInt(process.env.REDIS_CACHE_TTL_LIST || '900'),
    bulk: parseInt(process.env.REDIS_CACHE_TTL_BULK || '1800'),
    search: parseInt(process.env.REDIS_CACHE_TTL_SEARCH || '600'),
  },
};
