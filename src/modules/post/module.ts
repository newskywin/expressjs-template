import { ServiceContext } from "@shared/interfaces";
import { PostInMemoryCommandRepository, PostInMemoryQueryRepository, PostInMemoryRepository, PostLikedRPC, PostSavedRPC, TopicQueryRPC } from "./repository";
import { appConfig } from "@shared/components/config";
import { UserRPCClient } from "@shared/rpc/user-rpc";
import { PostUsecase } from "./service";
import { PostHttpService } from "./controller";
import { PostPrismaCommandRepository, PostPrismaQueryRepository, PostPrismaRepository } from "./repository";
import { PostSequelizeCommandRepository, PostSequelizeQueryRepository, PostSequelizeRepository } from "./repository";
import { init } from "./repository/dto-sequelize";
import { sequelize } from "@shared/components/sequelize";

export const setupPostModule = (sctx: ServiceContext) => {
  // CHOOSE REPOSITORY TYPE: one of them
  // // use in-memory-repo
  // const queryRepo = new PostInMemoryQueryRepository();
  // const commandRepo = new PostInMemoryCommandRepository();
  // const repository = new PostInMemoryRepository(queryRepo, commandRepo);

  // // use prisma-repo
  const queryRepo = new PostPrismaQueryRepository();
  const commandRepo = new PostPrismaCommandRepository();
  const repository = new PostPrismaRepository(queryRepo, commandRepo);

  // use sequelize-repo
  // init(sequelize);
  // const queryRepo = new PostSequelizeQueryRepository();
  // const commandRepo = new PostSequelizeCommandRepository();
  // const repository = new PostSequelizeRepository(queryRepo, commandRepo);

  const authRPC = new UserRPCClient(appConfig.rpc.userServiceURL);
  const topicRPC = new TopicQueryRPC(appConfig.rpc.topicServiceURL);
  const postLikeRPC = new PostLikedRPC(appConfig.rpc.postLikeServiceURL);
  const postSavedRPC = new PostSavedRPC(appConfig.rpc.postSavedServiceURL);
  const usecase = new PostUsecase(repository, topicRPC, authRPC);
  const httpService = new PostHttpService(
    usecase,
    authRPC,
    topicRPC,
    postLikeRPC,
    postSavedRPC
  );

  return httpService.getRoutes(sctx.mdlFactory);
};