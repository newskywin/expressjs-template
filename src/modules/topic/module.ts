import { TopicHttpService } from "./controller";
import { TopicInMemoryCommandRepository, TopicInMemoryQueryRepository, TopicInMemoryRepository, TopicPrismaCommandRepository, TopicPrismaQueryRepository, TopicPrismaRepository, TopicSequelizeCommandRepository, TopicSequelizeQueryRepository } from "./repository";
import { init } from "./repository/dto-sequelize";
import { TopicSequelizeRepository } from "./repository";
import { TopicUsecase } from "./service";
import { sequelize } from "../../shared/components/sequelize";
export const setupTopicModule = () => {
  // choose repository type:
  // const queryRepo = new TopicInMemoryQueryRepository();
  // const commandRepo = new TopicInMemoryCommandRepository();
  // const inMemoryRepo = new TopicInMemoryRepository(queryRepo,commandRepo);
  // const queryRepo = new TopicPrismaQueryRepository();
  // const commandRepo = new TopicPrismaCommandRepository();
  // const prismaRepo = new TopicPrismaRepository(queryRepo, commandRepo);
  init(sequelize);
  const queryRepo = new TopicSequelizeQueryRepository();
  const commandRepo = new TopicSequelizeCommandRepository();
  const sequelizeRepo = new TopicSequelizeRepository(queryRepo, commandRepo);
  const usecase = new TopicUsecase(sequelizeRepo);
  const httpService = new TopicHttpService(usecase);
  const router = httpService.getRoutes();

  return router;
}