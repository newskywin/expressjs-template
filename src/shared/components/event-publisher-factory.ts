import { IEventPublisher } from "@shared/interfaces";
import { appConfig } from "./config";
import { RedisClient } from "./redis";
import { RabbitMQClient } from "./rabbitmq";
import Logger from "@shared/ultils/logger";

export type PubSubType = 'redis' | 'rabbitmq';

export class EventPublisherFactory {
  public static async createPublisher(type?: PubSubType): Promise<IEventPublisher> {
    const pubsubType = type || appConfig.pubsub.type as PubSubType;
    
    Logger.info(`Initializing ${pubsubType} event publisher`);
    
    switch (pubsubType) {
      case 'redis':
        return RedisClient.getInstance();
        
      case 'rabbitmq':
        await RabbitMQClient.init(
          appConfig.rabbitmq.url,
          appConfig.rabbitmq.exchange,
          appConfig.rabbitmq.exchangeType
        );
        return RabbitMQClient.getInstance();
        
      default:
        throw new Error(`Unsupported pub/sub type: ${pubsubType}`);
    }
  }
}
