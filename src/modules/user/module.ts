import {JwtTokenService } from "@shared/components/jwt";
import { TokenBlacklistService } from "@shared/components/token-blacklist";
import { UserHTTPService } from "./controller";
import { UserPrismaCommandRepository, UserPrismaQueryRepository, UserPrismaRepository } from "./repository/prisma-repo";
import { UserUseCase } from "./service";
import { appConfig } from "@shared/components/config";

export const setupUserModule = () => {
  const queryRepository = new UserPrismaQueryRepository();
  const commandRepository = new UserPrismaCommandRepository();

  const repository = new UserPrismaRepository(
    queryRepository,
    commandRepository
  );
  const blacklistService = new TokenBlacklistService();
  const jwtProvider = new JwtTokenService(
    appConfig.jwtSecret, 
    appConfig.auth.accessTokenExpiry, 
    appConfig.auth.refreshTokenExpiry, 
    blacklistService
  );
  const useCase = new UserUseCase(repository, jwtProvider);
  const httpService = new UserHTTPService(useCase);

  const router = httpService.getRoutes();
  return router;
};