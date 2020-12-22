import axios, {
  AxiosRequestConfig,
  AxiosError,
  Canceler,
  AxiosResponse,
} from "axios";

export interface Resource<TPayload> extends AxiosRequestConfig {
  payload?: TPayload;
}

export type Request<T = any> = (...args: any[]) => Resource<T>;

export type Payload<TRequest extends Request> = ReturnType<TRequest>["payload"];

export interface RequestFactory<TRequest extends Request> {
  (...args: Parameters<TRequest>): {
    cancel: Canceler;
    ready: () => Promise<Payload<TRequest>>;
  };
}

export interface RequestDispatcher<TRequest extends Request> {
  (...args: Parameters<TRequest>): Canceler;
}

// Normalize the error response returned from our hooks
export interface RequestError<T = any> {
  data: T;
  message: string;
  code?: string;
  isCancel: boolean;
}

export function request<TPayload>(
  config: AxiosRequestConfig,
  // we use 'payload' to enable non-ts applications to leverage type safety and
  // as a argument sugar that allow us to extract the payload type easily
  _payload?: TPayload,
): Resource<TPayload> {
  // we also ignore it here, so the payload value won't propagate as a possible
  // undefined, where its default value is actually `null`.
  return config;
}

export function createRequestError<T = any>(
  error: AxiosError,
): RequestError<T> {
  const data = (error.response as AxiosResponse<T>).data;

  return {
    data,
    message: error.message,
    code:
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ((data as any)?.code as string) ||
      error?.code ||
      ((error?.response?.status as unknown) as string),
    isCancel: axios.isCancel(error),
  };
}
