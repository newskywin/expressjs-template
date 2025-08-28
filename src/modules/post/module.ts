import { ServiceContext } from "@shared/interfaces";
import { PostInMemoryCommandRepository, PostInMemoryQueryRepository, PostInMemoryRepository, PostLikedRPC, PostSavedRPC, TopicQueryRPC } from "./repository";
import { appConfig } from "@shared/components/config";
import { UserRPCClient } from "@shared/rpc/user-rpc";
import { PostUsecase } from "./service";
import { PostHttpService } from "./controller";
import { PostPrismaCommandRepository, PostPrismaQueryRepository, PostPrismaRepository } from "./repository";
import { PostSequelizeCommandRepository, PostSequelizeQueryRepository, PostSequelizeRepository } from "./repository";
import { CachedPostRepository } from "./repository/cached-repo";
import { RedisCacheService } from "@shared/components/cache";
import { init } from "./repository/dto-sequelize";
import { sequelize } from "@shared/components/sequelize";

export const setupPostModule = (sctx: ServiceContext) => {
  const cacheService = new RedisCacheService();
  
  // CHOOSE REPOSITORY TYPE: one of them
  // // use in-memory-repo
  // const queryRepo = new PostInMemoryQueryRepository();
  // const commandRepo = new PostInMemoryCommandRepository();
  // const baseRepository = new PostInMemoryRepository(queryRepo, commandRepo);

  // // use prisma-repo
  const queryRepo = new PostPrismaQueryRepository();
  const commandRepo = new PostPrismaCommandRepository();
  const baseRepository = new PostPrismaRepository(queryRepo, commandRepo);

  // use sequelize-repo
  // init(sequelize);
  // const queryRepo = new PostSequelizeQueryRepository();
  // const commandRepo = new PostSequelizeCommandRepository();
  // const baseRepository = new PostSequelizeRepository(queryRepo, commandRepo);

  // Create cached repository wrapper
  const repository = new CachedPostRepository(queryRepo, commandRepo, cacheService);

  const authRPC = new UserRPCClient(appConfig.rpc.userServiceURL);
  const topicRPC = new TopicQueryRPC(appConfig.rpc.topicServiceURL);
  const postLikeRPC = new PostLikedRPC(appConfig.rpc.postLikeServiceURL);
  const postSavedRPC = new PostSavedRPC(appConfig.rpc.postSavedServiceURL);
  const usecase = new PostUsecase(repository, topicRPC, authRPC, sctx.eventPublisher);
  const httpService = new PostHttpService(
    usecase,
    authRPC,
    topicRPC,
    postLikeRPC,
    postSavedRPC
  );

  return httpService.getRoutes(sctx.mdlFactory);
};