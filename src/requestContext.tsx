import React from "react";
import type { PropsWithChildren } from "react";
import { createContext } from "react";
import type { AxiosInstance } from "axios";

import type { Cache, CacheKeyFn, CacheFilter } from "./cache";
import { createCacheKey, wrapCache } from "./cache";

export type RequestContextConfig<T = any> = {
  instance?: AxiosInstance;
  cache?: Cache<T> | false;
  cacheKey?: CacheKeyFn<T>;
  cacheFilter?: CacheFilter<T>;
};

export type RequestContextValue<T = any> = RequestContextConfig<T> | null;

const cache = wrapCache(new Map());

const defaultConfig: RequestContextConfig = {
  cache,
  cacheKey: createCacheKey,
};

export const RequestContext = createContext<RequestContextValue>(defaultConfig);
RequestContext.displayName = "RequestHookConfig";

export const RequestProvider = <T extends unknown>(
  props: PropsWithChildren<RequestContextConfig<T>>,
) => {
  const { children, instance, cache, cacheKey, cacheFilter, ...rest } = props;

  return (
    <RequestContext.Provider
      value={{
        instance,
        cache,
        cacheKey,
        cacheFilter,
      }}
      {...rest}>
      {children}
    </RequestContext.Provider>
  );
};

RequestProvider.defaultProps = defaultConfig;

export const RequestConsumer = RequestContext.Consumer;
