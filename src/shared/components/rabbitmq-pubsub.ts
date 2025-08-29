import { EventHandler, IEventPublisher } from "@shared/interfaces";
import { AppEvent } from "@shared/model/event";
import Logger from "@shared/ultils/logger";
import { RabbitMQClient } from "./rabbitmq";

export class RabbitMQPubSub implements IEventPublisher {
  private static instance: RabbitMQPubSub;
  private subscribeChannels: Map<string, any> = new Map();

  private constructor(private rabbitMQClient: RabbitMQClient) {}

  public static getInstance(): RabbitMQPubSub {
    if (!this.instance) {
      const rabbitMQClient = RabbitMQClient.getInstance();
      this.instance = new RabbitMQPubSub(rabbitMQClient);
    }

    return this.instance;
  }

  public async publish<T>(event: AppEvent<T>): Promise<void> {
    try {
      const publishChannel = this.rabbitMQClient.getPublishChannel();
      if (!publishChannel) {
        throw new Error("RabbitMQ publish channel not initialized");
      }

      const routingKey = event.eventName;
      const message = JSON.stringify(event.plainObject());
      const exchangeName = this.rabbitMQClient.getExchangeName();
      
      await publishChannel.publish(
        exchangeName,
        routingKey,
        Buffer.from(message),
        {
          persistent: true,
          timestamp: Date.now(),
          messageId: event.id,
        }
      );
      
      Logger.info(`Published event: ${event.eventName}`);
    } catch (err) {
      Logger.error(`RabbitMQ publish error: ${(err as Error).message}`);
      throw err;
    }
  }

  public async subscribe(eventName: string, handler: EventHandler): Promise<void> {
    try {
      const connection = this.rabbitMQClient.getConnection();
      if (!connection) {
        throw new Error("RabbitMQ connection not initialized");
      }

      const channel = await connection.createChannel();
      const exchangeName = this.rabbitMQClient.getExchangeName();
      const exchangeType = this.rabbitMQClient.getExchangeType();
      
      await channel.assertExchange(exchangeName, exchangeType, { durable: true });
      
      const queueResult = await channel.assertQueue('', { 
        exclusive: true,
        autoDelete: true 
      });
      
      await channel.bindQueue(queueResult.queue, exchangeName, eventName);
      
      await channel.consume(queueResult.queue, (msg: any) => {
        if (msg) {
          const content = msg.content.toString();
          handler(content);
          channel.ack(msg);
        }
      });
      
      this.subscribeChannels.set(eventName, channel);
      Logger.info(`Subscribed to event: ${eventName}`);
    } catch (error) {
      Logger.error(`RabbitMQ subscribe error: ${(error as Error).message}`);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      for (const [eventName, channel] of this.subscribeChannels) {
        await channel.close();
      }
      this.subscribeChannels.clear();
      
      Logger.info("Disconnected RabbitMQ PubSub subscribers");
    } catch (error) {
      Logger.error(`RabbitMQ PubSub disconnect error: ${(error as Error).message}`);
    }
  }
}
