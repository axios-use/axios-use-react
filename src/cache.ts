import { hash } from "object-code";
import type { Method } from "axios";

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

const SLASHES_REGEX = /^\/|\/$/g;

export const defaultCacheKeyGenerator = <T = any, D = any>(
  config: Resource<T, D>,
): CacheKey => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { url, method, baseURL, headers, data, params } = config;
  const _baseURL = baseURL ? baseURL.replace(SLASHES_REGEX, "") : baseURL;
  const _url = url ? url.replace(SLASHES_REGEX, "") : url;
  const _method = method ? (method.toLowerCase() as Method) : method;

  return hash({
    url: _url,
    method: _method,
    baseURL: _baseURL,
    headers,
    data,
    params: params as unknown,
  });
};

/** @deprecated Use `defaultCacheKeyGenerator` instead */
export const createCacheKey = null;

export function wrapCache<T = any>(provider: Cache<T>): Cache {
  return provider;
}
