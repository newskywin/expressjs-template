import { PrismaClient } from "@prisma/client";
import Logger from "@shared/ultils/logger";

export const prisma = new PrismaClient();

export const checkConnection = async () => {
  await prisma.$connect();
  Logger.success('Prisma - Database connected');
};