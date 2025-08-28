import { EventHandler } from "@shared/interfaces";
import { ICacheService } from "@shared/interfaces/cache";
import { PostCreatedEvent, PostDeletedEvent, EvtPostCreated, EvtPostDeleted } from "@shared/event/topic.evt";
import { CacheKeyGenerator } from "@shared/ultils/cache-keys";
import Logger from "@shared/ultils/logger";

export class CacheEventHandlers {
  constructor(private readonly cacheService: ICacheService) {}

  getPostCreatedHandler(): EventHandler {
    return async (msg: string) => {
      try {
        const eventData = JSON.parse(msg);
        if (eventData.eventName !== EvtPostCreated) {
          return;
        }
        
        const event = PostCreatedEvent.from(eventData);
        const { topicId } = event.payload;
        
        await this.cacheService.del(CacheKeyGenerator.topicById(topicId));
        await this.cacheService.delPattern(CacheKeyGenerator.topicListPattern());
        await this.cacheService.delPattern(CacheKeyGenerator.topicIdsPattern());
        await this.cacheService.delPattern(CacheKeyGenerator.postListPattern());
        
        Logger.info(`Invalidated caches for post created event - topicId: ${topicId}`);
      } catch (error) {
        Logger.error(`Error handling PostCreated event: ${(error as Error).message}`);
      }
    };
  }

  getPostDeletedHandler(): EventHandler {
    return async (msg: string) => {
      try {
        const eventData = JSON.parse(msg);
        if (eventData.eventName !== EvtPostDeleted) {
          return;
        }
        
        const event = PostDeletedEvent.from(eventData);
        const { topicId } = event.payload;
        
        await this.cacheService.del(CacheKeyGenerator.topicById(topicId));
        await this.cacheService.delPattern(CacheKeyGenerator.topicListPattern());
        await this.cacheService.delPattern(CacheKeyGenerator.topicIdsPattern());
        await this.cacheService.delPattern(CacheKeyGenerator.postListPattern());
        
        Logger.info(`Invalidated caches for post deleted event - topicId: ${topicId}`);
      } catch (error) {
        Logger.error(`Error handling PostDeleted event: ${(error as Error).message}`);
      }
    };
  }
}
