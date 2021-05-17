import { createContext } from "react";
import type { AxiosInstance } from "axios";

import type { Cache } from "./cache";
import { wrapCache } from "./cache";

export type RequestContextConfig<T = any> = {
  axiosInstance?: AxiosInstance;
  cache?: Cache<T> | false;
};

export type RequestContextValue<T = any> = RequestContextConfig<T> | null;

const defaultConfig: RequestContextConfig = {
  cache: wrapCache(new Map()),
};

export const RequestContext = createContext<RequestContextValue>(defaultConfig);
RequestContext.displayName = "RequestHookConfig";
export const RequestProvider = RequestContext.Provider;
export const RequestConsumer = RequestContext.Consumer;
