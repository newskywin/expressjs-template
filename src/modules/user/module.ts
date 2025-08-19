import { UserHTTPService } from "./controller";
import { UserPrismaCommandRepository, UserPrismaQueryRepository, UserPrismaRepository } from "./repository/prisma-repo";
import { UserUseCase } from "./service";

export const setupUserModule = () => {
  const queryRepository = new UserPrismaQueryRepository();
  const commandRepository = new UserPrismaCommandRepository();

  const repository = new UserPrismaRepository(
    queryRepository,
    commandRepository
  );
  const useCase = new UserUseCase(repository);
  const httpService = new UserHTTPService(useCase);

  const router = httpService.getRoutes();
  return router;
};