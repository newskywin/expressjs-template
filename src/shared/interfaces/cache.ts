export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<boolean>;
  del(key: string): Promise<boolean>;
  delPattern(pattern: string): Promise<number>;
  exists(key: string): Promise<boolean>;
  mget<T>(keys: string[]): Promise<(T | null)[]>;
  mset<T>(keyValues: Array<{key: string, value: T, ttl?: number}>): Promise<boolean>;
}
export interface CacheConfig {
  enabled: boolean;
  prefix: string;
  ttl: {
    entity: number;
    list: number;
    bulk: number;
    search: number;
  };
}