import { TopicHttpService } from "./controller";
import { TopicInMemoryCommandRepository, TopicInMemoryQueryRepository, TopicInMemoryRepository, TopicPrismaCommandRepository, TopicPrismaQueryRepository, TopicPrismaRepository, TopicSequelizeCommandRepository, TopicSequelizeQueryRepository } from "./repository";
import { init } from "./repository/dto-sequelize";
import { TopicSequelizeRepository } from "./repository";
import { TopicUsecase } from "./service";
import { sequelize } from "@shared/components/sequelize";
import { ServiceContext } from "@shared/interfaces";
import { RedisTopicConsumer } from "./controller/redis-consumer";
import { ConsumerFactory } from "@shared/components/consumer-factory";
import { appConfig } from "@shared/components/config";
import Logger from "@shared/ultils/logger";
export const setupTopicModule = (sctx: ServiceContext) => {
  // CHOOSE REPOSITORY TYPE: one of them
  // use in-memory-repo
  // const queryRepo = new TopicInMemoryQueryRepository();
  // const commandRepo = new TopicInMemoryCommandRepository();
  // const repository = new TopicInMemoryRepository(queryRepo,commandRepo);

  // use prisma-repo
  // const queryRepo = new TopicPrismaQueryRepository();
  // const commandRepo = new TopicPrismaCommandRepository();
  // const repository = new TopicPrismaRepository(queryRepo, commandRepo);

  // use sequelize-repo
  init(sequelize);
  const queryRepo = new TopicSequelizeQueryRepository();
  const commandRepo = new TopicSequelizeCommandRepository();
  const repository = new TopicSequelizeRepository(queryRepo, commandRepo);
  
  const usecase = new TopicUsecase(repository);
  const httpService = new TopicHttpService(usecase);
  const router = httpService.getRoutes(sctx.mdlFactory);

  return router;
}

export const setupTopicEventConsumer = async (sctx: ServiceContext) => {
  const queryRepo = new TopicPrismaQueryRepository();
  const commandRepo = new TopicPrismaCommandRepository();
  const repository = new TopicPrismaRepository(queryRepo, commandRepo);
  
  const consumer = ConsumerFactory.createTopicConsumer(repository);
  
  consumer.subcriber();
  
  Logger.info(`Topic event consumer initialized for: ${appConfig.pubsub.type}`);
};

