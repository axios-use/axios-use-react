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

export interface Resource<TPayload, D = any> extends AxiosRequestConfig<D> {
  payload?: TPayload;
}

export type Request<T = any, D = any> = (...args: any[]) => Resource<T, D>;

export type Payload<TRequest extends Request> = ReturnType<TRequest>["payload"];
export type CData<TRequest extends Request> = ReturnType<TRequest>["data"];

export interface RequestFactory<TRequest extends Request> {
  (...args: Parameters<TRequest>): {
    cancel: Canceler;
    ready: () => Promise<
      [Payload<TRequest>, AxiosResponse<Payload<TRequest>, CData<TRequest>>]
    >;
  };
}

export interface RequestDispatcher<TRequest extends Request> {
  (...args: Parameters<TRequest>): Canceler;
}

// Normalize the error response returned from our hooks
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

export type RequestCallbackFn<TRequest extends Request> = {
  onCompleted?: (
    data: Payload<TRequest>,
    response: AxiosResponse<CData<TRequest>>,
  ) => void;
  onError?: (err?: RequestError<Payload<TRequest>, CData<TRequest>>) => void;
};

export function request<T, D = any>(
  config: AxiosRequestConfig<D>,
): Resource<T, D> {
  return config;
}

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
