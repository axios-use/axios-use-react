import {
  useEffect,
  useCallback,
  useContext,
  useReducer,
  useMemo,
  useRef,
} from "react";
import type { Canceler } from "axios";
import { useRequest } from "./useRequest";
import type {
  Payload,
  RequestError,
  Request,
  RequestDispatcher,
  AxiosRestResponse,
  Resource,
} from "./request";
import type {
  RequestContextValue,
  RequestContextConfig,
} from "./requestContext";
import { RequestContext } from "./requestContext";
import type { CacheKey, CacheKeyFn } from "./cache";

import { useDeepMemo, useMountedState, getStrByFn } from "./utils";

const REQUEST_CLEAR_MESSAGE =
  "A new request has been made before completing the last one";

type RequestState<TRequest extends Request> = {
  data?: Payload<TRequest>;
  other?: AxiosRestResponse;
  error?: RequestError<Payload<TRequest>>;
  isLoading: boolean;
};

export type UseResourceResult<TRequest extends Request> = [
  RequestState<TRequest> & { cancel: Canceler },
  RequestDispatcher<TRequest>,
];

export type UseResourceOptions<T extends Request> = Pick<
  RequestContextConfig<Payload<T>>,
  "cache" | "cacheFilter"
> & {
  cacheKey?: CacheKey | CacheKeyFn<T>;
  /** Conditional Fetching */
  filter?: (...args: Parameters<T>) => boolean;
};

type Action<T> =
  | { type: "success"; data: T; other: AxiosRestResponse }
  | { type: "error"; error: RequestError<T> }
  | { type: "reset" | "start" };

function getNextState<TRequest extends Request>(
  state: RequestState<TRequest>,
  action: Action<Payload<TRequest>>,
): RequestState<TRequest> {
  return {
    data: action.type === "success" ? action.data : state.data,
    other: action.type === "success" ? action.other : state.other,
    error: action.type === "error" ? action.error : undefined,
    isLoading: action.type === "start" ? true : false,
  };
}

export function useResource<TRequest extends Request>(
  fn: TRequest,
  requestParams?: Parameters<TRequest>,
  options?: UseResourceOptions<TRequest>,
): UseResourceResult<TRequest> {
  const getMountedState = useMountedState();
  const RequestConfig =
    useContext<RequestContextValue<Payload<TRequest>>>(RequestContext);

  const fnOptions = useDeepMemo(
    fn(...(requestParams || [])) as Resource<Payload<TRequest>>,
  );
  const requestCache = useMemo(() => {
    const filter = options?.cacheFilter || RequestConfig?.cacheFilter;
    if (filter && typeof filter === "function") {
      if (filter(fnOptions)) {
        return options?.cache ?? RequestConfig?.cache;
      }
      return undefined;
    }

    if (
      fnOptions?.method === null ||
      fnOptions?.method === undefined ||
      /^get$/i.test(fnOptions.method)
    ) {
      return options?.cache ?? RequestConfig?.cache;
    }
    return undefined;
  }, [
    RequestConfig?.cache,
    RequestConfig?.cacheFilter,
    fnOptions,
    options?.cache,
    options?.cacheFilter,
  ]);
  const cacheKey = useMemo(() => {
    return (
      (requestCache &&
        (getStrByFn(options?.cacheKey, fnOptions) ??
          getStrByFn(RequestConfig?.cacheKey, fnOptions))) ||
      undefined
    );
  }, [RequestConfig?.cacheKey, fnOptions, options?.cacheKey, requestCache]);
  const cacheData = useMemo(() => {
    return requestCache && cacheKey && typeof requestCache.get === "function"
      ? requestCache.get(cacheKey) ?? undefined
      : undefined;
  }, [cacheKey, requestCache]);

  const [createRequest, { clear }] = useRequest(fn);
  const [state, dispatch] = useReducer(getNextState, {
    data: cacheData,
    isLoading: Boolean(requestParams),
  });

  const request = useCallback(
    (...args: Parameters<TRequest>) => {
      clear(REQUEST_CLEAR_MESSAGE);
      const { ready, cancel } = createRequest(...args);

      void (async () => {
        try {
          getMountedState() && dispatch({ type: "start" });
          const [data, other] = await ready();
          if (getMountedState()) {
            dispatch({ type: "success", data, other });

            cacheKey &&
              requestCache &&
              typeof requestCache.set === "function" &&
              requestCache.set(cacheKey, data);
          }
        } catch (e) {
          const error = e as RequestError<Payload<TRequest>>;
          if (getMountedState() && !error.isCancel) {
            dispatch({ type: "error", error });
          }
        }
      })();

      return cancel;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cacheKey, clear, createRequest, getMountedState],
  );

  const requestRefFn = useRef(request);
  useEffect(() => {
    requestRefFn.current = request;
  }, [request]);
  const filterRefFn = useRef(options?.filter);
  useEffect(() => {
    filterRefFn.current = options?.filter;
  }, [options?.filter]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let canceller: Canceler = () => {};
    if (requestParams) {
      const filter =
        typeof filterRefFn.current === "function"
          ? filterRefFn.current(...requestParams)
          : true;
      if (filter) {
        canceller = requestRefFn.current(...requestParams);
      }
    }
    return canceller;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, useDeepMemo([requestParams]));

  return useMemo(() => {
    const cancel = (message?: string) => {
      getMountedState() && dispatch({ type: "reset" });
      clear(message);
    };

    const result: UseResourceResult<TRequest> = [{ ...state, cancel }, request];
    return result;
  }, [state, request, getMountedState, clear]);
}
