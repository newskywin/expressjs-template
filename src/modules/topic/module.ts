import { TopicHttpService } from "./controller";
import { TopicInMemoryCommandRepository, TopicInMemoryQueryRepository, TopicInMemoryRepository, TopicPrismaCommandRepository, TopicPrismaQueryRepository, TopicPrismaRepository, TopicSequelizeCommandRepository, TopicSequelizeQueryRepository } from "./repository";
import { init } from "./repository/dto-sequelize";
import { TopicSequelizeRepository } from "./repository";
import { TopicUsecase } from "./service";
import { sequelize } from "@shared/components/sequelize";
import { ServiceContext } from "@shared/interfaces";
import { RedisTopicConsumer } from "./controller/redis-consumer";
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

export const setupTopicRedisConsumer = (sctx: ServiceContext) => {
  // we can choose orther Type of repo (in-memory, sequelize, prisma)
  const queryRepo = new TopicPrismaQueryRepository();
  const commandRepo = new TopicPrismaCommandRepository();
  const repository = new TopicPrismaRepository(queryRepo, commandRepo);
  const redisConsumer = new RedisTopicConsumer(repository);
  redisConsumer.subcriber();
};