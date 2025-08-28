import { ITopicCommandRepository } from "../interfaces";
import { Topic, TopicUpdateDTO } from "../model";
import { ICacheService } from "@shared/interfaces/cache";
import { CacheKeyGenerator } from "@shared/ultils/cache-keys";
import Logger from "@shared/ultils/logger";

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
