import { IEventPublisher } from "@shared/interfaces";
import { appConfig } from "./config";
import { RedisPubSub } from "./redis-pubsub";
import { RabbitMQClient } from "./rabbitmq";
import { RabbitMQPubSub } from "./rabbitmq-pubsub";
import Logger from "@shared/ultils/logger";

export type PubSubType = 'redis' | 'rabbitmq';

export class EventPublisherFactory {
  public static async createPublisher(type?: PubSubType): Promise<IEventPublisher> {
    const pubsubType = type || appConfig.pubsub.type as PubSubType;
    
    Logger.info(`Initializing ${pubsubType} event publisher`);
    
    switch (pubsubType) {
      case 'redis':
        return RedisPubSub.getInstance();
        
      case 'rabbitmq':
        await RabbitMQClient.init(
          appConfig.rabbitmq.url,
          appConfig.rabbitmq.exchange,
          appConfig.rabbitmq.exchangeType
        );
        return RabbitMQPubSub.getInstance();
        
      default:
        throw new Error(`Unsupported pub/sub type: ${pubsubType}`);
    }
  }
}
