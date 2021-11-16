import type {
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  Canceler,
} from "axios";
import axios from "axios";

export type AxiosRestResponse<D> = Omit<AxiosResponse<unknown, D>, "data">;

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
      [Payload<TRequest>, AxiosRestResponse<CData<TRequest>>]
    >;
  };
}

export interface RequestDispatcher<TRequest extends Request> {
  (...args: Parameters<TRequest>): Canceler;
}

// Normalize the error response returned from our hooks
export interface RequestError<T, D = any> {
  data?: T;
  message: string;
  code?: string | number;
  isCancel: boolean;
  original: AxiosError<T, D>;
}

export function request<T, D = any>(
  config: AxiosRequestConfig<D>,
): Resource<T, D> {
  return config;
}

export function createRequestError<T = any, D = any>(
  error: AxiosError<T, D>,
): RequestError<T, D> {
  const data = error?.response?.data;
  const code =
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ((data as any)?.code as string) || error?.code || error?.response?.status;

  return {
    code,
    data,
    message: error?.message,
    isCancel: axios.isCancel(error),
    original: error,
  };
}
