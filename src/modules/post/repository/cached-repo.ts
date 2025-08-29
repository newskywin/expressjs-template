import { IPostRepository, IPostQueryRepository, IPostCommandRepository } from "../interfaces";
import { Post, PostCondDTO, UpdatePostDTO } from "../model";
import { Paginated, PagingDTO } from "@shared/model/paging";
import { ICacheService } from "@shared/interfaces/cache";
import { CacheKeyGenerator } from "@shared/ultils/cache-keys";
import { prisma } from "@shared/components/prisma";
import Logger from "@shared/ultils/logger";
import { cacheConfig } from "@shared/components/config";

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


export class CachedPostQueryRepository implements IPostQueryRepository {
  constructor(
    private readonly baseRepository: IPostQueryRepository,
    private readonly cacheService: ICacheService
  ) {}

  async findById(id: string): Promise<Post | null> {
    const cacheKey = CacheKeyGenerator.postById(id);
    
    try {
      const cached = await this.cacheService.get<Post>(cacheKey);
      if (cached !== null) {
        Logger.info(`Cache hit for post ID: ${id}`);
        return cached;
      }
    } catch (error) {
      Logger.error(`Cache error for findById ${id}: ${(error as Error).message}`);
    }

    const result = await this.baseRepository.findById(id);
    
    if (result) {
      try {
        await this.cacheService.set(cacheKey, result, cacheConfig.ttl.entity);
        Logger.info(`Cached post ID: ${id}`);
      } catch (error) {
        Logger.error(`Cache set error for findById ${id}: ${(error as Error).message}`);
      }
    }
    
    return result;
  }

  async findByCond(condition: PostCondDTO): Promise<Post | null> {
    const cacheKey = CacheKeyGenerator.postByCond(condition);
    
    try {
      const cached = await this.cacheService.get<Post>(cacheKey);
      if (cached !== null) {
        Logger.info(`Cache hit for post condition: ${JSON.stringify(condition)}`);
        return cached;
      }
    } catch (error) {
      Logger.error(`Cache error for findByCond: ${(error as Error).message}`);
    }

    const result = await this.baseRepository.findByCond(condition);
    
    if (result) {
      try {
        await this.cacheService.set(cacheKey, result, cacheConfig.ttl.search);
        Logger.info(`Cached post condition: ${JSON.stringify(condition)}`);
      } catch (error) {
        Logger.error(`Cache set error for findByCond: ${(error as Error).message}`);
      }
    }
    
    return result;
  }

  async list(condition: PostCondDTO, paging: PagingDTO): Promise<Paginated<Post>> {
    const cacheKey = CacheKeyGenerator.postList(condition, paging);
    
    try {
      const cached = await this.cacheService.get<Paginated<Post>>(cacheKey);
      if (cached !== null) {
        Logger.info(`Cache hit for post list: ${JSON.stringify({ condition, paging })}`);
        return cached;
      }
    } catch (error) {
      Logger.error(`Cache error for list: ${(error as Error).message}`);
    }

    const result = await this.baseRepository.list(condition, paging);
    
    try {
      await this.cacheService.set(cacheKey, result, cacheConfig.ttl.list);
      Logger.info(`Cached post list: ${JSON.stringify({ condition, paging })}`);
    } catch (error) {
      Logger.error(`Cache set error for list: ${(error as Error).message}`);
    }
    
    return result;
  }

  async listByIds(ids: string[]): Promise<Post[]> {
    if (ids.length === 0) {
      return [];
    }

    const cacheKey = CacheKeyGenerator.postByIds(ids);
    
    try {
      const cached = await this.cacheService.get<Post[]>(cacheKey);
      if (cached !== null) {
        Logger.info(`Cache hit for post IDs: ${ids.join(',')}`);
        return cached;
      }
    } catch (error) {
      Logger.error(`Cache error for listByIds: ${(error as Error).message}`);
    }

    const result = await this.baseRepository.listByIds(ids);
    
    try {
      await this.cacheService.set(cacheKey, result, cacheConfig.ttl.bulk);
      
      const keyValues = result.map(post => ({
        key: CacheKeyGenerator.postById(post.id),
        value: post,
        ttl: cacheConfig.ttl.entity
      }));
      
      if (keyValues.length > 0) {
        await this.cacheService.mset(keyValues);
      }
      
      Logger.info(`Cached post IDs: ${ids.join(',')}`);
    } catch (error) {
      Logger.error(`Cache set error for listByIds: ${(error as Error).message}`);
    }
    
    return result;
  }
}

export class CachedPostCommandRepository implements IPostCommandRepository {
  constructor(
    private readonly baseRepository: IPostCommandRepository,
    private readonly cacheService: ICacheService
  ) {}

  async insert(data: Post): Promise<boolean> {
    const result = await this.baseRepository.insert(data);
    
    if (result) {
      await this.invalidatePostCaches(data.id);
      Logger.info(`Invalidated caches after inserting post: ${data.id}`);
    }
    
    return result;
  }

  async update(id: string, dto: UpdatePostDTO): Promise<boolean> {
    const result = await this.baseRepository.update(id, dto);
    
    if (result) {
      await this.invalidatePostCaches(id);
      Logger.info(`Invalidated caches after updating post: ${id}`);
    }
    
    return result;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.baseRepository.delete(id);
    
    if (result) {
      await this.invalidatePostCaches(id);
      Logger.info(`Invalidated caches after deleting post: ${id}`);
    }
    
    return result;
  }

  private async invalidatePostCaches(postId: string): Promise<void> {
    try {
      const cacheKeys = [
        CacheKeyGenerator.postById(postId)
      ];
      
      const patterns = [
        CacheKeyGenerator.postListPattern(),
        CacheKeyGenerator.postIdsPattern(),
        CacheKeyGenerator.postCondPattern()
      ];

      for (const key of cacheKeys) {
        await this.cacheService.del(key);
      }

      for (const pattern of patterns) {
        await this.cacheService.delPattern(pattern);
      }
    } catch (error) {
      Logger.error(`Error invalidating post caches for ${postId}: ${(error as Error).message}`);
    }
  }
}
