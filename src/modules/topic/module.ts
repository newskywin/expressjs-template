import { TopicHttpService } from "./controller";
import { TopicInMemoryRepository, TopicPrismaRepository } from "./repository";
import { init } from "./repository/dto-sequelize";
import { TopicSequelizeRepository } from "./repository";
import { TopicUsecase } from "./service";
import { sequelize } from "../../shared/components/sequelize";
export const setupTopicModule = () => {
  // choose repository type:
  // const inMemoryRepo = new TopicInMemoryRepository();
  // const prismaRepo = new TopicPrismaRepository
  init(sequelize);
  const sequelizeRepo = new TopicSequelizeRepository();
  const usecase = new TopicUsecase(sequelizeRepo);
  const httpService = new TopicHttpService(usecase);
  const router = httpService.getRoutes();

  return router;
}