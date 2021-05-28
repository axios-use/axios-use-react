import type {
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  Canceler,
} from "axios";
import axios from "axios";

export type AxiosRestResponse = Omit<AxiosResponse, "data">;

export interface Resource<TPayload> extends AxiosRequestConfig {
  payload?: TPayload;
}

export type Request<T = any> = (...args: any[]) => Resource<T>;

export type Payload<TRequest extends Request> = ReturnType<TRequest>["payload"];

export interface RequestFactory<TRequest extends Request> {
  (...args: Parameters<TRequest>): {
    cancel: Canceler;
    ready: () => Promise<[Payload<TRequest>, AxiosRestResponse]>;
  };
}

export interface RequestDispatcher<TRequest extends Request> {
  (...args: Parameters<TRequest>): Canceler;
}

// Normalize the error response returned from our hooks
export interface RequestError<T> {
  data?: T;
  message: string;
  code?: string | number;
  isCancel: boolean;
  original: AxiosError<T>;
}

export function request<T>(config: AxiosRequestConfig): Resource<T> {
  return config;
}

export function createRequestError<T = any>(
  error: AxiosError<T>,
): RequestError<T> {
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
