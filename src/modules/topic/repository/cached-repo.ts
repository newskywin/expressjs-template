import { ITopicRepository, ITopicQueryRepository, ITopicCommandRepository } from "../interfaces";
import { Topic, TopicCondDTO, TopicUpdateDTO } from "../model";
import { Paginated, PagingDTO } from "@shared/model/paging";
import { ICacheService } from "@shared/interfaces/cache";
import { CachedTopicQueryRepository } from "./cached-query-repo";
import { CachedTopicCommandRepository } from "./cached-command-repo";
import { CacheKeyGenerator } from "@shared/ultils/cache-keys";
import { prisma } from "@shared/components/prisma";
import Logger from "@shared/ultils/logger";

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
