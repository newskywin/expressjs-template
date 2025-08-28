import { IPostQueryRepository } from "../interfaces";
import { Post, PostCondDTO } from "../model";
import { Paginated, PagingDTO } from "@shared/model/paging";
import { ICacheService } from "@shared/interfaces/cache";
import { CacheKeyGenerator } from "@shared/ultils/cache-keys";

import Logger from "@shared/ultils/logger";
import { cacheConfig } from "@shared/components/config";

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
