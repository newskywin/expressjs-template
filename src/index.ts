import "module-alias/register";
import app from './app';
import { NextFunction, Request, Response } from 'express';
import { appConfig } from "@shared/components/config";
import { responseErr } from "@shared/ultils/error";
import Logger from "@shared/ultils/logger";
import { setupTopicModule, setupTopicEventConsumer } from "@modules/topic/module";
import { checkConnection } from "@shared/components/prisma";
import { setupUserModule } from "@modules/user/module";
import { TokenIntrospectRPCClient } from "@shared/rpc/verify-token";
import { setupMiddlewares } from "@shared/middleware";
import { ServiceContext } from "@shared/interfaces";
import { setupPostModule } from "@modules/post/module";
import { EventPublisherFactory } from "@shared/components/event-publisher-factory";
import { createServer } from "http";
import { RedisClient } from "@shared/components/redis";
async function bootServer(port: number) {

  try {
    await RedisClient.init(appConfig.redis.url as string);
    const eventPublisher = await EventPublisherFactory.createPublisher();

    const introspector = new TokenIntrospectRPCClient(appConfig.rpc.introspectUrl);
    const MdlFactory = setupMiddlewares(introspector);

    const serviceCtx: ServiceContext = {
      mdlFactory: MdlFactory,
      eventPublisher: eventPublisher,
    };

    // error handling
    await checkConnection();
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      responseErr(err, res);
      return next();
    });

    const topicModule = setupTopicModule(serviceCtx);
    const postModule = setupPostModule(serviceCtx);
    const userModule = setupUserModule(MdlFactory);
    app.use("/v1", userModule);
    app.use('/v1', topicModule);
    app.use('/v1', postModule);

    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      responseErr(err, res);
      return next();
    });
    
    await setupTopicEventConsumer(serviceCtx);

    const server = createServer(app);
    server.listen(port, () => {
      Logger.success(`Server is running on port ${port}`);
    });
  } catch (e) {
    Logger.error(`Failed to start server: ${(e as Error).message}`);
    process.exit(1);
  }
}

const port = parseInt(appConfig.port);
bootServer(port);