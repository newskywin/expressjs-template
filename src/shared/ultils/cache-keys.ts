import { cacheConfig } from '@shared/components/config';
import { createHash } from 'crypto';


export class CacheKeyGenerator {
  private static hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    return createHash('md5').update(str).digest('hex').substring(0, 8);
  }

  static postById(id: string): string {
    return `${cacheConfig.prefix}post:id:${id}`;
  }

  static postList(condition: any, paging: any): string {
    const hash = this.hashObject({ condition, paging });
    return `${cacheConfig.prefix}post:list:${hash}`;
  }

  static postByIds(ids: string[]): string {
    const sortedIds = [...ids].sort().join(',');
    const hash = this.hashObject(sortedIds);
    return `${cacheConfig.prefix}post:ids:${hash}`;
  }

  static postByCond(condition: any): string {
    const hash = this.hashObject(condition);
    return `${cacheConfig.prefix}post:cond:${hash}`;
  }

  static topicById(id: string): string {
    return `${cacheConfig.prefix}topic:id:${id}`;
  }

  static topicByName(name: string): string {
    return `${cacheConfig.prefix}topic:name:${name}`;
  }

  static topicList(condition: any, paging: any): string {
    const hash = this.hashObject({ condition, paging });
    return `${cacheConfig.prefix}topic:list:${hash}`;
  }

  static topicByIds(ids: string[]): string {
    const sortedIds = [...ids].sort().join(',');
    const hash = this.hashObject(sortedIds);
    return `${cacheConfig.prefix}topic:ids:${hash}`;
  }

  static topicByCond(condition: any): string {
    const hash = this.hashObject(condition);
    return `${cacheConfig.prefix}topic:cond:${hash}`;
  }

  static postListPattern(): string {
    return `${cacheConfig.prefix}post:list:*`;
  }

  static postIdsPattern(): string {
    return `${cacheConfig.prefix}post:ids:*`;
  }

  static postCondPattern(): string {
    return `${cacheConfig.prefix}post:cond:*`;
  }

  static topicListPattern(): string {
    return `${cacheConfig.prefix}topic:list:*`;
  }

  static topicIdsPattern(): string {
    return `${cacheConfig.prefix}topic:ids:*`;
  }

  static topicCondPattern(): string {
    return `${cacheConfig.prefix}topic:cond:*`;
  }
}
