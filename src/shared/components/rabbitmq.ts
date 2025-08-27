import { IEventPublisher, EventHandler } from "@shared/interfaces";
import { AppEvent } from "@shared/model/event";
import Logger from "@shared/ultils/logger";
import * as amqp from "amqplib";
import { appConfig } from "./config";

export class RabbitMQClient implements IEventPublisher {
  private static instance: RabbitMQClient;
  private connection: any = null;
  private publishChannel: any = null;
  private subscribeChannels: Map<string, any> = new Map();
  private exchangeName: string;
  private exchangeType: string;

  private constructor(connectionUrl: string, exchangeName: string, exchangeType: string) {
    this.exchangeName = exchangeName;
    this.exchangeType = exchangeType;
  }

  public static async init(
    connectionUrl: string, 
    exchangeName: string = 'events', 
    exchangeType: string = 'topic'
  ) {
    if (!this.instance) {
      this.instance = new RabbitMQClient(connectionUrl, exchangeName, exchangeType);
      await this.instance._connect();
    }
  }

  public static getInstance(): RabbitMQClient {
    if (!this.instance) {
      throw new Error("RabbitMQClient instance not initialized");
    }
    return this.instance;
  }

  private async _connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(appConfig.rabbitmq.url);
      this.publishChannel = await this.connection.createChannel();
      
      await this.publishChannel.assertExchange(
        this.exchangeName, 
        this.exchangeType, 
        { durable: true }
      );
      
      Logger.success("Connected to RabbitMQ server");
    } catch (error) {
      Logger.error(`RabbitMQ connection error: ${(error as Error).message}`);
      throw error;
    }
  }

  public async publish<T>(event: AppEvent<T>): Promise<void> {
    try {
      if (!this.publishChannel) {
        throw new Error("RabbitMQ publish channel not initialized");
      }

      const routingKey = event.eventName;
      const message = JSON.stringify(event.plainObject());
      
      await this.publishChannel.publish(
        this.exchangeName,
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
      if (!this.connection) {
        throw new Error("RabbitMQ connection not initialized");
      }

      const channel = await this.connection.createChannel();
      await channel.assertExchange(this.exchangeName, this.exchangeType, { durable: true });
      
      const queueResult = await channel.assertQueue('', { 
        exclusive: true,
        autoDelete: true 
      });
      
      await channel.bindQueue(queueResult.queue, this.exchangeName, eventName);
      
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

      if (this.publishChannel) {
        await this.publishChannel.close();
      }

      if (this.connection) {
        await this.connection.close();
      }

      Logger.info("Disconnected from RabbitMQ server");
    } catch (error) {
      Logger.error(`RabbitMQ disconnect error: ${(error as Error).message}`);
    }
  }
}
