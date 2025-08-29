import { EventHandler, IEventPublisher } from "@shared/interfaces";
import { AppEvent } from "@shared/model/event";
import Logger from "@shared/ultils/logger";
import { RedisClientType } from "redis";
import { appConfig } from "./config";
import { RedisClient } from "./redis";

export class RedisPubSub implements IEventPublisher {
  private static instance: RedisPubSub;
  private subscriberMap: Record<string, RedisClientType[]> = {};

  private constructor(private redisClient: RedisClient) {}

  public static getInstance(): RedisPubSub {
    if (!this.instance) {
      const redisClient = RedisClient.getInstance();
      this.instance = new RedisPubSub(redisClient);
    }

    return this.instance;
  }

  public async publish<T>(event: AppEvent<T>): Promise<void> {
    try {
      await this.redisClient.getClient().publish(
        event.eventName,
        JSON.stringify(event.plainObject())
      );
    } catch (err) {
      Logger.error((err as Error).message);
    }
  }

  public async subscribe(eventName: string, handler: EventHandler): Promise<void> {
    try {
      const subscriber = this.redisClient.getClient().duplicate();
      await subscriber.connect();
      await subscriber.subscribe(eventName, handler);

      const subs = this.subscriberMap[eventName] || [];
      this.subscriberMap[eventName] = [...subs, subscriber];
    } catch (error) {
      appConfig.envName !== "production" && console.error(error);
      Logger.error((error as Error).message);
    }
  }

  public async disconnect(): Promise<void> {
    for (const eventName in this.subscriberMap) {
      const subscribers = this.subscriberMap[eventName];
      for (const subscriber of subscribers) {
        await subscriber.disconnect();
      }
    }
    this.subscriberMap = {};
    
    Logger.info("Disconnected Redis PubSub subscribers");
  }
}
