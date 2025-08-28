import { ICacheService } from "@shared/interfaces/cache";
import { RedisClient } from "./redis";

import Logger from "@shared/ultils/logger";
import { cacheConfig } from "./config";

export class RedisCacheService implements ICacheService {
  private redisClient: RedisClient;

  constructor() {
    this.redisClient = RedisClient.getInstance();
  }

  async get<T>(key: string): Promise<T | null> {
    if (!cacheConfig.enabled) {
      return null;
    }

    try {
      const value = await this.redisClient.redisClient.get(key);
      if (value === null) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      Logger.error(`Cache get error for key ${key}: ${(error as Error).message}`);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = cacheConfig.ttl.entity): Promise<boolean> {
    if (!cacheConfig.enabled) {
      return true;
    }

    try {
      const serializedValue = JSON.stringify(value);
      await this.redisClient.redisClient.setEx(key, ttl, serializedValue);
      return true;
    } catch (error) {
      Logger.error(`Cache set error for key ${key}: ${(error as Error).message}`);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!cacheConfig.enabled) {
      return true;
    }

    try {
      await this.redisClient.redisClient.del(key);
      return true;
    } catch (error) {
      Logger.error(`Cache del error for key ${key}: ${(error as Error).message}`);
      return false;
    }
  }

  async delPattern(pattern: string): Promise<number> {
    if (!cacheConfig.enabled) {
      return 0;
    }

    try {
      const keys = await this.redisClient.redisClient.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      await this.redisClient.redisClient.del(keys);
      return keys.length;
    } catch (error) {
      Logger.error(`Cache delPattern error for pattern ${pattern}: ${(error as Error).message}`);
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!cacheConfig.enabled) {
      return false;
    }

    try {
      const result = await this.redisClient.redisClient.exists(key);
      return result === 1;
    } catch (error) {
      Logger.error(`Cache exists error for key ${key}: ${(error as Error).message}`);
      return false;
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!cacheConfig.enabled || keys.length === 0) {
      return keys.map(() => null);
    }

    try {
      const values = await this.redisClient.redisClient.mGet(keys);
      return values.map(value => {
        if (value === null) {
          return null;
        }
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      Logger.error(`Cache mget error for keys ${keys.join(',')}: ${(error as Error).message}`);
      return keys.map(() => null);
    }
  }

  async mset<T>(keyValues: Array<{key: string, value: T, ttl?: number}>): Promise<boolean> {
    if (!cacheConfig.enabled || keyValues.length === 0) {
      return true;
    }

    try {
      const pipeline = this.redisClient.redisClient.multi();
      
      for (const { key, value, ttl = cacheConfig.ttl.entity } of keyValues) {
        const serializedValue = JSON.stringify(value);
        pipeline.setEx(key, ttl, serializedValue);
      }
      
      await pipeline.exec();
      return true;
    } catch (error) {
      Logger.error(`Cache mset error: ${(error as Error).message}`);
      return false;
    }
  }
}
