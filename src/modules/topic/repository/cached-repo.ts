import { ITopicRepository, ITopicQueryRepository, ITopicCommandRepository } from "../interfaces";
import { Topic, TopicCondDTO, TopicUpdateDTO } from "../model";
import { Paginated, PagingDTO } from "@shared/model/paging";
import { ICacheService } from "@shared/interfaces/cache";
import { CacheKeyGenerator } from "@shared/ultils/cache-keys";
import { prisma } from "@shared/components/prisma";
import Logger from "@shared/ultils/logger";
import { cacheConfig } from "@shared/components/config";

export class CachedTopicRepository implements ITopicRepository {
  private queryRepo: CachedTopicQueryRepository;
  private commandRepo: CachedTopicCommandRepository;

  constructor(
    baseQueryRepo: ITopicQueryRepository,
    baseCommandRepo: ITopicCommandRepository,
    private readonly cacheService: ICacheService
  ) {
    this.queryRepo = new CachedTopicQueryRepository(baseQueryRepo, cacheService);
    this.commandRepo = new CachedTopicCommandRepository(baseCommandRepo, cacheService);
  }

  async create(data: Topic): Promise<boolean> {
    return this.commandRepo.create(data);
  }

  async update(id: string, data: TopicUpdateDTO): Promise<boolean> {
    return this.commandRepo.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return this.commandRepo.delete(id);
  }

  async list(condition: TopicCondDTO, paging: PagingDTO): Promise<Paginated<Topic>> {
    return this.queryRepo.list(condition, paging);
  }

  async findById(id: string): Promise<Topic | null> {
    return this.queryRepo.findById(id);
  }

  async findByCond(condition: TopicCondDTO): Promise<Topic | null> {
    return this.queryRepo.findByCond(condition);
  }

  async findByIds(ids: string[]): Promise<Topic[]> {
    return this.queryRepo.findByIds(ids);
  }

  async increaseTopicPostCount(id: string, field: string, step: number): Promise<boolean> {
    // Perform the actual database operation
    await prisma.topics.update({
      where: { id },
      data: { [field]: { increment: step } },
    });

    // Invalidate cache
    try {
      await this.cacheService.del(CacheKeyGenerator.topicById(id));
      await this.cacheService.delPattern(CacheKeyGenerator.topicListPattern());
      await this.cacheService.delPattern(CacheKeyGenerator.topicIdsPattern());
      
      Logger.info(`Invalidated caches after increasing ${field} for topic: ${id}`);
    } catch (error) {
      Logger.error(`Error invalidating cache for increaseTopicPostCount: ${(error as Error).message}`);
    }
    
    return true;
  }

  async decreaseTopicPostCount(id: string, field: string, step: number): Promise<boolean> {
    // Perform the actual database operation
    await prisma.topics.update({
      where: { id },
      data: { [field]: { decrement: step } },
    });

    // Invalidate cache
    try {
      await this.cacheService.del(CacheKeyGenerator.topicById(id));
      await this.cacheService.delPattern(CacheKeyGenerator.topicListPattern());
      await this.cacheService.delPattern(CacheKeyGenerator.topicIdsPattern());
      
      Logger.info(`Invalidated caches after decreasing ${field} for topic: ${id}`);
    } catch (error) {
      Logger.error(`Error invalidating cache for decreaseTopicPostCount: ${(error as Error).message}`);
    }
    
    return true;
  }
}


export class CachedTopicQueryRepository implements ITopicQueryRepository {
  constructor(
    private readonly baseRepository: ITopicQueryRepository,
    private readonly cacheService: ICacheService
  ) {}

  async findById(id: string): Promise<Topic | null> {
    const cacheKey = CacheKeyGenerator.topicById(id);
    
    try {
      const cached = await this.cacheService.get<Topic>(cacheKey);
      if (cached !== null) {
        Logger.info(`Cache hit for topic ID: ${id}`);
        return cached;
      }
    } catch (error) {
      Logger.error(`Cache error for findById ${id}: ${(error as Error).message}`);
    }

    const result = await this.baseRepository.findById(id);
    
    if (result) {
      try {
        await this.cacheService.set(cacheKey, result, cacheConfig.ttl.entity);
        Logger.info(`Cached topic ID: ${id}`);
      } catch (error) {
        Logger.error(`Cache set error for findById ${id}: ${(error as Error).message}`);
      }
    }
    
    return result;
  }

  async findByCond(condition: TopicCondDTO): Promise<Topic | null> {
    let cacheKey: string;
    
    if (condition.name) {
      cacheKey = CacheKeyGenerator.topicByName(condition.name);
    } else {
      cacheKey = CacheKeyGenerator.topicByCond(condition);
    }
    
    try {
      const cached = await this.cacheService.get<Topic>(cacheKey);
      if (cached !== null) {
        Logger.info(`Cache hit for topic condition: ${JSON.stringify(condition)}`);
        return cached;
      }
    } catch (error) {
      Logger.error(`Cache error for findByCond: ${(error as Error).message}`);
    }

    const result = await this.baseRepository.findByCond(condition);
    
    if (result) {
      try {
        await this.cacheService.set(cacheKey, result, cacheConfig.ttl.search);
        
        if (condition.name) {
          await this.cacheService.set(
            CacheKeyGenerator.topicById(result.id), 
            result, 
            cacheConfig.ttl.entity
          );
        }
        
        Logger.info(`Cached topic condition: ${JSON.stringify(condition)}`);
      } catch (error) {
        Logger.error(`Cache set error for findByCond: ${(error as Error).message}`);
      }
    }
    
    return result;
  }

  async list(condition: TopicCondDTO, paging: PagingDTO): Promise<Paginated<Topic>> {
    const cacheKey = CacheKeyGenerator.topicList(condition, paging);
    
    try {
      const cached = await this.cacheService.get<Paginated<Topic>>(cacheKey);
      if (cached !== null) {
        Logger.info(`Cache hit for topic list: ${JSON.stringify({ condition, paging })}`);
        return cached;
      }
    } catch (error) {
      Logger.error(`Cache error for list: ${(error as Error).message}`);
    }

    const result = await this.baseRepository.list(condition, paging);
    
    try {
      await this.cacheService.set(cacheKey, result, cacheConfig.ttl.list);
      Logger.info(`Cached topic list: ${JSON.stringify({ condition, paging })}`);
    } catch (error) {
      Logger.error(`Cache set error for list: ${(error as Error).message}`);
    }
    
    return result;
  }

  async findByIds(ids: string[]): Promise<Topic[]> {
    if (ids.length === 0) {
      return [];
    }

    const cacheKey = CacheKeyGenerator.topicByIds(ids);
    
    try {
      const cached = await this.cacheService.get<Topic[]>(cacheKey);
      if (cached !== null) {
        Logger.info(`Cache hit for topic IDs: ${ids.join(',')}`);
        return cached;
      }
    } catch (error) {
      Logger.error(`Cache error for findByIds: ${(error as Error).message}`);
    }

    const result = await this.baseRepository.findByIds(ids);
    
    try {
      await this.cacheService.set(cacheKey, result, cacheConfig.ttl.bulk);
      
      const keyValues = result.map(topic => ({
        key: CacheKeyGenerator.topicById(topic.id),
        value: topic,
        ttl: cacheConfig.ttl.entity
      }));
      
      if (keyValues.length > 0) {
        await this.cacheService.mset(keyValues);
      }
      
      Logger.info(`Cached topic IDs: ${ids.join(',')}`);
    } catch (error) {
      Logger.error(`Cache set error for findByIds: ${(error as Error).message}`);
    }
    
    return result;
  }
}

export class CachedTopicCommandRepository implements ITopicCommandRepository {
  constructor(
    private readonly baseRepository: ITopicCommandRepository,
    private readonly cacheService: ICacheService
  ) {}

  async create(data: Topic): Promise<boolean> {
    const result = await this.baseRepository.create(data);
    
    if (result) {
      await this.invalidateTopicCaches(data.id, data.name);
      Logger.info(`Invalidated caches after creating topic: ${data.id}`);
    }
    
    return result;
  }

  async update(id: string, data: TopicUpdateDTO): Promise<boolean> {
    const result = await this.baseRepository.update(id, data);
    
    if (result) {
      await this.invalidateTopicCaches(id);
      if (data.name) {
        await this.cacheService.del(CacheKeyGenerator.topicByName(data.name));
      }
      Logger.info(`Invalidated caches after updating topic: ${id}`);
    }
    
    return result;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.baseRepository.delete(id);
    
    if (result) {
      await this.invalidateTopicCaches(id);
      Logger.info(`Invalidated caches after deleting topic: ${id}`);
    }
    
    return result;
  }

  private async invalidateTopicCaches(topicId: string, topicName?: string): Promise<void> {
    try {
      const cacheKeys = [
        CacheKeyGenerator.topicById(topicId)
      ];
      
      if (topicName) {
        cacheKeys.push(CacheKeyGenerator.topicByName(topicName));
      }
      
      const patterns = [
        CacheKeyGenerator.topicListPattern(),
        CacheKeyGenerator.topicIdsPattern(),
        CacheKeyGenerator.topicCondPattern()
      ];

      for (const key of cacheKeys) {
        await this.cacheService.del(key);
      }

      for (const pattern of patterns) {
        await this.cacheService.delPattern(pattern);
      }
    } catch (error) {
      Logger.error(`Error invalidating topic caches for ${topicId}: ${(error as Error).message}`);
    }
  }
}
