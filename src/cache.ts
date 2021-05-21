import type { Resource } from "./request";

export type CacheKey = string | number;
export type CacheKeyFn<T = any> = (config: Resource<T>) => CacheKey;
export type CacheFilter<T = any> = (config: Resource<T>) => boolean;

export interface Cache<T = any> {
  get(key: CacheKey): T | null | undefined;
  set(key: CacheKey, value: T): void;
  delete(key: CacheKey): void;
  clear(): void;
}

export function createCacheKey<T = any>(config: Resource<T>): CacheKey {
  return JSON.stringify(config, [
    "url",
    "method",
    "baseURL",
    "headers",
    "params",
    "data",
    "auth",
    "proxy",
  ]);
}

export function wrapCache<T = any>(provider: Cache<T>): Cache {
  return provider;
}
