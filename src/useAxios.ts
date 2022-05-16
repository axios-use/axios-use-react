import type { AxiosRequestConfig } from "axios";

import type { Request, Resource } from "./request";
import { request } from "./request";
import type { UseRequestOptions, UseRequestResult } from "./useRequest";
import { useRequest } from "./useRequest";

export type UseAxiosOptions<T = any, D = any> = UseRequestOptions<
  Request<T, D>
>;

export function useAxios<R = any, D = any>(
  config: AxiosRequestConfig<D>,
  options?: UseAxiosOptions<R, D>,
): UseRequestResult<(config?: AxiosRequestConfig<D>) => Resource<R, D>>;
export function useAxios<R = any, D = any>(
  url: string,
  config?: AxiosRequestConfig<D>,
  options?: UseAxiosOptions<R, D>,
): UseRequestResult<(config?: AxiosRequestConfig<D>) => Resource<R, D>>;

export function useAxios<R = any, D = any>(...args: any[]) {
  const [url, argsPlaceholder] =
    typeof args[0] === "string" ? [args[0], 1] : [undefined, 0];
  let defaultConfig: AxiosRequestConfig<D> = {};
  let options: UseAxiosOptions<R, D> = {};

  if (args.length > 0 + argsPlaceholder) {
    defaultConfig = {
      url,
      ...args[0 + argsPlaceholder],
    } as AxiosRequestConfig<D>;
  } else {
    defaultConfig = { url } as AxiosRequestConfig<D>;
  }

  if (args.length > 1 + argsPlaceholder) {
    options = args[1] as UseAxiosOptions<R, D>;
  }

  const res = useRequest(
    (config?: AxiosRequestConfig<D>) =>
      request<R, D>({ ...defaultConfig, ...config }),
    options,
  );

  return res;
}
