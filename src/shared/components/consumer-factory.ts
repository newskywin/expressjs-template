import { appConfig } from "@shared/components/config";
import { RedisTopicConsumer } from "@modules/topic/controller/redis-consumer";
import { RabbitMQTopicConsumer } from "@modules/topic/controller/rabbitmq-consumer";
import { ITopicRepository } from "@modules/topic/interfaces";
import Logger from "@shared/ultils/logger";

export interface ITopicConsumer {
  subcriber(): void;
}

export class ConsumerFactory {
  public static createTopicConsumer(
    repository: ITopicRepository,
    pubsubType?: string
  ): ITopicConsumer {
    const type = pubsubType || appConfig.pubsub.type;
    
    Logger.info(`Creating ${type} topic consumer`);
    
    switch (type) {
      case 'redis':
        return new RedisTopicConsumer(repository);
        
      case 'rabbitmq':
        return new RabbitMQTopicConsumer(repository);
        
      default:
        throw new Error(`Unsupported consumer type: ${type}`);
    }
  }
}
