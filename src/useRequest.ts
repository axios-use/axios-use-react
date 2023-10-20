import { useState, useCallback, useContext, useEffect } from "react";
import type {
  AxiosError,
  CancelTokenSource,
  Canceler,
  CancelToken,
  AxiosInstance,
} from "axios";
import axios from "axios";
import type {
  RequestFactory,
  RequestCallbackFn,
  Request,
  Payload,
  BodyData,
  RequestError,
} from "./request";
import { createRequestError } from "./request";
import { RequestContext } from "./requestContext";

import { useMountedState, useRefFn } from "./utils";

export type UseRequestOptions<TRequest extends Request> =
  RequestCallbackFn<TRequest> & {
    instance?: AxiosInstance;
  };

export type UseRequestResult<TRequest extends Request> = [
  RequestFactory<TRequest>,
  {
    hasPending: boolean;
    clear: Canceler;
  },
];

export function useRequest<T extends Request>(
  fn: T,
  options?: UseRequestOptions<T>,
): UseRequestResult<T> {
  const getMountedState = useMountedState();
  const RequestConfig = useContext(RequestContext);
  const axiosInstance = options?.instance || RequestConfig.instance || axios;
  const customCreateReqError = RequestConfig.customCreateReqError;

  const [sources, setSources] = useState<CancelTokenSource[]>([]);
  const hasPending = sources.length > 0;

  const removeCancelToken = useCallback(
    (cancelToken: CancelToken) => {
      if (getMountedState()) {
        setSources((prevSources) =>
          prevSources.filter((source) => source.token !== cancelToken),
        );
      }
    },
    [getMountedState],
  );

  const { onCompleted, onError } = options || {};
  const onCompletedRef = useRefFn(onCompleted);
  const onErrorRef = useRefFn(onError);

  const callFn = useRefFn(fn);

  const request = useCallback(
    (...args: Parameters<T>) => {
      const config = callFn.current(...args);
      const source = axios.CancelToken.source();

      const ready = () => {
        if (getMountedState()) {
          setSources((prevSources) => [...prevSources, source]);
        }
        return axiosInstance({ ...config, cancelToken: source.token })
          .then((response) => {
            removeCancelToken(source.token);

            onCompletedRef.current?.(
              response.data as Payload<T, true>,
              response as Payload<T>,
            );
            return [response.data, response as Payload<T>] as const;
          })
          .catch((err: AxiosError<Payload<T>, BodyData<T>>) => {
            removeCancelToken(source.token);

            const error = customCreateReqError
              ? customCreateReqError(err)
              : createRequestError(err);

            onErrorRef.current?.(
              error as RequestError<Payload<T>, BodyData<T>>,
            );

            throw error;
          });
      };

      return {
        ready,
        cancel: source.cancel,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [axiosInstance, customCreateReqError, getMountedState, removeCancelToken],
  );

  const clear = useCallback(
    (message?: string) => {
      if (sources.length > 0) {
        sources.map((source) => source.cancel(message));
        if (getMountedState()) {
          setSources([]);
        }
      }
    },
    [getMountedState, sources],
  );

  const clearRef = useRefFn(clear);

  const rtnClearFn = useCallback(
    (message?: string) => clearRef.current(message),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    return clearRef.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [request, { clear: rtnClearFn, hasPending }];
}
