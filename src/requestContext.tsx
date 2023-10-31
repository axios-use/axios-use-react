import React, { createContext, useMemo } from "react";
import type { PropsWithChildren } from "react";
import type { AxiosInstance, AxiosResponse } from "axios";

import type { RequestError } from "./request";
import type { Cache, CacheKeyFn, CacheFilter } from "./cache";
import { defaultCacheKeyGenerator, wrapCache } from "./cache";
import { _ttlcache } from "./cachettl";

export type RequestContextConfig<T = any, E = any> = {
  instance?: AxiosInstance;
  cache?: Cache<T> | false;
  cacheKey?: CacheKeyFn<T>;
  cacheFilter?: CacheFilter<T>;
  customCreateReqError?: (err: any) => RequestError<T, any, E>;
  /** custom `data` value. @default response['data'] */
  getResponseItem?: (res?: any) => unknown;
};

export type RequestContextValue<T = any, E = any> = RequestContextConfig<T, E>;

const cache = wrapCache(_ttlcache);

const defaultConfig: RequestContextConfig = {
  cache,
  cacheKey: defaultCacheKeyGenerator,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  getResponseItem: (res: AxiosResponse) => res?.data,
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
    getResponseItem,
    ...rest
  } = props;

  const providerValue = useMemo(
    () => ({
      instance,
      cache,
      cacheKey,
      cacheFilter,
      customCreateReqError,
      getResponseItem,
    }),
    [
      cache,
      cacheFilter,
      cacheKey,
      customCreateReqError,
      getResponseItem,
      instance,
    ],
  );

  return (
    <RequestContext.Provider value={providerValue} {...rest}>
      {children}
    </RequestContext.Provider>
  );
};

RequestProvider.defaultProps = defaultConfig;

export const RequestConsumer = RequestContext.Consumer;
