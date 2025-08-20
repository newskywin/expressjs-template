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
  }
};