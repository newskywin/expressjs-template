import { 
  EvtPostCreated, 
  EvtPostDeleted, 
  PostCreatedEvent, 
  PostDeletedEvent 
} from "@shared/event/topic.evt";
import { ITopicRepository } from "../interfaces";
import { RabbitMQClient } from "@shared/components/rabbitmq";
import Logger from "@shared/ultils/logger";

export class RabbitMQTopicConsumer {
  constructor(private readonly repo: ITopicRepository) {}

  async handledPostCreated(evt: PostCreatedEvent) {
    try {
      await this.repo.increaseTopicPostCount(evt.payload.topicId, "postCount", 1);
      Logger.info(`Handled PostCreated event for topic: ${evt.payload.topicId}`);
    } catch (error) {
      Logger.error(`Error handling PostCreated event: ${(error as Error).message}`);
    }
  }

  async handledPostDeleted(evt: PostDeletedEvent) {
    try {
      await this.repo.decreaseTopicPostCount(evt.payload.topicId, "postCount", 1);
      Logger.info(`Handled PostDeleted event for topic: ${evt.payload.topicId}`);
    } catch (error) {
      Logger.error(`Error handling PostDeleted event: ${(error as Error).message}`);
    }
  }

  subcriber() {
    const rabbitmqClient = RabbitMQClient.getInstance();
    
    rabbitmqClient.subscribe(EvtPostCreated, (msg: string) => {
      try {
        const data = JSON.parse(msg);
        const evt = PostCreatedEvent.from(data);
        this.handledPostCreated(evt);
      } catch (error) {
        Logger.error(`Error processing PostCreated message: ${(error as Error).message}`);
      }
    });

    rabbitmqClient.subscribe(EvtPostDeleted, (msg: string) => {
      try {
        const data = JSON.parse(msg);
        const evt = PostDeletedEvent.from(data);
        this.handledPostDeleted(evt);
      } catch (error) {
        Logger.error(`Error processing PostDeleted message: ${(error as Error).message}`);
      }
    });
    
    Logger.info("RabbitMQ topic consumer initialized and subscribed to events");
  }
}
