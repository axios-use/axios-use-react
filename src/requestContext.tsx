import type { PropsWithChildren } from "react";
import { createContext } from "react";
import type { AxiosInstance } from "axios";

import type { Cache } from "./cache";
import { wrapCache } from "./cache";

export type RequestContextConfig<T = any> = {
  instance?: AxiosInstance;
  cache?: Cache<T> | false;
};

export type RequestContextValue<T = any> = RequestContextConfig<T> | null;

const cache = wrapCache(new Map());

const defaultConfig: RequestContextConfig = {
  cache,
};

export const RequestContext = createContext<RequestContextValue>(defaultConfig);
RequestContext.displayName = "RequestHookConfig";

export const RequestProvider = <T extends unknown>(
  props: PropsWithChildren<RequestContextConfig<T>>,
) => {
  const { children, instance, cache, ...rest } = props;

  return (
    <RequestContext.Provider
      value={{ ...defaultConfig, instance, cache }}
      {...rest}>
      {children}
    </RequestContext.Provider>
  );
};

RequestProvider.defaultProps = defaultConfig;

export const RequestConsumer = RequestContext.Consumer;
