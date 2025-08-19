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
};