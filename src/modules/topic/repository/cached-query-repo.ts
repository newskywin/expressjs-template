import { ITopicQueryRepository } from "../interfaces";
import { Topic, TopicCondDTO } from "../model";
import { Paginated, PagingDTO } from "@shared/model/paging";
import { ICacheService } from "@shared/interfaces/cache";
import { CacheKeyGenerator } from "@shared/ultils/cache-keys";

import Logger from "@shared/ultils/logger";
import { cacheConfig } from "@shared/components/config";

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
