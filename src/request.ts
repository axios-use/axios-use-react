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

export type Payload<T extends Request> = ReturnType<T>["payload"];
export type BodyData<T extends Request> = ReturnType<T>["data"];
/** @deprecated No longer use. Use `BodyData` instead */
export type CData<T extends Request> = BodyData<T>;

export interface RequestFactory<T extends Request> {
  (...args: Parameters<T>): {
    cancel: Canceler;
    ready: () => Promise<[Payload<T>, AxiosResponse<Payload<T>, BodyData<T>>]>;
  };
}

export interface RequestDispatcher<T extends Request> {
  (...args: Parameters<T>): Canceler;
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

export type RequestCallbackFn<T extends Request> = {
  onCompleted?: (
    data: Payload<T>,
    response: AxiosResponse<BodyData<T>>,
  ) => void;
  onError?: (err?: RequestError<Payload<T>, BodyData<T>>) => void;
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
