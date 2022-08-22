import { useEffect, useCallback, useContext, useReducer, useMemo } from "react";
import type { Canceler, AxiosResponse } from "axios";
import { useRequest } from "./useRequest";
import type {
  Payload,
  CData,
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

type RequestState<TRequest extends Request> = {
  data?: Payload<TRequest>;
  response?: AxiosResponse<CData<TRequest>>;
  error?: RequestError<Payload<TRequest>, CData<TRequest>>;
  isLoading?: boolean;

  /** @deprecated Use `response` instead */
  other?: AxiosResponse<CData<TRequest>>;
};

export type UseResourceResult<TRequest extends Request> = [
  RequestState<TRequest> & { cancel: Canceler },
  RequestDispatcher<TRequest>,
  () => Canceler | undefined,
];

export type UseResourceOptions<T extends Request> = Pick<
  RequestContextConfig<Payload<T>>,
  "cache" | "cacheFilter" | "instance"
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

type Action<T, D = any> =
  | { type: "success"; data: T; response: AxiosResponse<D> }
  | { type: "error"; error: RequestError<T, D> }
  | { type: "reset" | "start" };

function getNextState<TRequest extends Request>(
  state: RequestState<TRequest>,
  action: Action<Payload<TRequest>, CData<TRequest>>,
): RequestState<TRequest> {
  const response = action.type === "success" ? action.response : state.response;

  return {
    data: action.type === "success" ? action.data : state.data,
    response,
    error: action.type === "error" ? action.error : undefined,
    isLoading: action.type === "start" ? true : false,
    // will be deleted
    other: response,
  };
}

export function useResource<TRequest extends Request>(
  fn: TRequest,
  requestParams?: Parameters<TRequest> | false,
  options?: UseResourceOptions<TRequest>,
): UseResourceResult<TRequest> {
  const getMountedState = useMountedState();
  const RequestConfig =
    useContext<RequestContextValue<Payload<TRequest>>>(RequestContext);

  const fnOptions = useDeepMemo(
    fn(...(requestParams || [])) as Resource<
      Payload<TRequest>,
      CData<TRequest>
    >,
  );
  const requestCache = useMemo(() => {
    const filter = options?.cacheFilter || RequestConfig.cacheFilter;
    if (filter && typeof filter === "function") {
      if (filter(fnOptions)) {
        return options?.cache ?? RequestConfig.cache;
      }
      return undefined;
    }

    if (
      fnOptions?.method === null ||
      fnOptions?.method === undefined ||
      /^get$/i.test(fnOptions.method)
    ) {
      return options?.cache ?? RequestConfig.cache;
    }
    return undefined;
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
        (getStrByFn(options?.cacheKey, fnOptions) ??
          getStrByFn(RequestConfig.cacheKey, fnOptions))) ||
      undefined
    );
  }, [RequestConfig.cacheKey, fnOptions, options?.cacheKey, requestCache]);
  const cacheData = useMemo(() => {
    return requestCache && cacheKey && typeof requestCache.get === "function"
      ? requestCache.get(cacheKey) ?? undefined
      : undefined;
  }, [cacheKey, requestCache]);

  const [createRequest, { clear }] = useRequest(fn, {
    onCompleted: options?.onCompleted,
    onError: options?.onError,
    instance: options?.instance,
  });
  const [state, dispatch] = useReducer(getNextState, {
    data: cacheData,
    isLoading: getDefaultStateLoading<TRequest>(requestParams, options?.filter),
    ...options?.defaultState,
  });

  const request = useCallback(
    (...args: Parameters<TRequest>) => {
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
          const error = e as RequestError<Payload<TRequest>, CData<TRequest>>;
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
      const _args = (requestParams || []) as Parameters<TRequest>;
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
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let canceller: Canceler = () => {};
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

    const result: UseResourceResult<TRequest> = [
      { ...state, cancel },
      request,
      refresh,
    ];
    return result;
  }, [state, request, refresh, getMountedState, clear]);
}
