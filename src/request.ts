import type {
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  Canceler,
} from "axios";
import axios from "axios";

/** @deprecated No longer use. Use `AxiosResponse` instead */
export type AxiosRestResponse<D = any> = Omit<
  AxiosResponse<unknown, D>,
  "data"
>;

export interface Resource<
  T = AxiosResponse,
  D = any,
  K1 extends keyof T = never,
  K2 extends keyof T[K1] = never,
  K3 extends keyof T[K1][K2] = never,
> extends AxiosRequestConfig<D> {
  _payload?: T;
  _payload_item?: [K3] extends [never]
    ? [K2] extends [never]
      ? [K1] extends [never]
        ? T extends AxiosResponse<infer DD> | { data?: infer DD }
          ? DD
          : undefined
        : T[K1]
      : T[K1][K2]
    : T[K1][K2][K3];
}

export type Request<
  T = any,
  D = any,
  K1 extends keyof T = any,
  K2 extends keyof T[K1] = any,
  K3 extends keyof T[K1][K2] = any,
> = (...args: any[]) => Resource<T, D, K1, K2, K3>;

type _AnyKeyValue<T, K> = K extends keyof T ? T[K] : any;

export type Payload<T extends Request, Check = false> = Check extends true
  ? _AnyKeyValue<ReturnType<T>, "_payload_item">
  : T extends Request<AxiosResponse>
  ? Exclude<_AnyKeyValue<ReturnType<T>, "_payload">, undefined>
  : _AnyKeyValue<ReturnType<T>, "_payload">;
export type BodyData<T extends Request> = _AnyKeyValue<ReturnType<T>, "data">;
/** @deprecated No longer use. Use `BodyData` instead */
export type CData<T extends Request> = BodyData<T>;

export type RequestFactory<T extends Request> = (...args: Parameters<T>) => {
  cancel: Canceler;
  ready: () => Promise<readonly [Payload<T, true>, Payload<T>]>;
};

export type RequestDispatcher<T extends Request> = (
  ...args: Parameters<T>
) => Canceler;

/**
 * Normalize the error response returned from `@axios-use/vue`
 */
export interface RequestError<
  T = any,
  D = any,
  E = AxiosError<T, D> | AxiosResponse<T, D>,
> {
  data?: T;
  message: string;
  code?: string | number;
  isCancel: boolean;
  original: E;
}

export type RequestCallbackFn<T extends Request> = {
  /**
   * A callback function that's called when your request successfully completes with zero errors.
   * This function is passed the request's result `data` and `response`.
   */
  onCompleted?: (data: Payload<T, true>, response: Payload<T>) => void;
  /**
   * A callback function that's called when the request encounters one or more errors.
   * This function is passed an `RequestError` object that contains either a networkError object or a `AxiosError`, depending on the error(s) that occurred.
   */
  onError?: (err: RequestError<Payload<T>, BodyData<T>>) => void;
};

/**
 * For TypeScript type deduction
 */
export function _request<
  T,
  D = any,
  K1 extends keyof T = never,
  K2 extends keyof T[K1] = never,
  K3 extends keyof T[K1][K2] = never,
>(config: AxiosRequestConfig<D>): Resource<T, D, K1, K2, K3> {
  return config;
}

/**
 * For TypeScript type deduction
 */
export const request = <T = any, D = any>(config: AxiosRequestConfig<D>) =>
  _request<AxiosResponse<T, D>, D>(config);

export function createRequestError<
  T = any,
  D = any,
  E = AxiosError<T, D> | AxiosResponse<T, D>,
>(error: E): RequestError<T, D, E> {
  const axiosErr = error as unknown as AxiosError<T, D>;
  const axiosRes = error as unknown as AxiosResponse<T, D>;

  const data = axiosErr?.response?.data ?? axiosRes?.data;
  const code =
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ((data as any)?.code as string) ??
    axiosErr?.code ??
    axiosErr?.response?.status ??
    axiosRes?.status;

  const message =
    axiosErr?.message || axiosErr?.response?.statusText || axiosRes?.statusText;

  return {
    code,
    data,
    message,
    isCancel: axios.isCancel(error),
    original: error,
  };
}
