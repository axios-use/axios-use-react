import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  Canceler,
} from "axios";

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

export function request<TPayload>(
  config: AxiosRequestConfig,
  // we use 'payload' to enable non-ts applications to leverage type safety and
  // as a argument sugar that allow us to extract the payload type easily
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _payload?: TPayload,
): Resource<TPayload> {
  // we also ignore it here, so the payload value won't propagate as a possible
  // undefined, where its default value is actually `null`.
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
