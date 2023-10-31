import { useEffect, useCallback, useContext, useReducer, useMemo } from "react";
import type { Canceler } from "axios";
import { useRequest } from "./useRequest";
import type {
  Payload,
  BodyData,
  RequestError,
  Request,
  RequestDispatcher,
  RequestCallbackFn,
  Resource,
} from "./request";
import type {
  RequestContextValue,
  RequestContextConfig,
} from "./requestContext";
import { RequestContext } from "./requestContext";
import type { CacheKey, CacheKeyFn } from "./cache";

import { useDeepMemo, useMountedState, useRefFn, getStrByFn } from "./utils";

const REQUEST_CLEAR_MESSAGE =
  "A new request has been made before completing the last one";

type RequestState<T extends Request> = {
  data?: Payload<T, true>;
  response?: Payload<T>;
  error?: RequestError<Payload<T>, BodyData<T>>;
  isLoading?: boolean;

  /** @deprecated Use `response` instead */
  other?: Payload<T>;
};

export type UseResourceResult<T extends Request> = [
  RequestState<T> & { cancel: Canceler },
  RequestDispatcher<T>,
  () => Canceler | undefined,
];

export type UseResourceOptions<T extends Request> = Pick<
  RequestContextConfig<Payload<T>>,
  "cache" | "cacheFilter" | "instance" | "getResponseItem"
> &
  RequestCallbackFn<T> & {
    cacheKey?: CacheKey | CacheKeyFn<T>;
    /** Conditional Fetching */
    filter?: (...args: Parameters<T>) => boolean;
    defaultState?: RequestState<T>;
  };

function getDefaultStateLoading<T extends Request>(
  requestParams?: Parameters<T> | false,
  filter?: (...args: Parameters<T>) => boolean,
) {
  if (requestParams) {
    if (filter && typeof filter === "function") {
      return filter(...requestParams);
    }
    return true;
  }
  return undefined;
}

type Action<T extends Request> =
  | { type: "success"; data: Payload<T, true>; response: Payload<T> }
  | { type: "error"; error: RequestError<Payload<T>, BodyData<T>> }
  | { type: "reset" | "start" };

function getNextState<TRequest extends Request>(
  state: RequestState<TRequest>,
  action: Action<TRequest>,
): RequestState<TRequest> {
  const response = action.type === "success" ? action.response : state.response;

  return {
    data: action.type === "success" ? action.data : state.data,
    response,
    error: action.type === "error" ? action.error : undefined,
    isLoading: action.type === "start",
    // will be deleted
    other: response,
  };
}

export function useResource<T extends Request>(
  fn: T,
  requestParams?: Parameters<T> | false,
  options?: UseResourceOptions<T>,
): UseResourceResult<T> {
  const getMountedState = useMountedState();
  const RequestConfig =
    useContext<RequestContextValue<Payload<T>>>(RequestContext);

  const fnOptions = useMemo(() => {
    try {
      return fn(...(requestParams || [])) as Resource<Payload<T>, BodyData<T>>;
    } catch (error) {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, useDeepMemo([fn, requestParams]));
  const requestCache = useMemo(() => {
    const filter = options?.cacheFilter || RequestConfig.cacheFilter;
    const _cache = options?.cache ?? RequestConfig.cache;
    if (_cache == undefined) {
      return null;
    }

    if (filter && typeof filter === "function") {
      if (fnOptions && filter(fnOptions)) {
        return _cache;
      }
    }

    if (fnOptions?.method == null || /^get$/i.test(fnOptions.method)) {
      return _cache;
    }
    return null;
  }, [
    RequestConfig.cache,
    RequestConfig.cacheFilter,
    fnOptions,
    options?.cache,
    options?.cacheFilter,
  ]);
  const cacheKey = useMemo(() => {
    return (
      (requestCache &&
        fnOptions &&
        (getStrByFn(options?.cacheKey, fnOptions) ??
          getStrByFn(RequestConfig.cacheKey, fnOptions))) ||
      null
    );
  }, [RequestConfig.cacheKey, fnOptions, options?.cacheKey, requestCache]);
  const cacheData = useMemo(() => {
    if (requestCache && cacheKey && typeof requestCache.get === "function") {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return requestCache.get(cacheKey) as Payload<T, true>;
    }
    return null;
  }, [cacheKey, requestCache]);

  const [createRequest, { clear }] = useRequest(fn, {
    onCompleted: options?.onCompleted,
    onError: options?.onError,
    instance: options?.instance,
    getResponseItem: options?.getResponseItem,
  });
  const [state, dispatch] = useReducer(getNextState, {
    data: cacheData ?? undefined,
    isLoading: getDefaultStateLoading<T>(requestParams, options?.filter),
    ...options?.defaultState,
  });

  const request = useCallback(
    (...args: Parameters<T>) => {
      clear(REQUEST_CLEAR_MESSAGE);
      const { ready, cancel } = createRequest(...args);

      void (async () => {
        try {
          getMountedState() && dispatch({ type: "start" });
          const [data, response] = await ready();
          if (getMountedState()) {
            dispatch({ type: "success", data, response });

            cacheKey &&
              requestCache &&
              typeof requestCache.set === "function" &&
              requestCache.set(cacheKey, data);
          }
        } catch (e) {
          const error = e as RequestError<Payload<T>, BodyData<T>>;
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

  const filterRefFn = useRefFn(options?.filter);

  const refresh = useCallback(
    () => {
      const _args = (requestParams || []) as Parameters<T>;
      const _filter =
        typeof filterRefFn.current === "function"
          ? filterRefFn.current(..._args)
          : true;
      if (_filter) {
        return request(..._args);
      }

      return undefined;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [requestParams, request],
  );

  const refreshRefFn = useRefFn(refresh);

  useEffect(() => {
    let canceller: Canceler = () => undefined;
    if (requestParams) {
      const _c = refreshRefFn.current();
      if (_c) {
        canceller = _c;
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

    const result: UseResourceResult<T> = [
      { ...state, cancel },
      request,
      refresh,
    ];
    return result;
  }, [state, request, refresh, getMountedState, clear]);
}
