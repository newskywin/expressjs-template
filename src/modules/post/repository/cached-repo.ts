import { IPostRepository, IPostQueryRepository, IPostCommandRepository } from "../interfaces";
import { Post, PostCondDTO, UpdatePostDTO } from "../model";
import { Paginated, PagingDTO } from "@shared/model/paging";
import { ICacheService } from "@shared/interfaces/cache";
import { CachedPostQueryRepository } from "./cached-query-repo";
import { CachedPostCommandRepository } from "./cached-command-repo";
import { CacheKeyGenerator } from "@shared/ultils/cache-keys";
import { prisma } from "@shared/components/prisma";
import Logger from "@shared/ultils/logger";

export class CachedPostRepository implements IPostRepository {
  private queryRepo: CachedPostQueryRepository;
  private commandRepo: CachedPostCommandRepository;

  constructor(
    baseQueryRepo: IPostQueryRepository,
    baseCommandRepo: IPostCommandRepository,
    private readonly cacheService: ICacheService
  ) {
    this.queryRepo = new CachedPostQueryRepository(baseQueryRepo, cacheService);
    this.commandRepo = new CachedPostCommandRepository(baseCommandRepo, cacheService);
  }

  async findById(id: string): Promise<Post | null> {
    return this.queryRepo.findById(id);
  }

  async findByCond(condition: PostCondDTO): Promise<Post | null> {
    return this.queryRepo.findByCond(condition);
  }

  async list(cond: PostCondDTO, paging: PagingDTO): Promise<Paginated<Post>> {
    return this.queryRepo.list(cond, paging);
  }

  async listByIds(ids: string[]): Promise<Post[]> {
    return this.queryRepo.listByIds(ids);
  }

  async insert(data: Post): Promise<boolean> {
    return this.commandRepo.insert(data);
  }

  async update(id: string, dto: UpdatePostDTO): Promise<boolean> {
    return this.commandRepo.update(id, dto);
  }

  async delete(id: string): Promise<boolean> {
    return this.commandRepo.delete(id);
  }

  async increaseCount(id: string, field: string, step: number): Promise<boolean> {
    // Perform the actual database operation
    await prisma.posts.update({
      where: { id },
      data: { [field]: { increment: step } },
    });

    // Invalidate cache
    try {
      await this.cacheService.del(CacheKeyGenerator.postById(id));
      await this.cacheService.delPattern(CacheKeyGenerator.postListPattern());
      await this.cacheService.delPattern(CacheKeyGenerator.postIdsPattern());
      
      Logger.info(`Invalidated caches after increasing ${field} for post: ${id}`);
    } catch (error) {
      Logger.error(`Error invalidating cache for increaseCount: ${(error as Error).message}`);
    }
    
    return true;
  }

  async decreaseCount(id: string, field: string, step: number): Promise<boolean> {
    // Perform the actual database operation
    await prisma.posts.update({
      where: { id },
      data: { [field]: { decrement: step } },
    });

    // Invalidate cache
    try {
      await this.cacheService.del(CacheKeyGenerator.postById(id));
      await this.cacheService.delPattern(CacheKeyGenerator.postListPattern());
      await this.cacheService.delPattern(CacheKeyGenerator.postIdsPattern());
      
      Logger.info(`Invalidated caches after decreasing ${field} for post: ${id}`);
    } catch (error) {
      Logger.error(`Error invalidating cache for decreaseCount: ${(error as Error).message}`);
    }
    
    return true;
  }
}
