import React from "react";
import type { PropsWithChildren } from "react";
import { createContext } from "react";
import type { AxiosInstance } from "axios";

import type { RequestError } from "./request";
import type { Cache, CacheKeyFn, CacheFilter } from "./cache";
import { createCacheKey, wrapCache } from "./cache";
import { _ttlcache } from "./cachettl";

export type RequestContextConfig<T = any, E = any> = {
  instance?: AxiosInstance;
  cache?: Cache<T> | false;
  cacheKey?: CacheKeyFn<T>;
  cacheFilter?: CacheFilter<T>;
  customCreateReqError?: (err: any) => RequestError<T, any, E>;
};

export type RequestContextValue<T = any, E = any> = RequestContextConfig<T, E>;

const cache = wrapCache(_ttlcache);

const defaultConfig: RequestContextConfig = {
  cache,
  cacheKey: createCacheKey,
};

export const RequestContext = createContext<RequestContextValue>(defaultConfig);
RequestContext.displayName = "RequestHookConfig";

export const RequestProvider = <T,>(
  props: PropsWithChildren<RequestContextConfig<T>>,
) => {
  const {
    children,
    instance,
    cache,
    cacheKey,
    cacheFilter,
    customCreateReqError,
    ...rest
  } = props;

  return (
    <RequestContext.Provider
      value={{
        instance,
        cache,
        cacheKey,
        cacheFilter,
        customCreateReqError,
      }}
      {...rest}>
      {children}
    </RequestContext.Provider>
  );
};

RequestProvider.defaultProps = defaultConfig;

export const RequestConsumer = RequestContext.Consumer;
