import { createContext } from "react";
import type { AxiosInstance } from "axios";

import { Cache, wrapCache } from "./cache";

export type RequestContextConfig<T = any> = {
  axiosInstance?: AxiosInstance;
  cache?: Cache<T> | false;
} | null;

const defaultConfig: RequestContextConfig = {
  cache: wrapCache(new Map()),
};

export const RequestContext =
  createContext<RequestContextConfig>(defaultConfig);
RequestContext.displayName = "RequestHookConfig";
export const RequestProvider = RequestContext.Provider;
export const RequestConsumer = RequestContext.Consumer;
