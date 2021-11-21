import type { Resource } from "./request";

export type CacheKey = string | number;
export type CacheKeyFn<T = any, D = any> = (config: Resource<T, D>) => CacheKey;
export type CacheFilter<T = any, D = any> = (config: Resource<T, D>) => boolean;

export interface Cache<T = any> {
  get(key: CacheKey): T | null | undefined;
  set(key: CacheKey, value: T): void;
  delete(key: CacheKey): void;
  clear(): void;
}

export function createCacheKey<T = any, D = any>(
  config: Resource<T, D>,
): CacheKey {
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
