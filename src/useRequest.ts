import { useState, useCallback, useContext, useRef, useEffect } from "react";
import axios, {
  AxiosError,
  CancelTokenSource,
  Canceler,
  CancelToken,
  AxiosResponse,
} from "axios";
import {
  createRequestError,
  RequestFactory,
  Request,
  Payload,
  AxiosRestResponse,
} from "./request";
import { RequestContext } from "./requestContext";

import { useMountedState } from "./utils";

const REQUEST_AXIOS_INSTANCE_MESSAGE =
  "react-request-hook requires an Axios instance to be passed through context via the <RequestProvider>";

export type UseRequestResult<TRequest extends Request> = [
  {
    hasPending: boolean;
    clear: Canceler;
  },
  RequestFactory<TRequest>,
];

export function useRequest<TRequest extends Request>(
  fn: TRequest,
): UseRequestResult<TRequest> {
  const getMountedState = useMountedState();
  const axiosInstance = useContext(RequestContext);
  if (!axiosInstance) {
    throw new Error(REQUEST_AXIOS_INSTANCE_MESSAGE);
  }

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

  const callFn = useRef(fn);
  useEffect(() => {
    callFn.current = fn;
  }, [fn]);

  const request = useCallback(
    (...args: Parameters<TRequest>) => {
      const config = callFn.current(...args);
      const source = axios.CancelToken.source();

      const ready = () => {
        if (getMountedState()) {
          setSources((prevSources) => [...prevSources, source]);
        }
        return axiosInstance({ ...config, cancelToken: source.token })
          .then((response: AxiosResponse<Payload<TRequest>>) => {
            removeCancelToken(source.token);
            const { data, ...restResponse } = response;
            return [data, restResponse];
          })
          .catch((error: AxiosError<Payload<TRequest>>) => {
            removeCancelToken(source.token);
            throw createRequestError(error);
          }) as Promise<[Payload<TRequest>, AxiosRestResponse]>;
      };

      return {
        ready,
        cancel: source.cancel,
      };
    },
    [axiosInstance, getMountedState, removeCancelToken],
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

  const clearRef = useRef(clear);
  useEffect(() => {
    clearRef.current = clear;
  });

  const rtnClearFn = useCallback(
    (message?: string) => clearRef.current(message),
    [],
  );

  useEffect(() => {
    return clearRef.current;
  }, []);

  return [{ clear: rtnClearFn, hasPending }, request];
}
