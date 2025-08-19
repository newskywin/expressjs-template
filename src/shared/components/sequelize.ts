import { Sequelize } from "sequelize";
import { appConfig } from "./config";
import Logger from "@shared/ultils/logger";

Logger.success("Connecting to Sequelize database...");
export const sequelize = new Sequelize(appConfig.db.dsn, {
  pool: {
    max: 20,
    min: 2,
    acquire: 30000,
    idle: 60000,
  },
});
