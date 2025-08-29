import Logger from "@shared/ultils/logger";
import * as amqp from "amqplib";
import { appConfig } from "./config";

export class RabbitMQClient {
  private static instance: RabbitMQClient;
  private connection: any = null;
  private publishChannel: any = null;
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

  public getConnection(): any {
    return this.connection;
  }

  public getPublishChannel(): any {
    return this.publishChannel;
  }

  public getExchangeName(): string {
    return this.exchangeName;
  }

  public getExchangeType(): string {
    return this.exchangeType;
  }

  public async disconnect(): Promise<void> {
    try {
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
