import { IPostCommandRepository } from "../interfaces";
import { Post, UpdatePostDTO } from "../model";
import { ICacheService } from "@shared/interfaces/cache";
import { CacheKeyGenerator } from "@shared/ultils/cache-keys";
import Logger from "@shared/ultils/logger";

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
