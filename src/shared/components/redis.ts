import Logger from "@shared/ultils/logger";
import { createClient, RedisClientType } from "redis";

export class RedisClient {
  private static instance: RedisClient;

  redisClient: RedisClientType;

  private constructor(connectionUrl: string) {
    const url = connectionUrl;
    this.redisClient = createClient({ url });
  }

  public static async init(connectionUrl: string) {
    if (!this.instance) {
      this.instance = new RedisClient(connectionUrl);
      await this.instance._connect();
    }
  }

  public static getInstance(): RedisClient {
    if (!this.instance) {
      throw new Error("RedisClient instance not initialized - please check it");
    }

    return this.instance;
  }

  private async _connect(): Promise<void> {
    try {
      await this.redisClient.connect();
      Logger.success("Connected to redis server");
    } catch (error) {
      Logger.error((error as Error).message);
    }
  }

  public getClient(): RedisClientType {
    return this.redisClient;
  }

  public async disconnect(): Promise<void> {
    await this.redisClient.disconnect();
    Logger.info("Disconnected redis server");
  }
}